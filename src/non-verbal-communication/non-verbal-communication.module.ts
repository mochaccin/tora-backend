// src/non-verbal-communication/non-verbal-communication.module.ts
import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NonVerbalCommunicationService } from './non-verbal-communication.service';
import { NonVerbalCommunicationController } from './non-verbal-communication.controller';
import { NonVerbalCommunication, NonVerbalCommunicationSchema } from '../shared/schemas/non-verbal-communication.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NonVerbalCommunication.name, schema: NonVerbalCommunicationSchema },
    ]),
  ],
  controllers: [NonVerbalCommunicationController],
  providers: [NonVerbalCommunicationService],
  exports: [NonVerbalCommunicationService],
})
export class NonVerbalCommunicationModule implements OnModuleInit {
  constructor(private nonVerbalService: NonVerbalCommunicationService) {}

  async onModuleInit() {
    await this.nonVerbalService.initializeDefaultCommunications();
  }
}