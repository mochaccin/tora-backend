// src/notifications/notifications.controller.ts
import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Request,
  Param,
  Delete 
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { 
  RegisterDeviceTokenDto, 
  SendNotificationDto,
  SendToUserDto,
  SendToChildDto,
  SendToParentDto 
} from '../shared/dtos/notification.dto';
import { UserRole } from '../shared/schemas/user.schema';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post('register-token')
  async registerToken(
    @Body() registerDto: RegisterDeviceTokenDto,
    @Request() req,
  ) {
    return this.notificationsService.registerDeviceToken(
      req.user.userId.toString(),
      registerDto.token,
      registerDto.deviceType
    );
  }

  @Delete('unregister-token/:token')
  async unregisterToken(
    @Param('token') token: string,
    @Request() req,
  ) {
    return this.notificationsService.unregisterDeviceToken(token);
  }

  @Post('send-to-user')
  async sendToUser(
    @Body() sendDto: SendToUserDto,
    @Request() req,
  ) {
    // Only admins or the user themselves can send notifications
    if (req.user.role !== UserRole.PARENT && req.user.userId.toString() !== sendDto.userId) {
      throw new Error('Not authorized to send notifications to this user');
    }

    return this.notificationsService.sendToUser(
      sendDto.userId,
      sendDto.title,
      sendDto.body,
      sendDto.data,
      sendDto.imageUrl
    );
  }

  @Post('send-to-child')
  async sendToChild(
    @Body() sendDto: SendToChildDto,
    @Request() req,
  ) {
    // Only parents or admins can send to children
    if (req.user.role !== UserRole.PARENT) {
      throw new Error('Only parents can send notifications to children');
    }

    return this.notificationsService.sendToChild(
      sendDto.childId,
      sendDto.title,
      sendDto.body,
      sendDto.data,
      sendDto.imageUrl
    );
  }

  @Post('send-to-parent')
  async sendToParent(
    @Body() sendDto: SendToParentDto,
    @Request() req,
  ) {
    // Only admins or the parent themselves can send notifications
    if (req.user.role !== UserRole.PARENT && req.user.userId.toString() !== sendDto.parentId) {
      throw new Error('Not authorized to send notifications to this parent');
    }

    return this.notificationsService.sendToParent(
      sendDto.parentId,
      sendDto.title,
      sendDto.body,
      sendDto.data,
      sendDto.imageUrl
    );
  }

  @Post('send-task-reminder/:childId')
  async sendTaskReminder(
    @Param('childId') childId: string,
    @Body() body: { taskTitle: string; dueTime?: Date },
    @Request() req,
  ) {
    if (req.user.role !== UserRole.PARENT) {
      throw new Error('Only parents can send task reminders');
    }

    return this.notificationsService.sendTaskReminder(
      childId,
      body.taskTitle,
      body.dueTime
    );
  }

  @Post('send-emotion-checkin/:childId')
  async sendEmotionCheckin(
    @Param('childId') childId: string,
    @Body() body: { period: string },
    @Request() req,
  ) {
    if (req.user.role !== UserRole.PARENT) {
      throw new Error('Only parents can send emotion checkins');
    }

    return this.notificationsService.sendEmotionCheckin(
      childId,
      body.period
    );
  }

  @Post('send-progress-update/:parentId')
  async sendProgressUpdate(
    @Param('parentId') parentId: string,
    @Body() body: { childName: string; progress: string },
    @Request() req,
  ) {
    // System-generated or admin only
    if (req.user.role !== UserRole.PARENT) {
      throw new Error('Not authorized to send progress updates');
    }

    return this.notificationsService.sendProgressUpdate(
      parentId,
      body.childName,
      body.progress
    );
  }

  @Post('send-alert/:parentId')
  async sendAlert(
    @Param('parentId') parentId: string,
    @Body() body: { childName: string; alertType: string; message: string },
    @Request() req,
  ) {
    // System-generated or admin only
    if (req.user.role !== UserRole.PARENT) {
      throw new Error('Not authorized to send alerts');
    }

    return this.notificationsService.sendAlertToParent(
      parentId,
      body.childName,
      body.alertType,
      body.message
    );
  }
}