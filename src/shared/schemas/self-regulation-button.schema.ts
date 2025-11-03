// src/shared/schemas/self-regulation-button.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SelfRegulationButtonDocument = SelfRegulationButton & Document & {
  createdAt: Date;
  updatedAt: Date;
};

export enum RegulationLevel {
  LOW = 'LOW',        // Leve - algo de ansiedad
  MEDIUM = 'MEDIUM',  // Moderado - dificultad para concentrarse
  HIGH = 'HIGH',      // Alto - crisis emocional
  CRITICAL = 'CRITICAL' // Crítico - necesita intervención inmediata
}

@Schema({ timestamps: true }) // Esto automáticamente agrega createdAt y updatedAt
export class SelfRegulationButton {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Child', required: true })
  childId: Types.ObjectId;

  @Prop({ type: String, enum: RegulationLevel, required: true })
  level: RegulationLevel;

  @Prop()
  emotion?: string;

  @Prop()
  trigger?: string; // Qué desencadenó la necesidad de autorregulación

  @Prop()
  strategyUsed?: string; // Estrategia que usó o intentó usar

  @Prop({ default: false })
  assistanceRequested: boolean; // Si solicita ayuda de un adulto

  @Prop()
  notes?: string; // Notas adicionales del niño

  @Prop({ default: false })
  resolved: boolean; // Si la situación se resolvió

  @Prop()
  resolvedAt?: Date;

  @Prop()
  resolvedBy?: string; // Quién ayudó a resolver (padre, profesor, etc.)
}

export const SelfRegulationButtonSchema = SchemaFactory.createForClass(SelfRegulationButton);