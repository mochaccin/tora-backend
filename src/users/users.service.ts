// src/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from '../shared/schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findChildrenByParent(parentId: string): Promise<User[]> {
    return this.userModel.find({ parentId, role: UserRole.CHILD }).exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async getChildProfile(childId: string, parentId: string): Promise<User> {
    const child = await this.userModel.findOne({ 
      _id: childId, 
      parentId, 
      role: UserRole.CHILD 
    }).exec();
    
    if (!child) {
      throw new NotFoundException('Child not found');
    }
    return child;
  }
}