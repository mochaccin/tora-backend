// src/tasks/tasks.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Request 
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Task, TaskStatus } from '../shared/schemas/task.schema';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  async create(@Body() taskData: Partial<Task>, @Request() req) {
    const childId = req.user.role === 'child' ? req.user.userId : taskData.childId;
    return this.tasksService.create({ ...taskData, childId });
  }

  @Get()
  async findAll(
    @Query('date') date: string,
    @Query('childId') childId: string,
    @Request() req,
  ) {
    const targetChildId = req.user.role === 'child' ? req.user.userId : childId;
    const targetDate = date ? new Date(date) : undefined;
    return this.tasksService.findAllByChild(targetChildId, targetDate);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const childId = req.user.role === 'child' ? req.user.userId : req.query.childId;
    return this.tasksService.findOne(id, childId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateData: Partial<Task>,
    @Request() req,
  ) {
    const childId = req.user.role === 'child' ? req.user.userId : updateData.childId;
    return this.tasksService.update(id, childId, updateData);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Query('childId') childId: string,
    @Request() req,
  ) {
    const targetChildId = req.user.role === 'child' ? req.user.userId : childId;
    return this.tasksService.remove(id, targetChildId);
  }

  @Put(':id/complete')
  async completeTask(@Param('id') id: string, @Request() req) {
    const childId = req.user.role === 'child' ? req.user.userId : req.query.childId;
    return this.tasksService.completeTask(id, childId);
  }
}