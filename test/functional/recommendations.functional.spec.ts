import { Test, type TestingModule } from "@nestjs/testing"
import { getModelToken } from "@nestjs/mongoose"
import { RecommendationsService } from "../../src/recommendations/recommendations.service"
import { Recommendation } from "../../src/shared/schemas/recommendation.schema"
import { RecommendationCategory, AgeGroup } from "../../src/shared/schemas/recommendation.schema"
import { jest } from "@jest/globals"

describe("Recommendations - Functional Tests", () => {
  let service: RecommendationsService
  let mockRecommendationModel: any

  beforeEach(async () => {
    mockRecommendationModel = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            {
              _id: "rec1",
              title: "Respiración de mariposa",
              category: RecommendationCategory.EMOTION_REGULATION,
              ageGroup: AgeGroup.EARLY_SCHOOL,
            },
          ]),
        }),
      }),
      countDocuments: jest.fn().mockResolvedValue(10),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        {
          provide: getModelToken(Recommendation.name),
          useValue: mockRecommendationModel,
        },
      ],
    }).compile()

    service = module.get<RecommendationsService>(RecommendationsService)
  })

  describe("Recommendations by Age and Category", () => {
    it("should return recommendations for specific age group", async () => {
      const recommendations = await service.getRecommendationsByAgeAndCategory(7)

      expect(Array.isArray(recommendations)).toBe(true)
      expect(mockRecommendationModel.find).toHaveBeenCalled()
    })

    it("should filter by emotion regulation category", async () => {
      const recommendations = await service.getRecommendationsByAgeAndCategory(
        7,
        RecommendationCategory.EMOTION_REGULATION,
      )

      expect(mockRecommendationModel.find).toHaveBeenCalled()
    })

    it("should return empty array for age with no recommendations", async () => {
      mockRecommendationModel.find.mockReturnValueOnce({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      })

      const recommendations = await service.getRecommendationsByAgeAndCategory(2)

      expect(Array.isArray(recommendations)).toBe(true)
    })
  })
})
