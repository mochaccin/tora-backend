// src/shared/schemas/calendar.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CalendarDocument = Calendar & Document;

@Schema()
export class Calendar {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Child', required: true })
  childId: Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'CalendarBlock' }] })
  blocks: Types.ObjectId[];
}

export const CalendarSchema = SchemaFactory.createForClass(Calendar);