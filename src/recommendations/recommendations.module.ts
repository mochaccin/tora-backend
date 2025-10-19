// src/recommendations/recommendations.module.ts
import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';
import { Recommendation, RecommendationSchema } from '../shared/schemas/recommendation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Recommendation.name, schema: RecommendationSchema },
    ]),
  ],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
  exports: [RecommendationsService],
})
export class RecommendationsModule implements OnModuleInit {
  constructor(private recommendationsService: RecommendationsService) {}

  async onModuleInit() {
    await this.recommendationsService.initializeDefaultRecommendations();
  }
}