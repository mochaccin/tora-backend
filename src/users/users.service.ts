// src/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { 
  Parent, 
  ParentDocument, 
  Child, 
  ChildDocument, 
  UserRole 
} from '../shared/schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(Parent.name) private parentModel: Model<ParentDocument>,
    @InjectModel(Child.name) private childModel: Model<ChildDocument>,
  ) {}

  async findChildrenByParent(parentId: string): Promise<Child[]> {
    return this.childModel.find({ parentId }).exec();
  }

  async findOne(id: string): Promise<Parent | Child> {
    // Try to find as parent first
    let user = await this.parentModel.findById(id).populate('children').exec();
    if (user) return user;

    // Try to find as child
    const childUser = await this.childModel.findById(id).populate('parentId').exec();
    if (childUser) return childUser;

    throw new NotFoundException('User not found');
  }

  async getChildProfile(childId: string, parentId: string): Promise<Child> {
    const child = await this.childModel.findOne({ 
      _id: childId, 
      parentId 
    }).populate('parentId').exec();
    
    if (!child) {
      throw new NotFoundException('Child not found');
    }
    return child;
  }
}