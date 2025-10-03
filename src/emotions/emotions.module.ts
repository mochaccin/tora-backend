// src/emotions/emotions.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmotionsService } from './emotions.service';
import { EmotionsController } from './emotions.controller';
import { Emotion, EmotionSchema } from '../shared/schemas/emotion.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Emotion.name, schema: EmotionSchema }]),
  ],
  controllers: [EmotionsController],
  providers: [EmotionsService],
  exports: [EmotionsService],
})
export class EmotionsModule {}