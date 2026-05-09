import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { LoansService } from './loans.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('LoansService', () => {
  let service: LoansService;

  const mockPrisma = {
    loan: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    contact: {
      findFirst: jest.fn(),
    },
    repayment: {
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  };

  const baseLoan = {
    id: 1,
    direction: 'LENT' as const,
    principal: new Prisma.Decimal('5000'),
    date: new Date('2026-04-01'),
    dueDate: null,
    description: null,
    status: 'OPEN' as const,
    userId: 1,
    contactId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoansService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<LoansService>(LoansService);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('decorates loan with outstanding and isOverdue', async () => {
      mockPrisma.loan.findFirst.mockResolvedValue({
        ...baseLoan,
        contact: { id: 1, name: 'Rahim', phone: null },
        repayments: [{ amount: new Prisma.Decimal('2000') }],
      });
      const result: any = await service.findOne(1, 1);
      expect(result.outstanding).toBe('3000');
      expect(result.isOverdue).toBe(false);
    });

    it('flags overdue when dueDate is past and OPEN', async () => {
      mockPrisma.loan.findFirst.mockResolvedValue({
        ...baseLoan,
        dueDate: new Date(Date.now() - 86400000),
        contact: { id: 1, name: 'Rahim', phone: null },
        repayments: [],
      });
      const result: any = await service.findOne(1, 1);
      expect(result.isOverdue).toBe(true);
    });

    it('throws NotFoundException when loan missing', async () => {
      mockPrisma.loan.findFirst.mockResolvedValue(null);
      await expect(service.findOne(1, 999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('rejects when contact does not belong to user', async () => {
      mockPrisma.contact.findFirst.mockResolvedValue(null);
      await expect(
        service.create(1, {
          direction: 'LENT' as any,
          principal: 100,
          contactId: 99,
          date: '2026-04-01',
        }),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrisma.loan.create).not.toHaveBeenCalled();
    });

    it('creates loan when contact belongs to user', async () => {
      mockPrisma.contact.findFirst.mockResolvedValue({ id: 1, userId: 1 });
      mockPrisma.loan.create.mockResolvedValue({
        ...baseLoan,
        contact: { id: 1, name: 'Rahim', phone: null },
        repayments: [],
      });
      const result: any = await service.create(1, {
        direction: 'LENT' as any,
        principal: 5000,
        contactId: 1,
        date: '2026-04-01',
      });
      expect(result.outstanding).toBe('5000');
    });
  });

  describe('addRepayment', () => {
    it('adds partial repayment and keeps loan OPEN', async () => {
      mockPrisma.loan.findFirst.mockResolvedValue({
        ...baseLoan,
        repayments: [],
      });
      mockPrisma.loan.findUnique.mockResolvedValue({
        ...baseLoan,
        repayments: [{ amount: new Prisma.Decimal('2000') }],
      });
      // findOne after recompute
      mockPrisma.loan.findFirst.mockResolvedValueOnce({
        ...baseLoan,
        repayments: [],
      });
      mockPrisma.loan.findFirst.mockResolvedValueOnce({
        ...baseLoan,
        contact: { id: 1, name: 'Rahim', phone: null },
        repayments: [{ amount: new Prisma.Decimal('2000') }],
      });

      await service.addRepayment(1, 1, { amount: 2000, date: '2026-04-15' });

      expect(mockPrisma.repayment.create).toHaveBeenCalled();
      // status not updated because repaid (2000) < principal (5000)
      expect(mockPrisma.loan.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'SETTLED' } }),
      );
    });

    it('marks loan SETTLED when fully repaid', async () => {
      mockPrisma.loan.findFirst.mockResolvedValueOnce({
        ...baseLoan,
        repayments: [{ amount: new Prisma.Decimal('2000') }],
      });
      mockPrisma.loan.findUnique.mockResolvedValue({
        ...baseLoan,
        repayments: [
          { amount: new Prisma.Decimal('2000') },
          { amount: new Prisma.Decimal('3000') },
        ],
      });
      mockPrisma.loan.findFirst.mockResolvedValueOnce({
        ...baseLoan,
        status: 'SETTLED',
        contact: { id: 1, name: 'Rahim', phone: null },
        repayments: [],
      });

      await service.addRepayment(1, 1, { amount: 3000, date: '2026-04-15' });

      expect(mockPrisma.loan.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'SETTLED' },
      });
    });

    it('rejects repayment that overshoots principal', async () => {
      mockPrisma.loan.findFirst.mockResolvedValue({
        ...baseLoan,
        repayments: [{ amount: new Prisma.Decimal('4000') }],
      });
      await expect(
        service.addRepayment(1, 1, { amount: 2000, date: '2026-04-15' }),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrisma.repayment.create).not.toHaveBeenCalled();
    });

    it('returns 404 when loan belongs to another user', async () => {
      mockPrisma.loan.findFirst.mockResolvedValue(null);
      await expect(
        service.addRepayment(2, 1, { amount: 100, date: '2026-04-15' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('summary', () => {
    it('separates LENT into receivable and BORROWED into payable', async () => {
      mockPrisma.loan.findMany.mockResolvedValue([
        {
          ...baseLoan,
          direction: 'LENT',
          principal: new Prisma.Decimal('5000'),
          repayments: [{ amount: new Prisma.Decimal('1000') }],
        },
        {
          ...baseLoan,
          id: 2,
          direction: 'BORROWED',
          principal: new Prisma.Decimal('2000'),
          repayments: [],
        },
      ]);
      const result = await service.summary(1);
      expect(result.totalReceivable).toBe('4000');
      expect(result.totalPayable).toBe('2000');
      expect(result.openCount).toBe(2);
    });
  });
});
