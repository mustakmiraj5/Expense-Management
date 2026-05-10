import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ReportsService } from './reports.service';
import { MonthlyReportQueryDto } from './dto/monthly-report-query.dto';
import type { RequestWithUser } from '../types/req.type';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('monthly')
  async monthly(
    @Req() req: RequestWithUser,
    @Query() query: MonthlyReportQueryDto,
    @Res() res: Response,
  ) {
    const csv = await this.reportsService.generateMonthlyCsv(req.user.id, query.month);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="expense-report-${query.month}.csv"`,
    );
    res.send(csv);
  }
}
