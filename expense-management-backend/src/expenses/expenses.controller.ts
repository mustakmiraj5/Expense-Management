import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { QueryExpenseDto } from './dto/query-expense.dto';
import type { RequestWithUser } from '../types/req.type';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  async findAll(@Req() req: RequestWithUser, @Query() query: QueryExpenseDto) {
    return this.expensesService.findAll(req.user.id, query);
  }

  @Post()
  async create(@Req() req: RequestWithUser, @Body() dto: CreateExpenseDto) {
    const data = await this.expensesService.create(req.user.id, dto);
    return { data };
  }

  @Get(':id')
  async findOne(@Req() req: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    const data = await this.expensesService.findOne(req.user.id, id);
    return { data };
  }

  @Patch(':id')
  async update(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExpenseDto,
  ) {
    const data = await this.expensesService.update(req.user.id, id, dto);
    return { data };
  }

  @Delete(':id')
  async remove(@Req() req: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    const data = await this.expensesService.remove(req.user.id, id);
    return { data };
  }
}
