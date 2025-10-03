// src/emotions/emotions.controller.ts
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
import { EmotionsService } from './emotions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Emotion, EmotionType, TimeOfDay } from '../shared/schemas/emotion.schema';

@Controller('emotions')
@UseGuards(JwtAuthGuard)
export class EmotionsController {
  constructor(private emotionsService: EmotionsService) {}

  @Post()
  async create(@Body() emotionData: Partial<Emotion>, @Request() req) {
    const childId = req.user.role === 'child' ? req.user.userId : emotionData.childId;
    return this.emotionsService.create({ ...emotionData, childId });
  }

  @Get()
  async findAll(
    @Query('date') date: string,
    @Query('childId') childId: string,
    @Request() req,
  ) {
    const targetChildId = req.user.role === 'child' ? req.user.userId : childId;
    const targetDate = date ? new Date(date) : undefined;
    return this.emotionsService.findAllByChild(targetChildId, targetDate);
  }

  @Get('range')
  async findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('childId') childId: string,
    @Request() req,
  ) {
    const targetChildId = req.user.role === 'child' ? req.user.userId : childId;
    return this.emotionsService.getEmotionsByDateRange(
      targetChildId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const childId = req.user.role === 'child' ? req.user.userId : req.query.childId;
    return this.emotionsService.findOne(id, childId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateData: Partial<Emotion>,
    @Request() req,
  ) {
    const childId = req.user.role === 'child' ? req.user.userId : updateData.childId;
    return this.emotionsService.update(id, childId, updateData);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Query('childId') childId: string,
    @Request() req,
  ) {
    const targetChildId = req.user.role === 'child' ? req.user.userId : childId;
    return this.emotionsService.remove(id, targetChildId);
  }
}