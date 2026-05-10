import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import errors from '../config/error.config';

const BOM = '﻿';

function csvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csvRow(values: (string | number | null | undefined)[]): string {
  return values.map(csvField).join(',');
}

function formatAmount(value: unknown): string {
  return Number(value ?? 0).toFixed(2);
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateMonthlyCsv(userId: number, month: string): Promise<string> {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new BadRequestException(errors.invalidMonthFormat);
    }

    const [yearStr, monthStr] = month.split('-');
    const year = Number(yearStr);
    const monthIdx = Number(monthStr) - 1;
    const monthStart = new Date(year, monthIdx, 1);
    const monthEnd = new Date(year, monthIdx + 1, 0, 23, 59, 59, 999);

    const [expenses, expenseAgg, incomeAgg] = await Promise.all([
      this.prisma.expense.findMany({
        where: { userId, date: { gte: monthStart, lte: monthEnd } },
        orderBy: { date: 'asc' },
        include: { category: { select: { name: true } } },
      }),
      this.prisma.expense.aggregate({
        where: { userId, date: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
      this.prisma.income.aggregate({
        where: { userId, date: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
    ]);

    const totalExpenses = Number(expenseAgg._sum.amount ?? 0);
    const totalIncome = Number(incomeAgg._sum.amount ?? 0);
    const netSavings = totalIncome - totalExpenses;

    const lines: string[] = [];
    lines.push('Summary');
    lines.push(csvRow(['Field', 'Value']));
    lines.push(csvRow(['Month', month]));
    lines.push(csvRow(['Total Income', formatAmount(totalIncome)]));
    lines.push(csvRow(['Total Expenses', formatAmount(totalExpenses)]));
    lines.push(csvRow(['Net Savings', formatAmount(netSavings)]));
    lines.push(csvRow(['Expense Count', expenses.length]));
    lines.push(csvRow(['Generated At', new Date().toISOString()]));
    lines.push('');
    lines.push('Expenses');
    lines.push(csvRow(['Date', 'Title', 'Category', 'Amount', 'Description']));
    for (const e of expenses) {
      lines.push(
        csvRow([
          new Date(e.date).toISOString().split('T')[0],
          e.title,
          e.category?.name ?? '',
          formatAmount(e.amount),
          e.description ?? '',
        ]),
      );
    }

    return BOM + lines.join('\r\n') + '\r\n';
  }
}
