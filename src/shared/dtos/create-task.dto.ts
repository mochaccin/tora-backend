// src/shared/dtos/create-task.dto.ts
export class CreateTaskDto {
  title: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
}