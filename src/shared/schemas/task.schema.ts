// src/shared/schemas/task.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TaskDocument = Task & Document;

export enum TaskStatus {
  PENDING = 'PENDING',
  DONE = 'DONE',
}

@Schema({ timestamps: true })
export class Task {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'CalendarBlock', required: true })
  blockId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ type: String, enum: TaskStatus, default: TaskStatus.PENDING })
  status: TaskStatus;

  @Prop()
  startTime?: Date;

  @Prop()
  endTime?: Date;

  @Prop()
  createdAt?: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);