// src/dashboard/dashboard.controller.ts
import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('parent/:childId')
  async getParentDashboard(
    @Param('childId') childId: string,
    @Request() req,
  ) {
    // Only parents can access this endpoint
    if (req.user.role !== 'PARENT') {
      throw new Error('Only parents can access this endpoint');
    }

    return this.dashboardService.getParentDashboard(req.user.userId.toString(), childId);
  }
}