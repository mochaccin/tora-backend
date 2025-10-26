// src/notifications/task-notifications.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotificationsService } from './notifications.service';
import { Task, TaskDocument, TaskStatus } from '../shared/schemas/task.schema';
import { CalendarBlock, CalendarBlockDocument } from '../shared/schemas/calendar-block.schema';
import { Calendar, CalendarDocument } from '../shared/schemas/calendar.schema';
import { Child, ChildDocument } from '../shared/schemas/user.schema';

@Injectable()
export class TaskNotificationsService {
  private readonly logger = new Logger(TaskNotificationsService.name);

  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(CalendarBlock.name) private calendarBlockModel: Model<CalendarBlockDocument>,
    @InjectModel(Calendar.name) private calendarModel: Model<CalendarDocument>,
    @InjectModel(Child.name) private childModel: Model<ChildDocument>,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Notificar al padre cuando un niño completa una tarea
   */
  async notifyParentOnTaskCompletion(taskId: string): Promise<void> {
    try {
      const task = await this.taskModel
        .findById(taskId)
        .populate('blockId')
        .exec();

      if (!task) {
        this.logger.warn(`Task ${taskId} not found`);
        return;
      }

      // Verificar que la tarea esté completada
      if (task.status !== TaskStatus.DONE) {
        this.logger.warn(`Task ${taskId} is not completed, status: ${task.status}`);
        return;
      }

      // Obtener información del bloque y calendario
      const block = await this.calendarBlockModel
        .findById(task.blockId)
        .populate('calendarId')
        .exec();

      if (!block || !block.calendarId) {
        this.logger.warn(`Block or calendar not found for task ${taskId}`);
        return;
      }

      const calendar = block.calendarId as any;
      const childId = calendar.childId;

      // Obtener información del niño
      const child = await this.childModel
        .findById(childId)
        .populate('parentId')
        .exec();

      if (!child || !child.parentId) {
        this.logger.warn(`Child or parent not found for task ${taskId}`);
        return;
      }

      const parentId = (child.parentId as any)._id?.toString() || child.parentId.toString();
      const childName = child.name;
      const taskTitle = task.title;

      // Enviar notificación al padre
      await this.notificationsService.sendToParent(
        parentId,
        '🎉 ¡Tarea Completada!',
        `${childName} ha completado la tarea: "${taskTitle}"`,
        {
          type: 'TASK_COMPLETED',
          taskId: taskId,
          childId: childId.toString(),
          childName: childName,
          taskTitle: taskTitle,
          completedAt: task.endTime?.toISOString() || new Date().toISOString(),
        }
      );

      this.logger.log(`Notification sent to parent ${parentId} for task completion by ${childName}`);
    } catch (error) {
      this.logger.error(`Error sending task completion notification: ${error.message}`, error.stack);
    }
  }

  /**
   * Notificar al niño cuando se le asigna una nueva tarea
   */
  async notifyChildOnNewTask(taskId: string): Promise<void> {
    try {
      const task = await this.taskModel
        .findById(taskId)
        .populate('blockId')
        .exec();

      if (!task) {
        this.logger.warn(`Task ${taskId} not found`);
        return;
      }

      // Obtener información del bloque y calendario
      const block = await this.calendarBlockModel
        .findById(task.blockId)
        .populate('calendarId')
        .exec();

      if (!block || !block.calendarId) {
        this.logger.warn(`Block or calendar not found for task ${taskId}`);
        return;
      }

      const calendar = block.calendarId as any;
      const childId = calendar.childId.toString();

      // Enviar notificación al niño
      await this.notificationsService.sendToChild(
        childId,
        '📝 Nueva Tarea',
        `Tienes una nueva tarea: "${task.title}"`,
        {
          type: 'NEW_TASK',
          taskId: taskId,
          taskTitle: task.title,
          blockId: block._id.toString(),
          period: block.period,
        }
      );

      this.logger.log(`Notification sent to child ${childId} for new task: ${task.title}`);
    } catch (error) {
      this.logger.error(`Error sending new task notification: ${error.message}`, error.stack);
    }
  }

  /**
   * Notificar recordatorio de tarea pendiente
   */
  async notifyTaskReminder(taskId: string): Promise<void> {
    try {
      const task = await this.taskModel
        .findById(taskId)
        .populate('blockId')
        .exec();

      if (!task) {
        this.logger.warn(`Task ${taskId} not found`);
        return;
      }

      // Solo notificar tareas pendientes
      if (task.status !== TaskStatus.PENDING) {
        return;
      }

      // Obtener información del bloque y calendario
      const block = await this.calendarBlockModel
        .findById(task.blockId)
        .populate('calendarId')
        .exec();

      if (!block || !block.calendarId) {
        this.logger.warn(`Block or calendar not found for task ${taskId}`);
        return;
      }

      const calendar = block.calendarId as any;
      const childId = calendar.childId.toString();

      // Enviar recordatorio al niño
      await this.notificationsService.sendToChild(
        childId,
        '⏰ Recordatorio',
        `Recuerda completar: "${task.title}"`,
        {
          type: 'TASK_REMINDER',
          taskId: taskId,
          taskTitle: task.title,
          blockId: block._id.toString(),
          period: block.period,
        }
      );

      this.logger.log(`Reminder sent to child ${childId} for task: ${task.title}`);
    } catch (error) {
      this.logger.error(`Error sending task reminder: ${error.message}`, error.stack);
    }
  }
}