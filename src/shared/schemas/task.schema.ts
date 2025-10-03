// src/shared/schemas/task.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TaskDocument = Task & Document;

export enum TaskStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class Task {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  scheduledDate: Date;

  @Prop({ type: String, enum: TaskStatus, default: TaskStatus.PENDING })
  status: TaskStatus;

  @Prop({ required: true })
  childId: string;

  @Prop()
  completedAt?: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);