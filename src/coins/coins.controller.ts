// src/coins/coins.controller.ts
import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { CoinsService } from './coins.service';
import { AddCoinsDto } from './dto/add-coins.dto';
import { UpdateCoinsDto } from './dto/update-coins.dto';

@Controller('coins')
export class CoinsController {
  constructor(private readonly coinsService: CoinsService) {}

  @Get(':childId')
  getCoins(@Param('childId') childId: string) {
    return this.coinsService.getCoins(childId);
  }

  @Post(':childId/add')
  addCoins(@Param('childId') childId: string, @Body() dto: AddCoinsDto) {
    return this.coinsService.addCoins(childId, dto);
  }

  @Patch(':childId')
  updateCoins(@Param('childId') childId: string, @Body() dto: UpdateCoinsDto) {
    return this.coinsService.updateCoins(childId, dto);
  }
}
