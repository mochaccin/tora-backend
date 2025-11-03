// src/coins/coins.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Child, ChildDocument } from 'src/shared/schemas/user.schema';
import { AddCoinsDto } from './dto/add-coins.dto';
import { UpdateCoinsDto } from './dto/update-coins.dto';

@Injectable()
export class CoinsService {
  constructor(@InjectModel(Child.name) private childModel: Model<ChildDocument>) {}

  async getCoins(childId: string) {
    const child = await this.childModel.findById(childId).select('coins name');
    if (!child) throw new NotFoundException('Child not found');
    return { childId, name: child.name, coins: child.coins };
  }

  async addCoins(childId: string, addCoinsDto: AddCoinsDto) {
    const { amount } = addCoinsDto;
    const child = await this.childModel.findById(childId);
    if (!child) throw new NotFoundException('Child not found');

    child.coins += amount;
    await child.save();

    return { message: 'Coins added successfully', coins: child.coins };
  }

  async updateCoins(childId: string, updateCoinsDto: UpdateCoinsDto) {
    const { coins } = updateCoinsDto;
    const child = await this.childModel.findById(childId);
    if (!child) throw new NotFoundException('Child not found');

    child.coins = coins;
    await child.save();

    return { message: 'Coins updated successfully', coins: child.coins };
  }
}
