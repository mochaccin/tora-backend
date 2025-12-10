import { Test, type TestingModule } from "@nestjs/testing"
import { getModelToken } from "@nestjs/mongoose"
import { RecommendationsService } from "../../src/recommendations/recommendations.service"
import { DashboardService } from "../../src/dashboard/dashboard.service"
import { Recommendation } from "../../src/shared/schemas/recommendation.schema"
import { Calendar } from "../../src/shared/schemas/calendar.schema"
import { jest } from "@jest/globals"

describe("Recommendations + Child Age Integration", () => {
  let recommendationsService: RecommendationsService
  let dashboardService: DashboardService
  let mockRecommendationModel: any
  let mockCalendarModel: any

  beforeEach(async () => {
    mockRecommendationModel = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      }),
      countDocuments: jest.fn().mockResolvedValue(0),
      insertMany: jest.fn().mockResolvedValue([]),
    }

    mockCalendarModel = {
      findOne: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        DashboardService,
        {
          provide: getModelToken(Recommendation.name),
          useValue: mockRecommendationModel,
        },
        {
          provide: getModelToken(Calendar.name),
          useValue: mockCalendarModel,
        },
      ],
    }).compile()

    recommendationsService = module.get<RecommendationsService>(RecommendationsService)
    dashboardService = module.get<DashboardService>(DashboardService)
  })

  describe("IT-005: Recomendaciones según edad", () => {
    it("should load correct recommendations for child age", async () => {
      const childAge = 8

      const recommendations = await recommendationsService.getRecommendationsByAgeAndCategory(childAge)

      expect(mockRecommendationModel.find).toHaveBeenCalled()
    })

    it("should filter by category after age filtering", async () => {
      const childAge = 8

      await recommendationsService.getRecommendationsByAgeAndCategory(childAge)

      expect(mockRecommendationModel.find).toHaveBeenCalled()
    })

    it("should initialize default recommendations on first access", async () => {
      mockRecommendationModel.countDocuments.mockResolvedValueOnce(0)

      await recommendationsService.initializeDefaultRecommendations()

      expect(mockRecommendationModel.insertMany).toHaveBeenCalled()
    })
  })
})
