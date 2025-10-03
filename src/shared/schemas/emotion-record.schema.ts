// src/shared/schemas/emotion-record.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EmotionRecordDocument = EmotionRecord & Document;

export enum EmotionType {
  HAPPY = 'HAPPY',
  SAD = 'SAD',
  SO_SO = 'SO_SO',
  ANGRY = 'ANGRY',
  CONTENT = 'CONTENT',
}

@Schema({ timestamps: true })
export class EmotionRecord {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'CalendarBlock', required: true })
  blockId: Types.ObjectId;

  @Prop({ type: String, enum: EmotionType, required: true })
  emotion: EmotionType;

  @Prop()
  createdAt?: Date;
}

export const EmotionRecordSchema = SchemaFactory.createForClass(EmotionRecord);