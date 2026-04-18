import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { IncomesService } from './incomes.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { QueryIncomeDto } from './dto/query-income.dto';
import type { RequestWithUser } from '../types/req.type';

@Controller('incomes')
@UseGuards(JwtAuthGuard)
export class IncomesController {
  constructor(private readonly incomesService: IncomesService) {}

  @Get()
  async findAll(@Req() req: RequestWithUser, @Query() query: QueryIncomeDto) {
    return this.incomesService.findAll(req.user.id, query);
  }

  @Post()
  async create(@Req() req: RequestWithUser, @Body() dto: CreateIncomeDto) {
    const data = await this.incomesService.create(req.user.id, dto);
    return { data };
  }

  @Get(':id')
  async findOne(@Req() req: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    const data = await this.incomesService.findOne(req.user.id, id);
    return { data };
  }

  @Patch(':id')
  async update(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIncomeDto,
  ) {
    const data = await this.incomesService.update(req.user.id, id, dto);
    return { data };
  }

  @Delete(':id')
  async remove(@Req() req: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    const data = await this.incomesService.remove(req.user.id, id);
    return { data };
  }
}
