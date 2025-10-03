// src/calendar/calendar.controller.ts
import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private calendarService: CalendarService) {}

  @Get('daily')
  async getDailyOverview(
    @Query('date') date: string,
    @Query('childId') childId: string,
    @Request() req,
  ) {
    const targetChildId = req.user.role === 'child' ? req.user.userId : childId;
    const targetDate = date ? new Date(date) : new Date();
    return this.calendarService.getDailyOverview(targetChildId, targetDate);
  }

  @Get('weekly')
  async getWeeklyOverview(
    @Query('startDate') startDate: string,
    @Query('childId') childId: string,
    @Request() req,
  ) {
    const targetChildId = req.user.role === 'child' ? req.user.userId : childId;
    const targetStartDate = startDate ? new Date(startDate) : new Date();
    return this.calendarService.getWeeklyOverview(targetChildId, targetStartDate);
  }
}