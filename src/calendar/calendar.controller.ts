// src/calendar/calendar.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TaskStatus } from '../shared/schemas/task.schema';
import { EmotionType } from '../shared/schemas/emotion-record.schema';
import { CreateTaskDto } from '../shared/dtos/create-task.dto';
import { RecordEmotionDto } from '../shared/dtos/record-emotion.dto';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private calendarService: CalendarService) {}

  @Get('daily')
  async getDailyCalendar(
    @Query('date') date: string,
    @Query('childId') childId: string,
    @Request() req,
  ) {
    const targetChildId = req.user.role === 'CHILD' ? req.user.userId.toString() : childId;
    if (!targetChildId) {
      throw new Error('Child ID is required');
    }
    const targetDate = date ? new Date(date) : new Date();
    return this.calendarService.getOrCreateCalendar(targetChildId, targetDate);
  }

  @Get('range')
  async getCalendarRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('childId') childId: string,
    @Request() req,
  ) {
    const targetChildId = req.user.role === 'CHILD' ? req.user.userId.toString() : childId;
    if (!targetChildId) {
      throw new Error('Child ID is required');
    }
    return this.calendarService.getCalendarByDateRange(
      targetChildId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Post('blocks/:blockId/tasks')
  async addTask(
    @Param('blockId') blockId: string,
    @Body() taskData: CreateTaskDto,
  ) {
    return this.calendarService.addTaskToBlock(blockId, taskData);
  }

  @Put('tasks/:taskId')
  async updateTask(
    @Param('taskId') taskId: string,
    @Body() updateData: Partial<CreateTaskDto>,
  ) {
    return this.calendarService.updateTask(taskId, updateData);
  }

  @Put('tasks/:taskId/complete')
  async completeTask(@Param('taskId') taskId: string) {
    return this.calendarService.completeTask(taskId);
  }

  @Delete('tasks/:taskId')
  async deleteTask(@Param('taskId') taskId: string) {
    return this.calendarService.deleteTask(taskId);
  }

  @Post('blocks/:blockId/emotion')
  async recordEmotion(
    @Param('blockId') blockId: string,
    @Body() body: RecordEmotionDto,
  ) {
    return this.calendarService.recordEmotion(blockId, body.emotion);
  }
}