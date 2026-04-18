import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: number) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000 - 1);

    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [
      todayTotal,
      weekTotal,
      monthTotal,
      yearTotal,
      allTimeExpenses,
      categoryBreakdownRaw,
      monthIncome,
      allTimeIncome,
      categories,
    ] = await Promise.all([
      this.prisma.expense.aggregate({ where: { userId, date: { gte: todayStart, lte: todayEnd } }, _sum: { amount: true } }),
      this.prisma.expense.aggregate({ where: { userId, date: { gte: weekStart, lte: todayEnd } }, _sum: { amount: true } }),
      this.prisma.expense.aggregate({ where: { userId, date: { gte: monthStart, lte: monthEnd } }, _sum: { amount: true } }),
      this.prisma.expense.aggregate({ where: { userId, date: { gte: yearStart } }, _sum: { amount: true } }),
      this.prisma.expense.aggregate({ where: { userId }, _sum: { amount: true } }),
      this.prisma.expense.groupBy({
        by: ['categoryId'],
        where: { userId, date: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
      this.prisma.income.aggregate({ where: { userId, date: { gte: monthStart, lte: monthEnd } }, _sum: { amount: true } }),
      this.prisma.income.aggregate({ where: { userId }, _sum: { amount: true } }),
      this.prisma.category.findMany({ where: { userId }, select: { id: true, name: true, color: true } }),
    ]);

    const monthExpTotal = Number(monthTotal._sum.amount ?? 0);
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const categoryBreakdown = categoryBreakdownRaw.map((item) => {
      const cat = categoryMap.get(item.categoryId);
      const total = Number(item._sum.amount ?? 0);
      return {
        categoryId: item.categoryId,
        categoryName: cat?.name ?? 'Unknown',
        color: cat?.color ?? '#6B7280',
        total,
        percentage: monthExpTotal > 0 ? Math.round((total / monthExpTotal) * 100) : 0,
      };
    });

    const monthlyTrend = await this.buildMonthlyTrend(userId);

    const thisMonthIncome = Number(monthIncome._sum.amount ?? 0);
    const allTimeIncomeVal = Number(allTimeIncome._sum.amount ?? 0);
    const allTimeExpensesVal = Number(allTimeExpenses._sum.amount ?? 0);

    return {
      totals: {
        today: Number(todayTotal._sum.amount ?? 0),
        weekly: Number(weekTotal._sum.amount ?? 0),
        monthly: monthExpTotal,
        yearly: Number(yearTotal._sum.amount ?? 0),
      },
      categoryBreakdown,
      monthlyTrend,
      income: { thisMonth: thisMonthIncome, allTime: allTimeIncomeVal },
      expenses: { thisMonth: monthExpTotal, allTime: allTimeExpensesVal },
      savings: {
        thisMonth: thisMonthIncome - monthExpTotal,
        allTime: allTimeIncomeVal - allTimeExpensesVal,
      },
    };
  }

  private async buildMonthlyTrend(userId: number) {
    const months: Array<{ month: string; expenses: number; income: number; savings: number }> = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      const [expAgg, incAgg] = await Promise.all([
        this.prisma.expense.aggregate({ where: { userId, date: { gte: start, lte: end } }, _sum: { amount: true } }),
        this.prisma.income.aggregate({ where: { userId, date: { gte: start, lte: end } }, _sum: { amount: true } }),
      ]);

      const expenses = Number(expAgg._sum.amount ?? 0);
      const income = Number(incAgg._sum.amount ?? 0);
      months.push({ month: monthKey, expenses, income, savings: income - expenses });
    }

    return months;
  }
}
