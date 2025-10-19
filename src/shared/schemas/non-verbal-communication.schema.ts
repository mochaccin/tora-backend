// src/shared/schemas/non-verbal-communication.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AgeGroup } from '../../shared/schemas/recommendation.schema';

export type NonVerbalCommunicationDocument = NonVerbalCommunication & Document;

export enum CommunicationType {
  GESTURE = 'GESTURE',
  FACIAL_EXPRESSION = 'FACIAL_EXPRESSION',
  BODY_LANGUAGE = 'BODY_LANGUAGE',
  SOCIAL_PHRASE = 'SOCIAL_PHRASE'
}

@Schema({ timestamps: true })
export class NonVerbalCommunication {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: String, enum: CommunicationType, required: true })
  type: CommunicationType;

  @Prop()
  imageUrl?: string;

  @Prop({ type: [String], default: [] })
  examples: string[];

  @Prop({ type: [String], default: [] })
  typicalPhrases: string[];

  @Prop({ type: [String], default: [] })
  whatItMeans: string[];

  @Prop({ type: [String], default: [] })
  howToRespond: string[];

  @Prop({ type: String, enum: AgeGroup, required: true })
  ageGroup: AgeGroup;

  @Prop({ default: true })
  active: boolean;
}

export const NonVerbalCommunicationSchema = SchemaFactory.createForClass(NonVerbalCommunication);