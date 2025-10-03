// src/shared/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  PARENT = 'parent',
  CHILD = 'child',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: String, enum: UserRole, required: true })
  role: UserRole;

  @Prop({ type: String, required: function() { return this.role === UserRole.CHILD; } })
  parentId?: string;

  @Prop({ type: Date, required: function() { return this.role === UserRole.CHILD; } })
  birthDate?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);