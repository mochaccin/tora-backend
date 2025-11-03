// src/shared/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;
export type ParentDocument = Parent & Document;
export type ChildDocument = Child & Document;

export enum UserRole {
  PARENT = 'PARENT',
  CHILD = 'CHILD',
}

@Schema({ timestamps: true, discriminatorKey: 'role' })
export class User {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ type: String, enum: UserRole, required: true })
  role: UserRole;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Parent Schema
@Schema()
export class Parent extends User {
  @Prop({ required: true })
  phone: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Child' }] })
  children: Types.ObjectId[];
}

export const ParentSchema = SchemaFactory.createForClass(Parent);

// Child Schema
@Schema()
export class Child extends User {
  @Prop({ required: true })
  age: number;

  @Prop({ required: true })
  grade: string;

  @Prop({ type: Types.ObjectId, ref: 'Parent', required: true })
  parentId: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  coins: number; //  Contador de monedas
}

export const ChildSchema = SchemaFactory.createForClass(Child);