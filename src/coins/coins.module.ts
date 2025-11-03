// src/coins/coins.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoinsService } from './coins.service';
import { CoinsController } from './coins.controller';
import { Child, ChildSchema } from 'src/shared/schemas/user.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Child.name, schema: ChildSchema }])],
  controllers: [CoinsController],
  providers: [CoinsService],
})
export class CoinsModule {}
