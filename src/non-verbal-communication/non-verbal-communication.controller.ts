// src/non-verbal-communication/non-verbal-communication.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { NonVerbalCommunicationService } from './non-verbal-communication.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CommunicationType } from '../shared/schemas/non-verbal-communication.schema';
import { AgeGroup } from '../shared/schemas/recommendation.schema';

@Controller('non-verbal-communication')
@UseGuards(JwtAuthGuard)
export class NonVerbalCommunicationController {
  constructor(private nonVerbalService: NonVerbalCommunicationService) {}

  @Get()
  async getCommunications(
    @Query('age') age: number,
    @Query('type') type: CommunicationType,
  ) {
    return this.nonVerbalService.getAllByAgeGroup(age || 8, type);
  }

  @Get('phrases')
  async getTypicalPhrases() {
    return this.nonVerbalService.getTypicalPhrases();
  }

  @Get('types')
  async getCommunicationTypes() {
    return Object.values(CommunicationType);
  }

  @Get('age-groups')
  async getAgeGroups() {
    return Object.values(AgeGroup);
  }
}