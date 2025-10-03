// src/calendar/calendar.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Calendar, CalendarDocument } from '../shared/schemas/calendar.schema';
import { CalendarBlock, CalendarBlockDocument, Period } from '../shared/schemas/calendar-block.schema';
import { Task, TaskDocument } from '../shared/schemas/task.schema';
import { EmotionRecord, EmotionRecordDocument } from '../shared/schemas/emotion-record.schema';

@Injectable()
export class CalendarService {
  constructor(
    @InjectModel(Calendar.name) private calendarModel: Model<CalendarDocument>,
    @InjectModel(CalendarBlock.name) private calendarBlockModel: Model<CalendarBlockDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(EmotionRecord.name) private emotionRecordModel: Model<EmotionRecordDocument>,
  ) {}

  async getOrCreateCalendar(childId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    let calendar = await this.calendarModel
      .findOne({
        childId: new Types.ObjectId(childId),
        date: { $gte: startOfDay, $lte: endOfDay },
      })
      .populate({
        path: 'blocks',
        populate: [
          { path: 'tasks', model: 'Task' },
          { path: 'emotion', model: 'EmotionRecord' },
        ],
      })
      .exec();

    if (!calendar) {
      // Create calendar with default blocks
      calendar = new this.calendarModel({
        childId: new Types.ObjectId(childId),
        date: startOfDay,
        blocks: [],
      });

      // Create default blocks for the day
      const periods = [Period.MORNING, Period.AFTERNOON, Period.EVENING];
      for (const period of periods) {
        const block = new this.calendarBlockModel({
          calendarId: calendar._id,
          period,
          tasks: [],
        });
        await block.save();
        calendar.blocks.push(block._id as Types.ObjectId);
      }

      await calendar.save();
      
      // Reload with populated data
      calendar = await this.calendarModel
        .findById(calendar._id)
        .populate({
          path: 'blocks',
          populate: [
            { path: 'tasks', model: 'Task' },
            { path: 'emotion', model: 'EmotionRecord' },
          ],
        })
        .exec();
    }

    return calendar;
  }

  async addTaskToBlock(blockId: string, taskData: Partial<Task>) {
    const block = await this.calendarBlockModel.findById(blockId);
    if (!block) {
      throw new NotFoundException('Calendar block not found');
    }

    const task = new this.taskModel({
      ...taskData,
      blockId: new Types.ObjectId(blockId),
      createdAt: new Date(),
    });

    await task.save();
    
    block.tasks.push(task._id as Types.ObjectId);
    await block.save();

    return task;
  }

  async updateTask(taskId: string, updateData: Partial<Task>) {
    const task = await this.taskModel.findByIdAndUpdate(
      taskId,
      updateData,
      { new: true },
    ).exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async deleteTask(taskId: string) {
    const task = await this.taskModel.findById(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Remove task from block
    await this.calendarBlockModel.updateOne(
      { _id: task.blockId },
      { $pull: { tasks: task._id } },
    );

    await this.taskModel.findByIdAndDelete(taskId);
  }

  async recordEmotion(blockId: string, emotion: string) {
    const block = await this.calendarBlockModel.findById(blockId);
    if (!block) {
      throw new NotFoundException('Calendar block not found');
    }

    // Remove existing emotion if any
    if (block.emotion) {
      await this.emotionRecordModel.findByIdAndDelete(block.emotion);
    }

    const emotionRecord = new this.emotionRecordModel({
      blockId: new Types.ObjectId(blockId),
      emotion,
      createdAt: new Date(),
    });

    await emotionRecord.save();

    block.emotion = emotionRecord._id as Types.ObjectId;
    await block.save();

    return emotionRecord;
  }

  async getCalendarByDateRange(childId: string, startDate: Date, endDate: Date) {
    const calendars = await this.calendarModel
      .find({
        childId: new Types.ObjectId(childId),
        date: { $gte: startDate, $lte: endDate },
      })
      .populate({
        path: 'blocks',
        populate: [
          { path: 'tasks', model: 'Task' },
          { path: 'emotion', model: 'EmotionRecord' },
        ],
      })
      .sort({ date: 1 })
      .exec();

    return calendars;
  }
}