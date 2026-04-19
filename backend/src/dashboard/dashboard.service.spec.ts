import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;

  const zeroAggregate = { _sum: { amount: null } };
  const buildAggregate = (amount: number) => ({ _sum: { amount } });

  const mockPrisma = {
    expense: {
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    income: {
      aggregate: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    jest.clearAllMocks();

    // Default all aggregates to zero
    mockPrisma.expense.aggregate.mockResolvedValue(zeroAggregate);
    mockPrisma.income.aggregate.mockResolvedValue(zeroAggregate);
    mockPrisma.expense.groupBy.mockResolvedValue([]);
    mockPrisma.category.findMany.mockResolvedValue([]);
  });

  describe('getStats', () => {
    it('should return the correct top-level structure', async () => {
      const result = await service.getStats(1);

      expect(result).toHaveProperty('totals');
      expect(result).toHaveProperty('categoryBreakdown');
      expect(result).toHaveProperty('monthlyTrend');
      expect(result).toHaveProperty('income');
      expect(result).toHaveProperty('expenses');
      expect(result).toHaveProperty('savings');
    });

    it('should return zero totals when no expenses exist', async () => {
      const result = await service.getStats(1);

      expect(result.totals).toEqual({ today: 0, weekly: 0, monthly: 0, yearly: 0 });
    });

    it('should correctly map aggregate amounts to totals', async () => {
      mockPrisma.expense.aggregate
        .mockResolvedValueOnce(buildAggregate(10))  // today
        .mockResolvedValueOnce(buildAggregate(50))  // weekly
        .mockResolvedValueOnce(buildAggregate(200)) // monthly
        .mockResolvedValueOnce(buildAggregate(800)) // yearly
        .mockResolvedValue(buildAggregate(800));    // allTime + monthlyTrend calls

      const result = await service.getStats(1);

      expect(result.totals.today).toBe(10);
      expect(result.totals.weekly).toBe(50);
      expect(result.totals.monthly).toBe(200);
      expect(result.totals.yearly).toBe(800);
    });

    it('should return 12 months of trend data', async () => {
      const result = await service.getStats(1);

      expect(result.monthlyTrend).toHaveLength(12);
    });

    it('each monthly trend entry should have month, expenses, income, savings', async () => {
      const result = await service.getStats(1);

      result.monthlyTrend.forEach((entry) => {
        expect(entry).toHaveProperty('month');
        expect(entry).toHaveProperty('expenses');
        expect(entry).toHaveProperty('income');
        expect(entry).toHaveProperty('savings');
        expect(typeof entry.month).toBe('string');
        expect(entry.month).toMatch(/^\d{4}-\d{2}$/);
      });
    });

    it('should calculate savings as income minus expenses', async () => {
      // Month income = 3000, month expenses = 1200 (4th aggregate call)
      mockPrisma.expense.aggregate
        .mockResolvedValueOnce(zeroAggregate)          // today
        .mockResolvedValueOnce(zeroAggregate)          // weekly
        .mockResolvedValueOnce(buildAggregate(1200))   // monthly
        .mockResolvedValueOnce(zeroAggregate)          // yearly
        .mockResolvedValueOnce(buildAggregate(1200))   // allTime
        .mockResolvedValue(zeroAggregate);             // monthlyTrend calls

      mockPrisma.income.aggregate
        .mockResolvedValueOnce(buildAggregate(3000))   // monthIncome
        .mockResolvedValueOnce(buildAggregate(3000))   // allTimeIncome
        .mockResolvedValue(zeroAggregate);             // monthlyTrend calls

      const result = await service.getStats(1);

      expect(result.savings.thisMonth).toBe(1800);
    });

    it('should build categoryBreakdown with percentage', async () => {
      mockPrisma.expense.aggregate
        .mockResolvedValueOnce(zeroAggregate)          // today
        .mockResolvedValueOnce(zeroAggregate)          // weekly
        .mockResolvedValueOnce(buildAggregate(200))    // monthly
        .mockResolvedValue(zeroAggregate);             // rest

      mockPrisma.expense.groupBy.mockResolvedValue([
        { categoryId: 1, _sum: { amount: 100 } },
        { categoryId: 2, _sum: { amount: 100 } },
      ]);

      mockPrisma.category.findMany.mockResolvedValue([
        { id: 1, name: 'Food', color: '#F97316' },
        { id: 2, name: 'Transport', color: '#3B82F6' },
      ]);

      const result = await service.getStats(1);

      expect(result.categoryBreakdown).toHaveLength(2);
      expect(result.categoryBreakdown[0].percentage).toBe(50);
      expect(result.categoryBreakdown[0].categoryName).toBe('Food');
    });
  });
});
