// src/calendar/calendar.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Calendar, CalendarDocument } from '../shared/schemas/calendar.schema';
import { CalendarBlock, CalendarBlockDocument, Period } from '../shared/schemas/calendar-block.schema';
import { Task, TaskDocument, TaskStatus } from '../shared/schemas/task.schema';
import { EmotionRecord, EmotionRecordDocument } from '../shared/schemas/emotion-record.schema';
import { TaskNotificationsService } from '../notifications/task-notifications.service';

@Injectable()
export class CalendarService {
  constructor(
    @InjectModel(Calendar.name) private calendarModel: Model<CalendarDocument>,
    @InjectModel(CalendarBlock.name) private calendarBlockModel: Model<CalendarBlockDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(EmotionRecord.name) private emotionRecordModel: Model<EmotionRecordDocument>,
    private taskNotificationsService: TaskNotificationsService,
  ) {}

  async getOrCreateCalendar(childId: string, date: Date) {
    let childObjectId: Types.ObjectId;
    try {
      childObjectId = new Types.ObjectId(childId);
    } catch (error) {
      throw new NotFoundException('Invalid child ID format');
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    let calendar = await this.calendarModel
      .findOne({
        childId: childObjectId,
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
      calendar = new this.calendarModel({
        childId: childObjectId,
        date: startOfDay,
        blocks: [],
      });

      await calendar.save();

      const periods = [Period.MORNING, Period.AFTERNOON, Period.EVENING];
      const blockIds = [];
      
      for (const period of periods) {
        const block = new this.calendarBlockModel({
          calendarId: calendar._id,
          period,
          tasks: [],
        });
        await block.save();
        blockIds.push(block._id);
      }

      calendar.blocks = blockIds;
      await calendar.save();
      
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

  async addTaskToBlock(blockId: string, taskData: any) {
    let blockObjectId: Types.ObjectId;
    try {
      blockObjectId = new Types.ObjectId(blockId);
    } catch (error) {
      throw new NotFoundException('Invalid block ID format');
    }

    const block = await this.calendarBlockModel.findById(blockObjectId);
    if (!block) {
      throw new NotFoundException('Calendar block not found');
    }

    const task = new this.taskModel({
      ...taskData,
      blockId: blockObjectId,
      createdAt: new Date(),
    });

    await task.save();
    
    block.tasks.push(task._id);
    await block.save();

    // Notificar al niño sobre nueva tarea
    await this.taskNotificationsService.notifyChildOnNewTask(task._id.toString());

    return task;
  }

  async updateTask(taskId: string, updateData: any) {
    let taskObjectId: Types.ObjectId;
    try {
      taskObjectId = new Types.ObjectId(taskId);
    } catch (error) {
      throw new NotFoundException('Invalid task ID format');
    }

    const task = await this.taskModel.findByIdAndUpdate(
      taskObjectId,
      updateData,
      { new: true },
    ).exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Verificar si la tarea fue completada
    if (updateData.status === TaskStatus.DONE && task.status === TaskStatus.DONE) {
      // Notificar al padre sobre la tarea completada
      await this.taskNotificationsService.notifyParentOnTaskCompletion(taskId);
    }

    return task;
  }

  async deleteTask(taskId: string) {
    let taskObjectId: Types.ObjectId;
    try {
      taskObjectId = new Types.ObjectId(taskId);
    } catch (error) {
      throw new NotFoundException('Invalid task ID format');
    }

    const task = await this.taskModel.findById(taskObjectId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.calendarBlockModel.updateOne(
      { _id: task.blockId },
      { $pull: { tasks: task._id } },
    );

    await this.taskModel.findByIdAndDelete(taskObjectId);
  }

  async recordEmotion(blockId: string, emotion: string) {
    let blockObjectId: Types.ObjectId;
    try {
      blockObjectId = new Types.ObjectId(blockId);
    } catch (error) {
      throw new NotFoundException('Invalid block ID format');
    }

    const block = await this.calendarBlockModel.findById(blockObjectId);
    if (!block) {
      throw new NotFoundException('Calendar block not found');
    }

    if (block.emotion) {
      await this.emotionRecordModel.findByIdAndDelete(block.emotion);
    }

    const emotionRecord = new this.emotionRecordModel({
      blockId: blockObjectId,
      emotion,
      createdAt: new Date(),
    });

    await emotionRecord.save();

    block.emotion = emotionRecord._id;
    await block.save();

    return emotionRecord;
  }

  async getCalendarByDateRange(childId: string, startDate: Date, endDate: Date) {
    let childObjectId: Types.ObjectId;
    try {
      childObjectId = new Types.ObjectId(childId);
    } catch (error) {
      throw new NotFoundException('Invalid child ID format');
    }

    const calendars = await this.calendarModel
      .find({
        childId: childObjectId,
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

  async completeTask(taskId: string) {
    const task = await this.updateTask(taskId, { 
      status: TaskStatus.DONE,
      endTime: new Date() 
    });

    // Notificar al padre sobre la tarea completada
    await this.taskNotificationsService.notifyParentOnTaskCompletion(taskId);

    return task;
  }
}