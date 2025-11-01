// src/shared/schemas/whatsapp-config.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WhatsAppConfigDocument = WhatsAppConfig & Document;

@Schema({ timestamps: true })
export class WhatsAppConfig {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Parent', required: true, unique: true })
  parentId: Types.ObjectId;

  @Prop({ default: false })
  whatsappEnabled: boolean;

  @Prop()
  whatsappPhoneNumber?: string;

  @Prop()
  whatsappSession?: string; // Para almacenar la sesión de WhatsApp

  @Prop({ default: false })
  whatsappAuthenticated: boolean;

  @Prop()
  lastQrCode?: string;
}

export const WhatsAppConfigSchema = SchemaFactory.createForClass(WhatsAppConfig);