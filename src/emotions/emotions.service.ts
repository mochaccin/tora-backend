// src/emotions/emotions.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Emotion, EmotionDocument, EmotionType, TimeOfDay } from '../shared/schemas/emotion.schema';

@Injectable()
export class EmotionsService {
  constructor(@InjectModel(Emotion.name) private emotionModel: Model<EmotionDocument>) {}

  async create(emotionData: Partial<Emotion>): Promise<Emotion> {
    const emotion = new this.emotionModel(emotionData);
    return emotion.save();
  }

  async findAllByChild(childId: string, date?: Date): Promise<Emotion[]> {
    const query: any = { childId };
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }
    return this.emotionModel.find(query).sort({ date: 1, timeOfDay: 1 }).exec();
  }

  async findOne(id: string, childId: string): Promise<Emotion> {
    const emotion = await this.emotionModel.findOne({ _id: id, childId }).exec();
    if (!emotion) {
      throw new NotFoundException('Emotion record not found');
    }
    return emotion;
  }

  async update(id: string, childId: string, updateData: Partial<Emotion>): Promise<Emotion> {
    const emotion = await this.emotionModel.findOneAndUpdate(
      { _id: id, childId },
      updateData,
      { new: true },
    ).exec();
    if (!emotion) {
      throw new NotFoundException('Emotion record not found');
    }
    return emotion;
  }

  async remove(id: string, childId: string): Promise<void> {
    const result = await this.emotionModel.deleteOne({ _id: id, childId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Emotion record not found');
    }
  }

  async getEmotionsByDateRange(childId: string, startDate: Date, endDate: Date): Promise<Emotion[]> {
    return this.emotionModel.find({
      childId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1, timeOfDay: 1 }).exec();
  }
}