// src/dashboard/dashboard.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Child, ChildSchema } from '../shared/schemas/user.schema';
import { Calendar, CalendarSchema } from '../shared/schemas/calendar.schema';
import { CalendarBlock, CalendarBlockSchema } from '../shared/schemas/calendar-block.schema';
import { Task, TaskSchema } from '../shared/schemas/task.schema';
import { EmotionRecord, EmotionRecordSchema } from '../shared/schemas/emotion-record.schema';
import { SelfRegulationButton, SelfRegulationButtonSchema } from '../shared/schemas/self-regulation-button.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Child.name, schema: ChildSchema },
      { name: Calendar.name, schema: CalendarSchema },
      { name: CalendarBlock.name, schema: CalendarBlockSchema },
      { name: Task.name, schema: TaskSchema },
      { name: EmotionRecord.name, schema: EmotionRecordSchema },
      { name: SelfRegulationButton.name, schema: SelfRegulationButtonSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}