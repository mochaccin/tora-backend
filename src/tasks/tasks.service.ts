// src/tasks/tasks.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument, TaskStatus } from '../shared/schemas/task.schema';

@Injectable()
export class TasksService {
  constructor(@InjectModel(Task.name) private taskModel: Model<TaskDocument>) {}

  async create(taskData: Partial<Task>): Promise<Task> {
    const task = new this.taskModel(taskData);
    return task.save();
  }

  async findAllByChild(childId: string, date?: Date): Promise<Task[]> {
    const query: any = { childId };
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.scheduledDate = { $gte: startOfDay, $lte: endOfDay };
    }
    return this.taskModel.find(query).sort({ scheduledDate: 1 }).exec();
  }

  async findOne(id: string, childId: string): Promise<Task> {
    const task = await this.taskModel.findOne({ _id: id, childId }).exec();
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async update(id: string, childId: string, updateData: Partial<Task>): Promise<Task> {
    const task = await this.taskModel.findOneAndUpdate(
      { _id: id, childId },
      updateData,
      { new: true },
    ).exec();
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async remove(id: string, childId: string): Promise<void> {
    const result = await this.taskModel.deleteOne({ _id: id, childId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Task not found');
    }
  }

  async completeTask(id: string, childId: string): Promise<Task> {
    const task = await this.taskModel.findOneAndUpdate(
      { _id: id, childId },
      { 
        status: TaskStatus.COMPLETED,
        completedAt: new Date()
      },
      { new: true },
    ).exec();
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }
}