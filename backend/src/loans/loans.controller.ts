import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { QueryLoanDto } from './dto/query-loan.dto';
import { CreateRepaymentDto } from './dto/create-repayment.dto';
import type { RequestWithUser } from '../types/req.type';

@Controller('loans')
@UseGuards(JwtAuthGuard)
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Get()
  async findAll(@Req() req: RequestWithUser, @Query() query: QueryLoanDto) {
    return this.loansService.findAll(req.user.id, query);
  }

  @Get('summary')
  async summary(@Req() req: RequestWithUser) {
    const data = await this.loansService.summary(req.user.id);
    return { data };
  }

  @Post()
  async create(@Req() req: RequestWithUser, @Body() dto: CreateLoanDto) {
    const data = await this.loansService.create(req.user.id, dto);
    return { data };
  }

  @Get(':id')
  async findOne(@Req() req: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    const data = await this.loansService.findOne(req.user.id, id);
    return { data };
  }

  @Patch(':id')
  async update(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLoanDto,
  ) {
    const data = await this.loansService.update(req.user.id, id, dto);
    return { data };
  }

  @Delete(':id')
  async remove(@Req() req: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    const data = await this.loansService.remove(req.user.id, id);
    return { data };
  }

  @Post(':id/repayments')
  async addRepayment(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateRepaymentDto,
  ) {
    const data = await this.loansService.addRepayment(req.user.id, id, dto);
    return { data };
  }

  @Delete(':id/repayments/:repaymentId')
  async removeRepayment(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('repaymentId', ParseIntPipe) repaymentId: number,
  ) {
    const data = await this.loansService.removeRepayment(req.user.id, id, repaymentId);
    return { data };
  }
}
