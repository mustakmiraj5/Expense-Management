import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import errors from '../config/error.config';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { QueryIncomeDto } from './dto/query-income.dto';

@Injectable()
export class IncomesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: number, query: QueryIncomeDto) {
    const { page = 1, limit = 20, startDate, endDate } = query;

    const where: any = { userId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.income.findMany({ where, skip, take: limit, orderBy: { date: 'desc' } }),
      this.prisma.income.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async create(userId: number, dto: CreateIncomeDto) {
    return this.prisma.income.create({
      data: { ...dto, userId, date: new Date(dto.date) },
    });
  }

  async findOne(userId: number, id: number) {
    const income = await this.prisma.income.findFirst({ where: { id, userId } });
    if (!income) throw new NotFoundException(errors.incomeNotFound);
    return income;
  }

  async update(userId: number, id: number, dto: UpdateIncomeDto) {
    await this.findOne(userId, id);
    const data: any = { ...dto };
    if ((dto as any).date) data.date = new Date((dto as any).date);
    return this.prisma.income.update({ where: { id }, data });
  }

  async remove(userId: number, id: number) {
    await this.findOne(userId, id);
    await this.prisma.income.delete({ where: { id } });
    return { message: 'Income deleted successfully' };
  }
}
