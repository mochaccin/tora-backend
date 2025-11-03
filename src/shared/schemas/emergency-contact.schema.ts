// src/shared/schemas/emergency-contact.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EmergencyContactDocument = EmergencyContact & Document;

@Schema({ timestamps: true })
export class EmergencyContact {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Parent', required: true })
  parentId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  relationship: string; // Abuelo, tío, terapeuta, etc.

  @Prop({ default: true })
  active: boolean;

  @Prop({ default: false })
  receiveAlerts: boolean; // Si debe recibir alertas del botón

  @Prop({ default: 0 })
  priority: number; // Orden de contacto (0 = primario)
}

export const EmergencyContactSchema = SchemaFactory.createForClass(EmergencyContact);