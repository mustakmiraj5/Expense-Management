import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ExpensesService', () => {
  let service: ExpensesService;

  const mockPrisma = {
    expense: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockCategory = { id: 1, name: 'Food', icon: '🍽️', color: '#F97316' };
  const mockExpense = {
    id: 1,
    title: 'Lunch',
    amount: 15.5,
    date: new Date('2026-04-01'),
    description: 'Team lunch',
    userId: 1,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: mockCategory,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated expenses with meta', async () => {
      mockPrisma.expense.findMany.mockResolvedValue([mockExpense]);
      mockPrisma.expense.count.mockResolvedValue(1);

      const result = await service.findAll(1, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
    });

    it('should apply search filter as OR on title and description', async () => {
      mockPrisma.expense.findMany.mockResolvedValue([]);
      mockPrisma.expense.count.mockResolvedValue(0);

      await service.findAll(1, { search: 'lunch' });

      const callArgs = mockPrisma.expense.findMany.mock.calls[0][0];
      expect(callArgs.where.OR).toEqual([
        { title: { contains: 'lunch', mode: 'insensitive' } },
        { description: { contains: 'lunch', mode: 'insensitive' } },
      ]);
    });

    it('should apply categoryId filter', async () => {
      mockPrisma.expense.findMany.mockResolvedValue([]);
      mockPrisma.expense.count.mockResolvedValue(0);

      await service.findAll(1, { categoryId: 2 });

      expect(mockPrisma.expense.findMany.mock.calls[0][0].where.categoryId).toBe(2);
    });

    it('should apply date range filter', async () => {
      mockPrisma.expense.findMany.mockResolvedValue([]);
      mockPrisma.expense.count.mockResolvedValue(0);

      await service.findAll(1, { startDate: '2026-04-01', endDate: '2026-04-30' });

      const where = mockPrisma.expense.findMany.mock.calls[0][0].where;
      expect(where.date.gte).toEqual(new Date('2026-04-01'));
      expect(where.date.lte).toEqual(new Date('2026-04-30'));
    });

    it('should calculate correct skip for pagination', async () => {
      mockPrisma.expense.findMany.mockResolvedValue([]);
      mockPrisma.expense.count.mockResolvedValue(0);

      await service.findAll(1, { page: 3, limit: 10 });

      const callArgs = mockPrisma.expense.findMany.mock.calls[0][0];
      expect(callArgs.skip).toBe(20);
      expect(callArgs.take).toBe(10);
    });
  });

  describe('create', () => {
    it('should create and return an expense', async () => {
      const dto = { title: 'Lunch', amount: 15.5, categoryId: 1, date: '2026-04-01' };
      mockPrisma.expense.create.mockResolvedValue(mockExpense);

      const result = await service.create(1, dto);

      expect(mockPrisma.expense.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 1, title: 'Lunch', amount: 15.5 }),
        }),
      );
      expect(result).toEqual(mockExpense);
    });

    it('should convert date string to Date object', async () => {
      const dto = { title: 'Lunch', amount: 15.5, categoryId: 1, date: '2026-04-01' };
      mockPrisma.expense.create.mockResolvedValue(mockExpense);

      await service.create(1, dto);

      const data = mockPrisma.expense.create.mock.calls[0][0].data;
      expect(data.date).toBeInstanceOf(Date);
    });
  });

  describe('findOne', () => {
    it('should return the expense when found', async () => {
      mockPrisma.expense.findFirst.mockResolvedValue(mockExpense);

      const result = await service.findOne(1, 1);

      expect(mockPrisma.expense.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1, userId: 1 } }),
      );
      expect(result).toEqual(mockExpense);
    });

    it('should throw NotFoundException when expense not found', async () => {
      mockPrisma.expense.findFirst.mockResolvedValue(null);

      await expect(service.findOne(1, 999)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when expense belongs to a different user', async () => {
      mockPrisma.expense.findFirst.mockResolvedValue(null);

      await expect(service.findOne(2, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return the expense', async () => {
      mockPrisma.expense.findFirst.mockResolvedValue(mockExpense);
      const updated = { ...mockExpense, title: 'Dinner' };
      mockPrisma.expense.update.mockResolvedValue(updated);

      const result = await service.update(1, 1, { title: 'Dinner' });

      expect(result.title).toBe('Dinner');
    });

    it('should convert date string to Date when updating', async () => {
      mockPrisma.expense.findFirst.mockResolvedValue(mockExpense);
      mockPrisma.expense.update.mockResolvedValue(mockExpense);

      await service.update(1, 1, { date: '2026-05-01' } as any);

      const data = mockPrisma.expense.update.mock.calls[0][0].data;
      expect(data.date).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException when expense does not belong to user', async () => {
      mockPrisma.expense.findFirst.mockResolvedValue(null);

      await expect(service.update(99, 1, { title: 'x' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete expense and return success message', async () => {
      mockPrisma.expense.findFirst.mockResolvedValue(mockExpense);
      mockPrisma.expense.delete.mockResolvedValue(mockExpense);

      const result = await service.remove(1, 1);

      expect(mockPrisma.expense.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result.message).toContain('deleted');
    });

    it('should throw NotFoundException if expense not found before deleting', async () => {
      mockPrisma.expense.findFirst.mockResolvedValue(null);

      await expect(service.remove(1, 999)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.expense.delete).not.toHaveBeenCalled();
    });
  });
});
