// src/recommendations/recommendations.controller.ts
import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RecommendationCategory } from '../shared/schemas/recommendation.schema';

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
  constructor(private recommendationsService: RecommendationsService) {}

  @Get()
  async getRecommendations(
    @Query('category') category: RecommendationCategory,
    @Query('age') age: number,
    @Request() req,
  ) {
    // If age is provided, use it, otherwise get recommendations for the user's context
    if (age) {
      return this.recommendationsService.getRecommendationsByAgeAndCategory(age, category);
    }

    // For children, get recommendations based on their profile
    if (req.user.role === 'CHILD') {
      return this.recommendationsService.getRecommendationsForChild(req.user.userId.toString(), category);
    }

    // For parents, get recommendations for early school by default
    return this.recommendationsService.getRecommendationsByAgeAndCategory(8, category);
  }

  @Get('categories')
  async getCategories() {
    return this.recommendationsService.getAllCategories();
  }

  @Get('child/:childId')
  async getRecommendationsForSpecificChild(
    @Param('childId') childId: string,
    @Query('category') category: RecommendationCategory,
    @Request() req,
  ) {
    // Only parents can access specific child recommendations
    if (req.user.role !== 'PARENT') {
      throw new Error('Only parents can access this endpoint');
    }

    return this.recommendationsService.getRecommendationsForChild(childId, category);
  }
}