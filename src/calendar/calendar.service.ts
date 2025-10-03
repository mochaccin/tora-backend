// src/calendar/calendar.service.ts
import { Injectable } from '@nestjs/common';
import { TasksService } from '../tasks/tasks.service';
import { EmotionsService } from '../emotions/emotions.service';

@Injectable()
export class CalendarService {
  constructor(
    private tasksService: TasksService,
    private emotionsService: EmotionsService,
  ) {}

  async getDailyOverview(childId: string, date: Date) {
    const [tasks, emotions] = await Promise.all([
      this.tasksService.findAllByChild(childId, date),
      this.emotionsService.findAllByChild(childId, date),
    ]);

    return {
      date,
      tasks,
      emotions,
      summary: {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(task => task.status === 'completed').length,
        emotionsRecorded: emotions.length,
      },
    };
  }

  async getWeeklyOverview(childId: string, startDate: Date) {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const [tasks, emotions] = await Promise.all([
      this.tasksService.findAllByChild(childId),
      this.emotionsService.getEmotionsByDateRange(childId, startDate, endDate),
    ]);

    const weeklyData = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 7; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayTasks = tasks.filter(task => 
        task.scheduledDate.toISOString().split('T')[0] === dateStr
      );
      const dayEmotions = emotions.filter(emotion =>
        emotion.date.toISOString().split('T')[0] === dateStr
      );

      weeklyData.push({
        date: new Date(currentDate),
        tasks: dayTasks,
        emotions: dayEmotions,
        summary: {
          totalTasks: dayTasks.length,
          completedTasks: dayTasks.filter(task => task.status === 'completed').length,
          emotionsRecorded: dayEmotions.length,
        },
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return weeklyData;
  }
}