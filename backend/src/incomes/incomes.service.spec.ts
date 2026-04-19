import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { IncomesService } from './incomes.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('IncomesService', () => {
  let service: IncomesService;

  const mockPrisma = {
    income: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockIncome = {
    id: 1,
    title: 'Salary',
    amount: 3000,
    date: new Date('2026-04-01'),
    source: 'Company',
    description: 'Monthly salary',
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncomesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<IncomesService>(IncomesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated incomes with meta', async () => {
      mockPrisma.income.findMany.mockResolvedValue([mockIncome]);
      mockPrisma.income.count.mockResolvedValue(1);

      const result = await service.findAll(1, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
    });

    it('should apply date range filter', async () => {
      mockPrisma.income.findMany.mockResolvedValue([]);
      mockPrisma.income.count.mockResolvedValue(0);

      await service.findAll(1, { startDate: '2026-04-01', endDate: '2026-04-30' });

      const where = mockPrisma.income.findMany.mock.calls[0][0].where;
      expect(where.date.gte).toEqual(new Date('2026-04-01'));
      expect(where.date.lte).toEqual(new Date('2026-04-30'));
    });

    it('should only apply startDate when endDate is absent', async () => {
      mockPrisma.income.findMany.mockResolvedValue([]);
      mockPrisma.income.count.mockResolvedValue(0);

      await service.findAll(1, { startDate: '2026-04-01' });

      const where = mockPrisma.income.findMany.mock.calls[0][0].where;
      expect(where.date.gte).toBeDefined();
      expect(where.date.lte).toBeUndefined();
    });

    it('should use default pagination values', async () => {
      mockPrisma.income.findMany.mockResolvedValue([]);
      mockPrisma.income.count.mockResolvedValue(0);

      await service.findAll(1, {});

      const args = mockPrisma.income.findMany.mock.calls[0][0];
      expect(args.skip).toBe(0);
      expect(args.take).toBe(20);
    });
  });

  describe('create', () => {
    it('should create and return an income record', async () => {
      const dto = { title: 'Salary', amount: 3000, date: '2026-04-01', source: 'Company' };
      mockPrisma.income.create.mockResolvedValue(mockIncome);

      const result = await service.create(1, dto);

      expect(mockPrisma.income.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 1, title: 'Salary' }),
        }),
      );
      expect(result).toEqual(mockIncome);
    });

    it('should convert date string to Date object', async () => {
      const dto = { title: 'Salary', amount: 3000, date: '2026-04-01' };
      mockPrisma.income.create.mockResolvedValue(mockIncome);

      await service.create(1, dto);

      const data = mockPrisma.income.create.mock.calls[0][0].data;
      expect(data.date).toBeInstanceOf(Date);
    });
  });

  describe('findOne', () => {
    it('should return income when found', async () => {
      mockPrisma.income.findFirst.mockResolvedValue(mockIncome);

      const result = await service.findOne(1, 1);

      expect(mockPrisma.income.findFirst).toHaveBeenCalledWith({ where: { id: 1, userId: 1 } });
      expect(result).toEqual(mockIncome);
    });

    it('should throw NotFoundException when income not found', async () => {
      mockPrisma.income.findFirst.mockResolvedValue(null);

      await expect(service.findOne(1, 999)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when income belongs to a different user', async () => {
      mockPrisma.income.findFirst.mockResolvedValue(null);

      await expect(service.findOne(2, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return the income', async () => {
      mockPrisma.income.findFirst.mockResolvedValue(mockIncome);
      const updated = { ...mockIncome, title: 'Bonus' };
      mockPrisma.income.update.mockResolvedValue(updated);

      const result = await service.update(1, 1, { title: 'Bonus' });

      expect(result.title).toBe('Bonus');
    });

    it('should throw NotFoundException when income does not belong to user', async () => {
      mockPrisma.income.findFirst.mockResolvedValue(null);

      await expect(service.update(99, 1, { title: 'x' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete income and return success message', async () => {
      mockPrisma.income.findFirst.mockResolvedValue(mockIncome);
      mockPrisma.income.delete.mockResolvedValue(mockIncome);

      const result = await service.remove(1, 1);

      expect(mockPrisma.income.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result.message).toContain('deleted');
    });

    it('should throw NotFoundException if income not found before deleting', async () => {
      mockPrisma.income.findFirst.mockResolvedValue(null);

      await expect(service.remove(1, 999)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.income.delete).not.toHaveBeenCalled();
    });
  });
});
