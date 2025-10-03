// src/shared/schemas/emotion.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EmotionDocument = Emotion & Document;

export enum EmotionType {
  HAPPY = 'happy',
  SAD = 'sad',
  ANGRY = 'angry',
  EXCITED = 'excited',
  CALM = 'calm',
  ANXIOUS = 'anxious',
  TIRED = 'tired',
}

export enum TimeOfDay {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  NIGHT = 'night',
}

@Schema({ timestamps: true })
export class Emotion {
  @Prop({ type: String, enum: EmotionType, required: true })
  emotion: EmotionType;

  @Prop({ type: String, enum: TimeOfDay, required: true })
  timeOfDay: TimeOfDay;

  @Prop({ required: true })
  date: Date;

  @Prop()
  notes?: string;

  @Prop({ required: true })
  childId: string;
}

export const EmotionSchema = SchemaFactory.createForClass(Emotion);