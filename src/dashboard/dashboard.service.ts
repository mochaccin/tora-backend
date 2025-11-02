// src/dashboard/dashboard.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Child, ChildDocument } from '../shared/schemas/user.schema';
import { Calendar, CalendarDocument } from '../shared/schemas/calendar.schema';
import { CalendarBlock, CalendarBlockDocument, Period } from '../shared/schemas/calendar-block.schema';
import { Task, TaskDocument, TaskStatus } from '../shared/schemas/task.schema';
import { EmotionRecord, EmotionRecordDocument, EmotionType } from '../shared/schemas/emotion-record.schema';
import { SelfRegulationButton, SelfRegulationButtonDocument, RegulationLevel } from '../shared/schemas/self-regulation-button.schema';

export interface Alert {
  id: string;
  childId: string;
  type: 'DYSREGULATION' | 'PANIC_BUTTON' | 'LOW_COMPLETION' | 'NEGATIVE_EMOTION' | 'SELF_REGULATION_ALERT';
  description: string;
  timestamp: Date;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  regulationId?: string;
}

export interface DashboardResponse {
  child: {
    id: string;
    name: string;
    grade: string;
    age: number;
  };
  summary: {
    period: {
      from: string;
      to: string;
    };
    completedTasksPercentage: number;
    panicButtonCount: number;
    totalTasks: number;
    completedTasks: number;
    selfRegulationEvents: number;
    unresolvedAlerts: number;
  };
  emotions: {
    lastTwoWeeks: Array<{
      date: string;
      morning?: EmotionType;
      afternoon?: EmotionType;
      evening?: EmotionType;
    }>;
    monthlyVariation: Array<{
      date: string;
      emotion: EmotionType;
    }>;
  };
  alerts: Alert[];
  recentSelfRegulationEvents: Array<{
    id: string;
    level: RegulationLevel;
    emotion?: string;
    trigger?: string;
    assistanceRequested: boolean;
    createdAt: Date;
    resolved: boolean;
  }>;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Child.name) private childModel: Model<ChildDocument>,
    @InjectModel(Calendar.name) private calendarModel: Model<CalendarDocument>,
    @InjectModel(CalendarBlock.name) private calendarBlockModel: Model<CalendarBlockDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(EmotionRecord.name) private emotionRecordModel: Model<EmotionRecordDocument>,
    @InjectModel(SelfRegulationButton.name) private selfRegulationModel: Model<SelfRegulationButtonDocument>,
  ) {}

  async getParentDashboard(parentId: string, childId: string): Promise<DashboardResponse> {
    // Validate parent-child relationship
    let childObjectId: Types.ObjectId;
    let parentObjectId: Types.ObjectId;
    
    try {
      childObjectId = new Types.ObjectId(childId);
      parentObjectId = new Types.ObjectId(parentId);
    } catch (error) {
      throw new NotFoundException('Invalid ID format');
    }

    const child = await this.childModel.findOne({ 
      _id: childObjectId, 
      parentId: parentObjectId 
    }).exec();

    if (!child) {
      throw new NotFoundException('Child not found or access denied');
    }

    // Calculate date ranges
    const today = new Date();
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(today.getDate() - 14);
    
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setDate(today.getDate() - 30);

    // Get data in parallel for better performance
    const [calendars, tasks, emotions, panicButtonCount, selfRegulationEvents] = await Promise.all([
      this.getCalendarsInRange(childId, twoWeeksAgo, today),
      this.getTasksInRange(childId, twoWeeksAgo, today),
      this.getEmotionsInRange(childId, oneMonthAgo, today),
      this.getPanicButtonCount(childId, twoWeeksAgo, today),
      this.getSelfRegulationEvents(childId, twoWeeksAgo, today),
    ]);

    // Process emotions for last two weeks
    const lastTwoWeeksEmotions = this.processLastTwoWeeksEmotions(calendars);
    
    // Process monthly emotion variation
    const monthlyVariation = this.processMonthlyEmotionVariation(emotions);

    // Calculate task statistics
    const taskStats = this.calculateTaskStatistics(tasks);

    // Get recent self-regulation events (last 5 events)
    const recentSelfRegulationEvents = await this.getRecentSelfRegulationEvents(childId);

    // Generate alerts including self-regulation events
    const alerts = this.generateAlerts(calendars, tasks, emotions, selfRegulationEvents, childId);

    return {
      child: {
        id: child._id.toString(),
        name: child.name,
        grade: child.grade,
        age: child.age,
      },
      summary: {
        period: {
          from: twoWeeksAgo.toISOString().split('T')[0],
          to: today.toISOString().split('T')[0],
        },
        completedTasksPercentage: taskStats.percentage,
        panicButtonCount,
        totalTasks: taskStats.total,
        completedTasks: taskStats.completed,
        selfRegulationEvents: selfRegulationEvents.length,
        unresolvedAlerts: alerts.length,
      },
      emotions: {
        lastTwoWeeks: lastTwoWeeksEmotions,
        monthlyVariation,
      },
      alerts,
      recentSelfRegulationEvents,
    };
  }

  private async getSelfRegulationEvents(childId: string, from: Date, to: Date) {
    let childObjectId: Types.ObjectId;
    try {
      childObjectId = new Types.ObjectId(childId);
    } catch (error) {
      return [];
    }

    return this.selfRegulationModel
      .find({
        childId: childObjectId,
        createdAt: { $gte: from, $lte: to },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  private async getRecentSelfRegulationEvents(childId: string, limit: number = 5) {
    let childObjectId: Types.ObjectId;
    try {
      childObjectId = new Types.ObjectId(childId);
    } catch (error) {
      return [];
    }

    const events = await this.selfRegulationModel
      .find({
        childId: childObjectId,
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    return events.map(event => ({
      id: event._id.toString(),
      level: event.level,
      emotion: event.emotion,
      trigger: event.trigger,
      assistanceRequested: event.assistanceRequested,
      createdAt: event.createdAt,
      resolved: event.resolved,
    }));
  }

  private async getCalendarsInRange(childId: string, from: Date, to: Date) {
    let childObjectId: Types.ObjectId;
    try {
      childObjectId = new Types.ObjectId(childId);
    } catch (error) {
      return [];
    }

    return this.calendarModel
      .find({
        childId: childObjectId,
        date: { $gte: from, $lte: to },
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
  }

  private async getTasksInRange(childId: string, from: Date, to: Date) {
    let childObjectId: Types.ObjectId;
    try {
      childObjectId = new Types.ObjectId(childId);
    } catch (error) {
      return [];
    }

    // Get calendars first to find relevant blocks
    const calendars = await this.calendarModel
      .find({
        childId: childObjectId,
        date: { $gte: from, $lte: to },
      })
      .select('blocks')
      .exec();

    const blockIds = calendars.flatMap(calendar => calendar.blocks);

    if (blockIds.length === 0) return [];

    return this.taskModel
      .find({
        blockId: { $in: blockIds },
      })
      .exec();
  }

  private async getEmotionsInRange(childId: string, from: Date, to: Date) {
    let childObjectId: Types.ObjectId;
    try {
      childObjectId = new Types.ObjectId(childId);
    } catch (error) {
      return [];
    }

    // Get calendars first to find relevant blocks
    const calendars = await this.calendarModel
      .find({
        childId: childObjectId,
        date: { $gte: from, $lte: to },
      })
      .select('blocks')
      .exec();

    const blockIds = calendars.flatMap(calendar => calendar.blocks);

    if (blockIds.length === 0) return [];

    return this.emotionRecordModel
      .find({
        blockId: { $in: blockIds },
      })
      .populate('blockId')
      .exec();
  }

  private async getPanicButtonCount(childId: string, from: Date, to: Date): Promise<number> {
    // For now, we'll simulate panic button counts based on negative emotions
    // In a real app, you'd have a separate panic button model
    const emotions = await this.getEmotionsInRange(childId, from, to);
    
    const negativeEmotions = emotions.filter(emotion => 
      [EmotionType.SAD, EmotionType.ANGRY, EmotionType.SO_SO].includes(emotion.emotion)
    );

    // Simulate: every 3 negative emotions = 1 panic button press
    return Math.floor(negativeEmotions.length / 3);
  }

  private processLastTwoWeeksEmotions(calendars: CalendarDocument[]): any[] {
    const emotionMap = new Map<string, { morning?: EmotionType; afternoon?: EmotionType; evening?: EmotionType }>();

    calendars.forEach(calendar => {
      // Verificar que calendar y calendar.date existan
      if (!calendar || !calendar.date) return;
      
      const dateStr = calendar.date.toISOString().split('T')[0];
      const dayEmotions: { morning?: EmotionType; afternoon?: EmotionType; evening?: EmotionType } = {};

      // Verificar que calendar.blocks exista y sea un array
      if (calendar.blocks && Array.isArray(calendar.blocks)) {
        calendar.blocks.forEach((block: any) => {
          // Verificar que block y block.emotion existan
          if (block && block.emotion) {
            const period = block.period?.toLowerCase() as 'morning' | 'afternoon' | 'evening';
            if (period) {
              dayEmotions[period] = block.emotion.emotion;
            }
          }
        });
      }

      emotionMap.set(dateStr, dayEmotions);
    });

    // Generate array for last 14 days
    const result = [];
    const today = new Date();
    
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      result.push({
        date: dateStr,
        morning: emotionMap.get(dateStr)?.morning,
        afternoon: emotionMap.get(dateStr)?.afternoon,
        evening: emotionMap.get(dateStr)?.evening,
      });
    }

    return result;
  }

  private processMonthlyEmotionVariation(emotions: EmotionRecordDocument[]): any[] {
    const emotionByDate = new Map<string, EmotionType>();
    
    emotions.forEach(emotion => {
      // Verificar que emotion y emotion.blockId existan
      if (!emotion || !emotion.blockId) return;
      
      const block = emotion.blockId as any;
      
      // Verificar que block.calendarId exista
      if (block && block.calendarId) {
        const calendar = block.calendarId as any;
        
        // Verificar que calendar.date exista
        if (calendar && calendar.date) {
          const dateStr = calendar.date.toISOString().split('T')[0];
          
          // Use the first emotion of the day as representative
          if (!emotionByDate.has(dateStr)) {
            emotionByDate.set(dateStr, emotion.emotion);
          }
        }
      }
    });

    return Array.from(emotionByDate.entries())
      .map(([date, emotion]) => ({ date, emotion }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days
  }

  private calculateTaskStatistics(tasks: TaskDocument[]): { total: number; completed: number; percentage: number } {
    // Verificar que tasks sea un array
    if (!Array.isArray(tasks)) {
      return { total: 0, completed: 0, percentage: 0 };
    }

    const total = tasks.length;
    const completed = tasks.filter(task => task && task.status === TaskStatus.DONE).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, percentage };
  }

  private generateAlerts(
    calendars: CalendarDocument[], 
    tasks: TaskDocument[], 
    emotions: EmotionRecordDocument[], 
    selfRegulationEvents: SelfRegulationButtonDocument[],
    childId: string
  ): Alert[] {
    const alerts: Alert[] = [];
    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);

    try {
      // Check for low task completion rate in last week
      const recentTasks = Array.isArray(tasks) ? tasks.filter(task => {
        if (!task) return false;
        
        const taskDate = task.createdAt || new Date();
        return taskDate >= oneWeekAgo;
      }) : [];

      if (recentTasks.length > 0) {
        const completionRate = recentTasks.filter(t => t && t.status === TaskStatus.DONE).length / recentTasks.length;
        if (completionRate < 0.5) {
          alerts.push({
            id: `alert-${Date.now()}-1`,
            childId,
            type: 'LOW_COMPLETION',
            description: `Baja tasa de completación de tareas (${Math.round(completionRate * 100)}%) en la última semana`,
            timestamp: new Date(),
          });
        }
      }

      // Check for negative emotions in last 3 days
      const recentEmotions = Array.isArray(emotions) ? emotions.filter(emotion => {
        if (!emotion) return false;
        
        const emotionDate = emotion.createdAt || new Date();
        return emotionDate >= oneWeekAgo;
      }) : [];

      const negativeEmotions = recentEmotions.filter(e => 
        e && [EmotionType.SAD, EmotionType.ANGRY].includes(e.emotion)
      );

      if (negativeEmotions.length >= 3) {
        alerts.push({
          id: `alert-${Date.now()}-2`,
          childId,
          type: 'NEGATIVE_EMOTION',
          description: `Múltiples emociones negativas registradas (${negativeEmotions.length} en la última semana)`,
          timestamp: new Date(),
        });
      }

      // Add self-regulation events as alerts (only unresolved ones from last 24 hours)
      const recentSelfRegulationAlerts = Array.isArray(selfRegulationEvents) ? 
        selfRegulationEvents.filter(event => {
          if (!event) return false;
          const eventDate = event.createdAt || new Date();
          const twentyFourHoursAgo = new Date(today);
          twentyFourHoursAgo.setDate(today.getDate() - 1);
          return eventDate >= twentyFourHoursAgo && !event.resolved;
        }) : [];

      recentSelfRegulationAlerts.forEach(event => {
        const severityMap: Record<RegulationLevel, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = {
          [RegulationLevel.LOW]: 'LOW',
          [RegulationLevel.MEDIUM]: 'MEDIUM', 
          [RegulationLevel.HIGH]: 'HIGH',
          [RegulationLevel.CRITICAL]: 'CRITICAL'
        };

        let description = `Botón de autorregulación activado (Nivel: ${event.level})`;
        if (event.emotion) {
          description += ` - Emoción: ${event.emotion}`;
        }
        if (event.assistanceRequested) {
          description += ' - 🚨 SOLICITA AYUDA';
        }

        alerts.push({
          id: `alert-${event._id.toString()}`,
          childId,
          type: 'SELF_REGULATION_ALERT',
          description,
          timestamp: event.createdAt,
          severity: severityMap[event.level],
          regulationId: event._id.toString(),
        });
      });

      // Simulate panic button alerts (based on negative emotions)
      if (negativeEmotions.length >= 2) {
        const firstEmotion = negativeEmotions[0];
        alerts.push({
          id: `alert-${Date.now()}-3`,
          childId,
          type: 'PANIC_BUTTON',
          description: 'Posible episodio de desregulación emocional detectado',
          timestamp: new Date(firstEmotion?.createdAt || new Date()),
        });
      }
    } catch (error) {
      console.error('Error generating alerts:', error);
      // Continue without alerts if there's an error
    }

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);
  }
}