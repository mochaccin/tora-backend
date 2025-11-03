// src/calendar/calendar.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { Calendar, CalendarSchema } from '../shared/schemas/calendar.schema';
import { CalendarBlock, CalendarBlockSchema } from '../shared/schemas/calendar-block.schema';
import { Task, TaskSchema } from '../shared/schemas/task.schema';
import { EmotionRecord, EmotionRecordSchema } from '../shared/schemas/emotion-record.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Calendar.name, schema: CalendarSchema },
      { name: CalendarBlock.name, schema: CalendarBlockSchema },
      { name: Task.name, schema: TaskSchema },
      { name: EmotionRecord.name, schema: EmotionRecordSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [CalendarController],
  providers: [CalendarService],
})
export class CalendarModule {}