// src/notifications/notifications.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as admin from 'firebase-admin';
import { DeviceToken, DeviceTokenDocument, DeviceType } from '../shared/schemas/device-token.schema';
import { User, UserDocument, UserRole } from '../shared/schemas/user.schema';
import { Child, ChildDocument } from '../shared/schemas/user.schema';
import { initializeFirebase } from '../shared/firebase/firebase.config';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseAdmin: admin.app.App | null = null;

  constructor(
    @InjectModel(DeviceToken.name) private deviceTokenModel: Model<DeviceTokenDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Child.name) private childModel: Model<ChildDocument>,
  ) {}

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      this.firebaseAdmin = initializeFirebase();
      this.logger.log('✅ Firebase Admin SDK initialized in NotificationsService');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Firebase in NotificationsService:', error);
      this.firebaseAdmin = null;
    }
  }

  async registerDeviceToken(userId: string, token: string, deviceType: DeviceType) {
    this.logger.log(`Registering device token for user ${userId}, token: ${token.substring(0, 20)}...`);
    
    try {
      const existingToken = await this.deviceTokenModel.findOne({ token }).exec();
      
      if (existingToken) {
        existingToken.userId = new Types.ObjectId(userId);
        existingToken.deviceType = deviceType;
        existingToken.lastUsed = new Date();
        existingToken.active = true;
        const result = await existingToken.save();
        this.logger.log(`✅ Updated existing device token for user ${userId}`);
        return result;
      }

      const deviceToken = new this.deviceTokenModel({
        token,
        userId: new Types.ObjectId(userId),
        deviceType,
        lastUsed: new Date(),
        active: true,
      });

      const result = await deviceToken.save();
      this.logger.log(`✅ Registered new device token for user ${userId}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Error registering device token: ${error.message}`);
      throw error;
    }
  }

  async unregisterDeviceToken(token: string) {
    try {
      const result = await this.deviceTokenModel.findOneAndUpdate(
        { token },
        { active: false },
        { new: true }
      ).exec();

      if (result) {
        this.logger.log(`✅ Unregistered device token: ${token.substring(0, 20)}...`);
      } else {
        this.logger.warn(`⚠️ Token not found for unregister: ${token.substring(0, 20)}...`);
      }

      return result;
    } catch (error) {
      this.logger.error(`❌ Error unregistering device token: ${error.message}`);
      throw error;
    }
  }

  async unregisterAllUserTokens(userId: string) {
    try {
      const result = await this.deviceTokenModel.updateMany(
        { userId: new Types.ObjectId(userId) },
        { active: false }
      ).exec();

      this.logger.log(`✅ Unregistered all tokens for user ${userId}, modified: ${result.modifiedCount}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Error unregistering all user tokens: ${error.message}`);
      throw error;
    }
  }

  async sendToUser(userId: string, title: string, body: string, data?: Record<string, any>, imageUrl?: string) {
    this.logger.log(`📤 Sending notification to user ${userId}: ${title}`);
    
    if (!this.firebaseAdmin) {
      this.logger.error('❌ Firebase not initialized, cannot send notification');
      return { success: false, error: 'Firebase not configured' };
    }

    const tokens = await this.getUserTokens(userId);
    this.logger.log(`📱 Found ${tokens.length} device tokens for user ${userId}`);
    
    if (tokens.length === 0) {
      this.logger.warn(`⚠️ No active tokens found for user ${userId}`);
      return { success: false, message: 'No active tokens found' };
    }

    return await this.sendNotification(tokens, title, body, data, imageUrl);
  }

  async sendToChild(childId: string, title: string, body: string, data?: Record<string, any>, imageUrl?: string) {
    this.logger.log(`📤 Sending notification to child ${childId}: ${title}`);
    
    if (!this.firebaseAdmin) {
      this.logger.error('❌ Firebase not initialized, cannot send notification');
      return { success: false, error: 'Firebase not configured' };
    }

    const childTokens = await this.getUserTokens(childId);
    
    const child = await this.childModel.findById(childId).exec();
    let parentTokens: string[] = [];
    
    if (child && child.parentId) {
      parentTokens = await this.getUserTokens(child.parentId.toString());
    }

    const allTokens = [...childTokens, ...parentTokens];
    this.logger.log(`📱 Found ${allTokens.length} total device tokens (child: ${childTokens.length}, parent: ${parentTokens.length})`);
    
    if (allTokens.length === 0) {
      this.logger.warn(`⚠️ No active tokens found for child ${childId}`);
      return { success: false, message: 'No active tokens found' };
    }

    return await this.sendNotification(allTokens, title, body, data, imageUrl);
  }

  async sendToParent(parentId: string, title: string, body: string, data?: Record<string, any>, imageUrl?: string) {
    this.logger.log(`📤 Sending notification to parent ${parentId}: ${title}`);
    
    if (!this.firebaseAdmin) {
      this.logger.error('❌ Firebase not initialized, cannot send notification');
      return { success: false, error: 'Firebase not configured' };
    }

    const tokens = await this.getUserTokens(parentId);
    this.logger.log(`📱 Found ${tokens.length} device tokens for parent ${parentId}`);
    
    if (tokens.length === 0) {
      this.logger.warn(`⚠️ No active tokens found for parent ${parentId}`);
      return { success: false, message: 'No active tokens found' };
    }

    return await this.sendNotification(tokens, title, body, data, imageUrl);
  }

  async sendToAllUsers(title: string, body: string, data?: Record<string, any>, imageUrl?: string) {
    this.logger.log(`📤 Sending notification to all users: ${title}`);
    
    if (!this.firebaseAdmin) {
      this.logger.error('❌ Firebase not initialized, cannot send notification');
      return { success: false, error: 'Firebase not configured' };
    }

    const tokens = await this.getAllActiveTokens();
    this.logger.log(`📱 Found ${tokens.length} total active device tokens`);
    
    if (tokens.length === 0) {
      this.logger.warn('⚠️ No active tokens found');
      return { success: false, message: 'No active tokens found' };
    }

    return await this.sendNotification(tokens, title, body, data, imageUrl);
  }

  async sendTaskReminder(childId: string, taskTitle: string, dueTime?: Date) {
    const title = '📝 Recordatorio de tarea';
    const body = `Tienes pendiente: ${taskTitle}`;
    
    // Convertir datos a strings
    const data: Record<string, string> = {
      type: 'TASK_REMINDER',
      childId: childId,
      taskTitle: taskTitle,
    };

    if (dueTime) {
      data.dueTime = dueTime.toISOString();
    }

    return await this.sendToChild(childId, title, body, data);
  }

  async sendEmotionCheckin(childId: string, period: string) {
    const title = '😊 ¿Cómo te sientes?';
    const body = `Es hora de registrar tus emociones de la ${period}`;
    const data: Record<string, string> = {
      type: 'EMOTION_CHECKIN',
      childId: childId,
      period: period
    };

    return await this.sendToChild(childId, title, body, data);
  }

  async sendProgressUpdate(parentId: string, childName: string, progress: string) {
    const title = '📊 Actualización de progreso';
    const body = `${childName} ha ${progress}`;
    const data: Record<string, string> = {
      type: 'PROGRESS_UPDATE',
      parentId: parentId,
      childName: childName
    };

    return await this.sendToParent(parentId, title, body, data);
  }

  async sendAlertToParent(parentId: string, childName: string, alertType: string, message: string) {
    const title = '🚨 Alerta importante';
    const body = `${childName}: ${message}`;
    const data: Record<string, string> = {
      type: 'ALERT',
      parentId: parentId,
      childName: childName,
      alertType: alertType
    };

    return await this.sendToParent(parentId, title, body, data);
  }

  private async getUserTokens(userId: string): Promise<string[]> {
    try {
      const tokens = await this.deviceTokenModel
        .find({ 
          userId: new Types.ObjectId(userId),
          active: true 
        })
        .select('token')
        .exec();

      return tokens.map(token => token.token);
    } catch (error) {
      this.logger.error(`Error getting user tokens for ${userId}:`, error);
      return [];
    }
  }

  private async getAllActiveTokens(): Promise<string[]> {
    try {
      const tokens = await this.deviceTokenModel
        .find({ active: true })
        .select('token')
        .exec();

      return tokens.map(token => token.token);
    } catch (error) {
      this.logger.error('Error getting all active tokens:', error);
      return [];
    }
  }

  private async sendNotification(
    tokens: string[], 
    title: string, 
    body: string, 
    data?: Record<string, any>, 
    imageUrl?: string
  ) {
    if (!this.firebaseAdmin) {
      return { success: false, error: 'Firebase not initialized' };
    }

    // Convertir todos los valores de data a string
    const stringData: Record<string, string> = {};
    if (data) {
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          stringData[key] = String(data[key]);
        }
      });
    }

    const message: admin.messaging.MulticastMessage = {
      notification: {
        title,
        body,
        ...(imageUrl && { imageUrl }),
      },
      data: stringData,
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
      this.logger.log(`🚀 Sending FCM message to ${tokens.length} devices`);
      this.logger.log(`📝 Message: ${title} - ${body}`);
      this.logger.log(`📊 Data: ${JSON.stringify(stringData)}`);
      
      const response = await this.firebaseAdmin.messaging().sendEachForMulticast(message);
      
      this.logger.log(`✅ Successfully sent notifications: ${response.successCount}`);
      this.logger.log(`❌ Failed notifications: ${response.failureCount}`);
      
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            this.logger.error(`Failed to send to token ${tokens[idx].substring(0, 20)}...: ${resp.error?.message}`);
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
          token: tokens[idx].substring(0, 20) + '...', // Log parcial por seguridad
          success: resp.success,
          error: resp.error?.message,
        })),
      };
    } catch (error) {
      this.logger.error('❌ Error sending notifications:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async deactivateToken(token: string) {
    try {
      await this.deviceTokenModel.updateOne(
        { token },
        { active: false }
      ).exec();
      this.logger.log(`🔴 Deactivated invalid token: ${token.substring(0, 20)}...`);
    } catch (error) {
      this.logger.error('Error deactivating token:', error);
    }
  }
}