import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import errors from '../config/error.config';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { QueryContactDto } from './dto/query-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: number, query: QueryContactDto) {
    const { page = 1, limit = 50, search } = query;
    const where: any = { userId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: { _count: { select: { loans: true } } },
      }),
      this.prisma.contact.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async create(userId: number, dto: CreateContactDto) {
    const existing = await this.prisma.contact.findUnique({
      where: { userId_name: { userId, name: dto.name } },
    });
    if (existing) throw new ConflictException(errors.resourceConflict);

    return this.prisma.contact.create({ data: { ...dto, userId } });
  }

  async findOne(userId: number, id: number) {
    const contact = await this.prisma.contact.findFirst({ where: { id, userId } });
    if (!contact) throw new NotFoundException(errors.contactNotFound);
    return contact;
  }

  async update(userId: number, id: number, dto: UpdateContactDto) {
    await this.findOne(userId, id);
    return this.prisma.contact.update({ where: { id }, data: dto });
  }

  async remove(userId: number, id: number) {
    await this.findOne(userId, id);
    const loanCount = await this.prisma.loan.count({ where: { contactId: id, userId } });
    if (loanCount > 0) throw new ConflictException(errors.contactInUse);
    await this.prisma.contact.delete({ where: { id } });
    return { message: 'Contact deleted successfully' };
  }
}
