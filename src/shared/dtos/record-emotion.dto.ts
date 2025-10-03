// src/shared/dtos/record-emotion.dto.ts
import { EmotionType } from '../../shared/schemas/emotion-record.schema';

export class RecordEmotionDto {
  emotion: EmotionType;
}