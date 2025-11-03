// src/notifications/notifications.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsService } from './notifications.service';
import { TaskNotificationsService } from './task-notifications.service';
import { NotificationsController } from './notifications.controller';
import { DeviceToken, DeviceTokenSchema } from '../shared/schemas/device-token.schema';
import { User, UserSchema } from '../shared/schemas/user.schema';
import { Child, ChildSchema } from '../shared/schemas/user.schema';
import { Task, TaskSchema } from '../shared/schemas/task.schema';
import { CalendarBlock, CalendarBlockSchema } from '../shared/schemas/calendar-block.schema';
import { Calendar, CalendarSchema } from '../shared/schemas/calendar.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DeviceToken.name, schema: DeviceTokenSchema },
      { name: User.name, schema: UserSchema },
      { name: Child.name, schema: ChildSchema },
      { name: Task.name, schema: TaskSchema },
      { name: CalendarBlock.name, schema: CalendarBlockSchema },
      { name: Calendar.name, schema: CalendarSchema },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, TaskNotificationsService],
  exports: [NotificationsService, TaskNotificationsService],
})
export class NotificationsModule {}