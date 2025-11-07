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
    // Buscar directamente en la colección children usando la API nativa
    const childDoc = await this.childModel.collection.findOne({ 
      _id: new Types.ObjectId(childId)
    });
    
    if (!childDoc) throw new NotFoundException('Child not found');
    
    return { 
      childId, 
      name: childDoc.name, 
      coins: childDoc.coins || 0 
    };
  }

  async addCoins(childId: string, addCoinsDto: AddCoinsDto) {
    const { amount } = addCoinsDto;
    
    // Verificar que existe y actualizar usando la colección nativa
    const result = await this.childModel.collection.findOneAndUpdate(
      { _id: new Types.ObjectId(childId) },
      { $inc: { coins: amount } },
      { returnDocument: 'after' }
    );
    
    if (!result.value) throw new NotFoundException('Child not found');

    return { message: 'Coins added successfully', coins: result.value.coins };
  }

  async updateCoins(childId: string, updateCoinsDto: UpdateCoinsDto) {
    const { coins } = updateCoinsDto;
    
    // Verificar que existe y actualizar usando la colección nativa
    const result = await this.childModel.collection.findOneAndUpdate(
      { _id: new Types.ObjectId(childId) },
      { $set: { coins } },
      { returnDocument: 'after' }
    );
    
    if (!result.value) throw new NotFoundException('Child not found');

    return { message: 'Coins updated successfully', coins: result.value.coins };
  }
}
