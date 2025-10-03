// src/shared/schemas/calendar-block.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CalendarBlockDocument = CalendarBlock & Document;

export enum Period {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  EVENING = 'EVENING',
}

@Schema()
export class CalendarBlock {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Calendar', required: true })
  calendarId: Types.ObjectId;

  @Prop({ type: String, enum: Period, required: true })
  period: Period;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Task' }] })
  tasks: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'EmotionRecord' })
  emotion?: Types.ObjectId;
}

export const CalendarBlockSchema = SchemaFactory.createForClass(CalendarBlock);