import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import errors from '../config/error.config';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: number) {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async create(userId: number, dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { userId_name: { userId, name: dto.name } },
    });
    if (existing) throw new ConflictException(errors.resourceConflict);

    return this.prisma.category.create({
      data: { ...dto, userId },
    });
  }

  async update(userId: number, id: number, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findFirst({ where: { id, userId } });
    if (!category) throw new NotFoundException(errors.categoryNotFound);

    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(userId: number, id: number) {
    const category = await this.prisma.category.findFirst({ where: { id, userId } });
    if (!category) throw new NotFoundException(errors.categoryNotFound);

    const expenseCount = await this.prisma.expense.count({ where: { categoryId: id, userId } });
    if (expenseCount > 0) throw new ConflictException(errors.categoryInUse);

    await this.prisma.category.delete({ where: { id } });
    return { message: 'Category deleted successfully' };
  }
}
