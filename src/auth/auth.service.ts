// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole, Parent, ParentDocument, Child, ChildDocument } from '../shared/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Parent.name) private parentModel: Model<ParentDocument>,
    @InjectModel(Child.name) private childModel: Model<ChildDocument>,
    private jwtService: JwtService,
  ) {}

  async registerParent(data: { name: string; email: string; password: string; phone: string }) {
    const existingUser = await this.userModel.findOne({ email: data.email });
    if (existingUser) throw new ConflictException('Email already exists');

    const passwordHash = await bcrypt.hash(data.password, 10);
    const parent = new this.parentModel({
      name: data.name,
      email: data.email,
      passwordHash,
      phone: data.phone,
      role: UserRole.PARENT,
      children: [],
    });

    await parent.save();
    return this.generateToken(parent);
  }

  async registerChild(data: { parentId: string; name: string; email: string; password: string; age: number; grade: string }) {
    const existingUser = await this.userModel.findOne({ email: data.email });
    if (existingUser) throw new ConflictException('Email already exists');

    let parentObjectId: Types.ObjectId;
    try {
      parentObjectId = new Types.ObjectId(data.parentId);
    } catch (error) {
      throw new ConflictException('Invalid parent ID format');
    }

    const parent = await this.parentModel.findById(parentObjectId);
    if (!parent) throw new ConflictException('Parent not found');

    const passwordHash = await bcrypt.hash(data.password, 10);
    const child = new this.childModel({
      name: data.name,
      email: data.email,
      passwordHash,
      role: UserRole.CHILD,
      age: data.age,
      grade: data.grade,
      parentId: parentObjectId,
    });

    await child.save();
    parent.children.push(child._id);
    await parent.save();

    return this.generateToken(child);
  }

  async login(data: { email: string; password: string }) {
    console.log('Login attempt for email:', data.email);
    
    // First try to find in the base User model
    let user = await this.userModel.findOne({ email: data.email }).exec();
    console.log('User found in base model:', user);
    
    if (!user) {
      // If not found in base model, try specific models
      user = await this.parentModel.findOne({ email: data.email }).exec();
      console.log('User found in parent model:', user);
      
      if (!user) {
        user = await this.childModel.findOne({ email: data.email }).exec();
        console.log('User found in child model:', user);
      }
    }

    if (!user) {
      console.log('No user found with email:', data.email);
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('User password hash from DB:', user.passwordHash);
    console.log('Input password:', data.password);

    // Debug: Check if passwordHash exists
    if (!user.passwordHash) {
      console.log('No passwordHash found for user');
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    console.log('Password comparison result:', isPasswordValid);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get populated user data based on role
    let userData: any;
    if (user.role === UserRole.PARENT) {
      userData = await this.parentModel.findById(user._id).populate('children').exec();
    } else {
      userData = await this.childModel.findById(user._id).populate('parentId').exec();
    }

    console.log('Final user data for token:', userData);
    return this.generateToken(userData || user);
  }

  private generateToken(user: any) {
    const payload = { 
      email: user.email, 
      sub: user._id.toString(),
      role: user.role,
      name: user.name 
    };
    
    console.log('JWT Payload:', payload);
    
    const token = this.jwtService.sign(payload);
    console.log('Generated JWT Token:', token);
    
    return {
      access_token: token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        ...(user.role === UserRole.PARENT ? { 
          phone: user.phone, 
          children: user.children?.map((child: any) => child._id?.toString() || child.toString()) 
        } : {}),
        ...(user.role === UserRole.CHILD ? { 
          age: user.age, 
          grade: user.grade, 
          parentId: user.parentId?._id?.toString() || user.parentId?.toString() 
        } : {}),
      },
    };
  }
}