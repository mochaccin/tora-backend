// src/shared/schemas/recommendation.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RecommendationDocument = Recommendation & Document;

export enum RecommendationCategory {
  EMOTION_REGULATION = 'EMOTION_REGULATION',
  RECOGNIZE_EMOTIONS = 'RECOGNIZE_EMOTIONS',
  CLASSROOM_RULES = 'CLASSROOM_RULES',
  ASKING_QUESTIONS = 'ASKING_QUESTIONS',
  NON_VERBAL_COMMUNICATION = 'NON_VERBAL_COMMUNICATION',
  SOCIAL_INTERACTION = 'SOCIAL_INTERACTION'
}

export enum AgeGroup {
  PRESCHOOL = 'PRESCHOOL', // 3-5 años
  EARLY_SCHOOL = 'EARLY_SCHOOL', // 6-8 años
  MIDDLE_SCHOOL = 'MIDDLE_SCHOOL', // 9-12 años
  TEEN = 'TEEN' // 13+ años
}

@Schema({ timestamps: true })
export class Recommendation {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  imageUrl?: string;

  @Prop({ type: String, enum: RecommendationCategory, required: true })
  category: RecommendationCategory;

  @Prop({ type: String, enum: AgeGroup, required: true })
  ageGroup: AgeGroup;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: 0 })
  priority: number;

  @Prop({ default: true })
  active: boolean;
}

export const RecommendationSchema = SchemaFactory.createForClass(Recommendation);