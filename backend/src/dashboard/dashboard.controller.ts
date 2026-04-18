import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import type { RequestWithUser } from '../types/req.type';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(@Req() req: RequestWithUser) {
    const data = await this.dashboardService.getStats(req.user.id);
    return { data };
  }
}
