// src/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Parent, ParentDocument, Child, ChildDocument, UserRole } from '../shared/schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(Parent.name) private parentModel: Model<ParentDocument>,
    @InjectModel(Child.name) private childModel: Model<ChildDocument>,
  ) {}

  async findChildrenByParent(parentId: string): Promise<Child[]> {
    let parentObjectId: Types.ObjectId;
    try {
      parentObjectId = new Types.ObjectId(parentId);
    } catch (error) {
      throw new NotFoundException('Invalid parent ID format');
    }

    return this.childModel.find({ parentId: parentObjectId }).exec();
  }

  async findOne(id: string): Promise<Parent | Child> {
    let userObjectId: Types.ObjectId;
    try {
      userObjectId = new Types.ObjectId(id);
    } catch (error) {
      throw new NotFoundException('Invalid user ID format');
    }

    // Try to find as parent first
    let parent = await this.parentModel.findById(userObjectId).populate('children').exec();
    if (parent) return parent;

    // Try to find as child
    const child = await this.childModel.findById(userObjectId).populate('parentId').exec();
    if (child) return child;

    throw new NotFoundException('User not found');
  }

  async getChildProfile(childId: string, parentId: string): Promise<Child> {
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
    }).populate('parentId').exec();
    
    if (!child) {
      throw new NotFoundException('Child not found');
    }
    return child;
  }
}