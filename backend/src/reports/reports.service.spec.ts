import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ReportsService } from './reports.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ReportsService', () => {
  let service: ReportsService;

  const mockPrisma = {
    expense: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    income: {
      aggregate: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    jest.clearAllMocks();
  });

  it('rejects invalid month format', async () => {
    await expect(service.generateMonthlyCsv(1, '2026-13')).rejects.toThrow(BadRequestException);
    await expect(service.generateMonthlyCsv(1, 'bad')).rejects.toThrow(BadRequestException);
  });

  it('generates CSV with summary and expense rows', async () => {
    mockPrisma.expense.findMany.mockResolvedValue([
      {
        id: 1,
        title: 'Lunch',
        amount: new Prisma.Decimal('250.00'),
        date: new Date('2026-05-01T12:00:00Z'),
        description: 'Team lunch',
        category: { name: 'Food' },
      },
      {
        id: 2,
        title: 'Bus fare',
        amount: new Prisma.Decimal('40.00'),
        date: new Date('2026-05-02T08:00:00Z'),
        description: null,
        category: { name: 'Transport' },
      },
    ]);
    mockPrisma.expense.aggregate.mockResolvedValue({ _sum: { amount: new Prisma.Decimal('290.00') } });
    mockPrisma.income.aggregate.mockResolvedValue({ _sum: { amount: new Prisma.Decimal('5000.00') } });

    const csv = await service.generateMonthlyCsv(1, '2026-05');

    // BOM
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('Summary');
    expect(csv).toContain('Month,2026-05');
    expect(csv).toContain('Total Income,5000.00');
    expect(csv).toContain('Total Expenses,290.00');
    expect(csv).toContain('Net Savings,4710.00');
    expect(csv).toContain('Expense Count,2');
    expect(csv).toContain('Expenses');
    expect(csv).toContain('Date,Title,Category,Amount,Description');
    expect(csv).toContain('Lunch,Food,250.00,Team lunch');
    expect(csv).toContain('Bus fare,Transport,40.00,');
  });

  it('handles empty month: summary plus expenses header only', async () => {
    mockPrisma.expense.findMany.mockResolvedValue([]);
    mockPrisma.expense.aggregate.mockResolvedValue({ _sum: { amount: null } });
    mockPrisma.income.aggregate.mockResolvedValue({ _sum: { amount: null } });

    const csv = await service.generateMonthlyCsv(1, '2026-04');

    expect(csv).toContain('Total Expenses,0.00');
    expect(csv).toContain('Expense Count,0');
    expect(csv).toContain('Date,Title,Category,Amount,Description');
    // No data rows after header
    const expensesSection = csv.split('Date,Title,Category,Amount,Description')[1];
    expect(expensesSection.trim()).toBe('');
  });

  it('quotes fields containing commas, quotes, or newlines', async () => {
    mockPrisma.expense.findMany.mockResolvedValue([
      {
        id: 1,
        title: 'Coffee, tea "and" snacks',
        amount: new Prisma.Decimal('100.00'),
        date: new Date('2026-05-01T00:00:00Z'),
        description: 'Note\nwith newline',
        category: { name: 'Food' },
      },
    ]);
    mockPrisma.expense.aggregate.mockResolvedValue({ _sum: { amount: new Prisma.Decimal('100.00') } });
    mockPrisma.income.aggregate.mockResolvedValue({ _sum: { amount: null } });

    const csv = await service.generateMonthlyCsv(1, '2026-05');

    expect(csv).toContain('"Coffee, tea ""and"" snacks"');
    expect(csv).toContain('"Note\nwith newline"');
  });

  it('queries the correct month boundary', async () => {
    mockPrisma.expense.findMany.mockResolvedValue([]);
    mockPrisma.expense.aggregate.mockResolvedValue({ _sum: { amount: null } });
    mockPrisma.income.aggregate.mockResolvedValue({ _sum: { amount: null } });

    await service.generateMonthlyCsv(7, '2026-02');

    const where = mockPrisma.expense.findMany.mock.calls[0][0].where;
    expect(where.userId).toBe(7);
    expect(where.date.gte).toEqual(new Date(2026, 1, 1));
    // Feb 2026 has 28 days (not a leap year)
    expect((where.date.lte as Date).getDate()).toBe(28);
    expect((where.date.lte as Date).getMonth()).toBe(1);
  });
});
