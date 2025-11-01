// src/notifications/notifications.controller.ts
import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Request,
  Param,
  Delete,
  NotFoundException 
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { TaskNotificationsService } from './task-notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { 
  RegisterDeviceTokenDto, 
  SendNotificationDto,
  SendToUserDto,
  SendToChildDto,
  SendToParentDto 
} from '../shared/dtos/notification.dto';
import { UserRole } from '../shared/schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument } from '../shared/schemas/task.schema';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private notificationsService: NotificationsService,
    private taskNotificationsService: TaskNotificationsService,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
  ) {}

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

  @Post('send-task-reminder/:taskId')
  async sendTaskReminder(
    @Param('taskId') taskId: string,
    @Request() req,
  ) {
    if (req.user.role !== 'PARENT') {
      throw new Error('Only parents can send task reminders');
    }

    // Verificar que la tarea pertenezca a un hijo del padre
    const task = await this.taskModel
      .findById(taskId)
      .populate({
        path: 'blockId',
        populate: {
          path: 'calendarId'
        }
      })
      .exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.taskNotificationsService.notifyTaskReminder(taskId);
    
    return { 
      success: true, 
      message: 'Task reminder sent successfully' 
    };
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

  // Endpoint de test para debuggear notificaciones
  @Post('test-notification')
  async testNotification(
    @Body() body: { userId: string; title?: string; body?: string },
    @Request() req,
  ) {
    console.log('🧪 Testing notification endpoint');
    
    // Permitir solo en desarrollo o para admins
    if (process.env.NODE_ENV !== 'development' && req.user.role !== UserRole.PARENT) {
      throw new Error('Not authorized');
    }

    const result = await this.notificationsService.sendToUser(
      body.userId,
      body.title || 'Test Notification',
      body.body || 'This is a test notification from the backend',
      { type: 'TEST', timestamp: new Date().toISOString() }
    );

    return {
      message: 'Test notification sent',
      result
    };
  }
}