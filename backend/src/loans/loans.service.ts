import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LoanDirection, LoanStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import errors from '../config/error.config';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { QueryLoanDto } from './dto/query-loan.dto';
import { CreateRepaymentDto } from './dto/create-repayment.dto';

const contactSelect = { id: true, name: true, phone: true } as const;

type LoanWithRepayments = {
  id: number;
  principal: Prisma.Decimal;
  dueDate: Date | null;
  status: LoanStatus;
  repayments: { amount: Prisma.Decimal }[];
};

function decorate<T extends LoanWithRepayments>(loan: T) {
  const repaid = loan.repayments.reduce(
    (sum, r) => sum.plus(r.amount),
    new Prisma.Decimal(0),
  );
  const outstanding = new Prisma.Decimal(loan.principal).minus(repaid);
  const isOverdue =
    !!loan.dueDate &&
    loan.status === 'OPEN' &&
    new Date(loan.dueDate).getTime() < Date.now();
  return { ...loan, repaid: repaid.toString(), outstanding: outstanding.toString(), isOverdue };
}

@Injectable()
export class LoansService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: number, query: QueryLoanDto) {
    const {
      page = 1,
      limit = 20,
      search,
      direction,
      status,
      contactId,
      overdueOnly,
      sortBy = 'date',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.LoanWhereInput = { userId };
    if (direction) where.direction = direction;
    if (status) where.status = status;
    if (contactId) where.contactId = contactId;
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { contact: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (overdueOnly === 'true') {
      where.status = 'OPEN';
      where.dueDate = { lt: new Date() };
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.loan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          contact: { select: contactSelect },
          repayments: { select: { amount: true } },
        },
      }),
      this.prisma.loan.count({ where }),
    ]);

    return {
      data: data.map((l) => decorate(l)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(userId: number, id: number) {
    const loan = await this.prisma.loan.findFirst({
      where: { id, userId },
      include: {
        contact: { select: contactSelect },
        repayments: { orderBy: { date: 'desc' } },
      },
    });
    if (!loan) throw new NotFoundException(errors.loanNotFound);
    return decorate(loan);
  }

  private async assertContactBelongsToUser(userId: number, contactId: number) {
    const contact = await this.prisma.contact.findFirst({ where: { id: contactId, userId } });
    if (!contact) throw new NotFoundException(errors.contactNotFound);
  }

  async create(userId: number, dto: CreateLoanDto) {
    await this.assertContactBelongsToUser(userId, dto.contactId);
    const loan = await this.prisma.loan.create({
      data: {
        userId,
        contactId: dto.contactId,
        direction: dto.direction,
        principal: dto.principal,
        date: new Date(dto.date),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        description: dto.description,
      },
      include: {
        contact: { select: contactSelect },
        repayments: { select: { amount: true } },
      },
    });
    return decorate(loan);
  }

  async update(userId: number, id: number, dto: UpdateLoanDto) {
    const existing = await this.prisma.loan.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException(errors.loanNotFound);

    if (dto.contactId && dto.contactId !== existing.contactId) {
      await this.assertContactBelongsToUser(userId, dto.contactId);
    }

    const data: Prisma.LoanUpdateInput = {};
    if (dto.contactId !== undefined) data.contact = { connect: { id: dto.contactId } };
    if (dto.principal !== undefined) data.principal = dto.principal;
    if (dto.date !== undefined) data.date = new Date(dto.date);
    if (dto.dueDate !== undefined) data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.description !== undefined) data.description = dto.description;

    await this.prisma.loan.update({ where: { id }, data });
    await this.recomputeStatus(id);
    return this.findOne(userId, id);
  }

  async remove(userId: number, id: number) {
    const existing = await this.prisma.loan.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException(errors.loanNotFound);
    await this.prisma.loan.delete({ where: { id } });
    return { message: 'Loan deleted successfully' };
  }

  async addRepayment(userId: number, loanId: number, dto: CreateRepaymentDto) {
    const loan = await this.prisma.loan.findFirst({
      where: { id: loanId, userId },
      include: { repayments: { select: { amount: true } } },
    });
    if (!loan) throw new NotFoundException(errors.loanNotFound);

    const repaid = loan.repayments.reduce(
      (sum, r) => sum.plus(r.amount),
      new Prisma.Decimal(0),
    );
    const remaining = new Prisma.Decimal(loan.principal).minus(repaid);
    if (new Prisma.Decimal(dto.amount).gt(remaining)) {
      throw new BadRequestException({
        ...errors.repaymentExceedsPrincipal,
        remaining: remaining.toString(),
      });
    }

    await this.prisma.repayment.create({
      data: {
        loanId,
        userId,
        amount: dto.amount,
        date: new Date(dto.date),
        note: dto.note,
      },
    });
    await this.recomputeStatus(loanId);
    return this.findOne(userId, loanId);
  }

  async removeRepayment(userId: number, loanId: number, repaymentId: number) {
    const repayment = await this.prisma.repayment.findFirst({
      where: { id: repaymentId, loanId, userId },
    });
    if (!repayment) throw new NotFoundException(errors.repaymentNotFound);
    await this.prisma.repayment.delete({ where: { id: repaymentId } });
    await this.recomputeStatus(loanId);
    return this.findOne(userId, loanId);
  }

  private async recomputeStatus(loanId: number) {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: { repayments: { select: { amount: true } } },
    });
    if (!loan) return;
    const repaid = loan.repayments.reduce(
      (sum, r) => sum.plus(r.amount),
      new Prisma.Decimal(0),
    );
    const settled = repaid.gte(loan.principal);
    const next: LoanStatus = settled ? 'SETTLED' : 'OPEN';
    if (next !== loan.status) {
      await this.prisma.loan.update({ where: { id: loanId }, data: { status: next } });
    }
  }

  async summary(userId: number) {
    const openLoans = await this.prisma.loan.findMany({
      where: { userId, status: 'OPEN' },
      include: { repayments: { select: { amount: true } } },
    });

    let totalReceivable = new Prisma.Decimal(0);
    let totalPayable = new Prisma.Decimal(0);
    let overdueCount = 0;
    const now = Date.now();

    for (const loan of openLoans) {
      const repaid = loan.repayments.reduce(
        (sum, r) => sum.plus(r.amount),
        new Prisma.Decimal(0),
      );
      const outstanding = new Prisma.Decimal(loan.principal).minus(repaid);
      if (loan.direction === LoanDirection.LENT) {
        totalReceivable = totalReceivable.plus(outstanding);
      } else {
        totalPayable = totalPayable.plus(outstanding);
      }
      if (loan.dueDate && new Date(loan.dueDate).getTime() < now) overdueCount += 1;
    }

    return {
      totalReceivable: totalReceivable.toString(),
      totalPayable: totalPayable.toString(),
      openCount: openLoans.length,
      overdueCount,
    };
  }
}
