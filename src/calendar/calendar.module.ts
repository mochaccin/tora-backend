// src/calendar/calendar.module.ts
import { Module } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { TasksModule } from '../tasks/tasks.module';
import { EmotionsModule } from '../emotions/emotions.module';

@Module({
  imports: [TasksModule, EmotionsModule],
  controllers: [CalendarController],
  providers: [CalendarService],
})
export class CalendarModule {}