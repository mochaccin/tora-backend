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

    const parent = await this.parentModel.findById(data.parentId);
    if (!parent) throw new ConflictException('Parent not found');

    const passwordHash = await bcrypt.hash(data.password, 10);
    const child = new this.childModel({
      name: data.name,
      email: data.email,
      passwordHash,
      role: UserRole.CHILD,
      age: data.age,
      grade: data.grade,
      parentId: new Types.ObjectId(data.parentId),
    });

    await child.save();
    parent.children.push(child._id as Types.ObjectId);
    await parent.save();

    return this.generateToken(child);
  }

  async login(data: { email: string; password: string }) {
    const user = await this.userModel.findOne({ email: data.email });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    let userData: any;
    if (user.role === UserRole.PARENT) {
      userData = await this.parentModel.findById(user._id).populate('children');
    } else {
      userData = await this.childModel.findById(user._id).populate('parentId');
    }

    return this.generateToken(userData || user);
  }

  private generateToken(user: any) {
    const payload = { email: user.email, sub: user._id, role: user.role, name: user.name };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...(user.role === UserRole.PARENT ? { phone: user.phone, children: user.children } : {}),
        ...(user.role === UserRole.CHILD ? { age: user.age, grade: user.grade, parentId: user.parentId } : {}),
      },
    };
  }
}