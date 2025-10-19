// src/shared/schemas/device-token.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DeviceTokenDocument = DeviceToken & Document;

export enum DeviceType {
  ANDROID = 'ANDROID',
  IOS = 'IOS',
  WEB = 'WEB'
}

@Schema({ timestamps: true })
export class DeviceToken {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true })
  token: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: DeviceType, required: true })
  deviceType: DeviceType;

  @Prop({ default: true })
  active: boolean;

  @Prop()
  lastUsed?: Date;
}

export const DeviceTokenSchema = SchemaFactory.createForClass(DeviceToken);