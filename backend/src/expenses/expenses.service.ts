import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import errors from '../config/error.config';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { QueryExpenseDto } from './dto/query-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: number, query: QueryExpenseDto) {
    const {
      page = 1,
      limit = 20,
      search,
      categoryId,
      startDate,
      endDate,
      sortBy = 'date',
      sortOrder = 'desc',
    } = query;

    const where: any = { userId };
    if (categoryId) where.categoryId = categoryId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { category: { select: { id: true, name: true, icon: true, color: true } } },
      }),
      this.prisma.expense.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async create(userId: number, dto: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: { ...dto, userId, date: new Date(dto.date), amount: dto.amount },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    });
  }

  async findOne(userId: number, id: number) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, userId },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    });
    if (!expense) throw new NotFoundException(errors.expenseNotFound);
    return expense;
  }

  async update(userId: number, id: number, dto: UpdateExpenseDto) {
    await this.findOne(userId, id);
    const data: any = { ...dto };
    if ((dto as any).date) data.date = new Date((dto as any).date);
    return this.prisma.expense.update({
      where: { id },
      data,
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    });
  }

  async remove(userId: number, id: number) {
    await this.findOne(userId, id);
    await this.prisma.expense.delete({ where: { id } });
    return { message: 'Expense deleted successfully' };
  }
}
