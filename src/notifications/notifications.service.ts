import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as admin from 'firebase-admin';
import { DeviceToken, DeviceTokenDocument, DeviceType } from '../shared/schemas/device-token.schema';
import { User, UserDocument, UserRole } from '../shared/schemas/user.schema';
import { Child, ChildDocument } from '../shared/schemas/user.schema';
import { initializeFirebase } from '../shared/firebase/firebase.config';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseAdmin: admin.app.App;

  constructor(
    @InjectModel(DeviceToken.name) private deviceTokenModel: Model<DeviceTokenDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Child.name) private childModel: Model<ChildDocument>,
  ) {
    this.firebaseAdmin = initializeFirebase();
  }

  async registerDeviceToken(userId: string, token: string, deviceType: DeviceType) {
    // Check if token already exists
    const existingToken = await this.deviceTokenModel.findOne({ token }).exec();
    
    if (existingToken) {
      // Update existing token
      existingToken.userId = new Types.ObjectId(userId);
      existingToken.deviceType = deviceType;
      existingToken.lastUsed = new Date();
      existingToken.active = true;
      return await existingToken.save();
    }

    // Create new token
    const deviceToken = new this.deviceTokenModel({
      token,
      userId: new Types.ObjectId(userId),
      deviceType,
      lastUsed: new Date(),
      active: true,
    });

    return await deviceToken.save();
  }

  async unregisterDeviceToken(token: string) {
    return await this.deviceTokenModel.findOneAndUpdate(
      { token },
      { active: false },
      { new: true }
    ).exec();
  }

  async unregisterAllUserTokens(userId: string) {
    return await this.deviceTokenModel.updateMany(
      { userId: new Types.ObjectId(userId) },
      { active: false }
    ).exec();
  }

  async sendToUser(userId: string, title: string, body: string, data?: Record<string, any>, imageUrl?: string) {
    const tokens = await this.getUserTokens(userId);
    
    if (tokens.length === 0) {
      this.logger.warn(`No active tokens found for user ${userId}`);
      return { success: false, message: 'No active tokens found' };
    }

    return await this.sendNotification(tokens, title, body, data, imageUrl);
  }

  async sendToChild(childId: string, title: string, body: string, data?: Record<string, any>, imageUrl?: string) {
    // Send to child
    const childTokens = await this.getUserTokens(childId);
    
    // Also send to parent
    const child = await this.childModel.findById(childId).exec();
    let parentTokens: string[] = [];
    
    if (child && child.parentId) {
      parentTokens = await this.getUserTokens(child.parentId.toString());
    }

    const allTokens = [...childTokens, ...parentTokens];
    
    if (allTokens.length === 0) {
      this.logger.warn(`No active tokens found for child ${childId}`);
      return { success: false, message: 'No active tokens found' };
    }

    return await this.sendNotification(allTokens, title, body, data, imageUrl);
  }

  async sendToParent(parentId: string, title: string, body: string, data?: Record<string, any>, imageUrl?: string) {
    const tokens = await this.getUserTokens(parentId);
    
    if (tokens.length === 0) {
      this.logger.warn(`No active tokens found for parent ${parentId}`);
      return { success: false, message: 'No active tokens found' };
    }

    return await this.sendNotification(tokens, title, body, data, imageUrl);
  }

  async sendToAllUsers(title: string, body: string, data?: Record<string, any>, imageUrl?: string) {
    const tokens = await this.getAllActiveTokens();
    
    if (tokens.length === 0) {
      this.logger.warn('No active tokens found');
      return { success: false, message: 'No active tokens found' };
    }

    return await this.sendNotification(tokens, title, body, data, imageUrl);
  }

  async sendTaskReminder(childId: string, taskTitle: string, dueTime?: Date) {
    const title = '📝 Recordatorio de tarea';
    const body = `Tienes pendiente: ${taskTitle}`;
    const data = {
      type: 'TASK_REMINDER',
      childId,
      taskTitle,
      ...(dueTime && { dueTime: dueTime.toISOString() })
    };

    return await this.sendToChild(childId, title, body, data);
  }

  async sendEmotionCheckin(childId: string, period: string) {
    const title = '😊 ¿Cómo te sientes?';
    const body = `Es hora de registrar tus emociones de la ${period}`;
    const data = {
      type: 'EMOTION_CHECKIN',
      childId,
      period
    };

    return await this.sendToChild(childId, title, body, data);
  }

  async sendProgressUpdate(parentId: string, childName: string, progress: string) {
    const title = '📊 Actualización de progreso';
    const body = `${childName} ha ${progress}`;
    const data = {
      type: 'PROGRESS_UPDATE',
      parentId,
      childName
    };

    return await this.sendToParent(parentId, title, body, data);
  }

  async sendAlertToParent(parentId: string, childName: string, alertType: string, message: string) {
    const title = '🚨 Alerta importante';
    const body = `${childName}: ${message}`;
    const data = {
      type: 'ALERT',
      parentId,
      childName,
      alertType
    };

    return await this.sendToParent(parentId, title, body, data);
  }

  private async getUserTokens(userId: string): Promise<string[]> {
    const tokens = await this.deviceTokenModel
      .find({ 
        userId: new Types.ObjectId(userId),
        active: true 
      })
      .select('token')
      .exec();

    return tokens.map(token => token.token);
  }

  private async getAllActiveTokens(): Promise<string[]> {
    const tokens = await this.deviceTokenModel
      .find({ active: true })
      .select('token')
      .exec();

    return tokens.map(token => token.token);
  }

  private async sendNotification(
    tokens: string[], 
    title: string, 
    body: string, 
    data?: Record<string, any>, 
    imageUrl?: string
  ) {
    const message: admin.messaging.MulticastMessage = {
      notification: {
        title,
        body,
        imageUrl,
      },
      data,
      tokens,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    try {
      const response = await this.firebaseAdmin.messaging().sendEachForMulticast(message);
      
      this.logger.log(`Successfully sent notifications: ${response.successCount}`);
      
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            this.logger.error(`Failed to send to token ${tokens[idx]}: ${resp.error?.message}`);
            // Optionally mark token as inactive if it's invalid
            if (resp.error?.code === 'messaging/invalid-registration-token' || 
                resp.error?.code === 'messaging/registration-token-not-registered') {
              this.deactivateToken(tokens[idx]);
            }
          }
        });
      }

      return {
        success: true,
        sentCount: response.successCount,
        failedCount: response.failureCount,
        responses: response.responses.map((resp, idx) => ({
          token: tokens[idx],
          success: resp.success,
          error: resp.error?.message,
        })),
      };
    } catch (error) {
      this.logger.error('Error sending notifications:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async deactivateToken(token: string) {
    await this.deviceTokenModel.updateOne(
      { token },
      { active: false }
    ).exec();
  }
}