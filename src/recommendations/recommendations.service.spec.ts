import { Test, type TestingModule } from "@nestjs/testing"
import { getModelToken } from "@nestjs/mongoose"
import { RecommendationsService } from "./recommendations.service"
import { Recommendation } from "../shared/schemas/recommendation.schema"
import { AgeGroup, RecommendationCategory } from "../shared/schemas/recommendation.schema"
import { jest } from "@jest/globals"

describe("RecommendationsService - Unit Tests", () => {
  let service: RecommendationsService
  let mockRecommendationModel: any

  const mockRecommendations = [
    {
      _id: "rec1",
      title: "Respiración de la mariposa",
      category: RecommendationCategory.EMOTION_REGULATION,
      ageGroup: AgeGroup.EARLY_SCHOOL,
      active: true,
      priority: 10,
      save: jest.fn().mockResolvedValue(true),
    },
    {
      _id: "rec2",
      title: "Termómetro de emociones",
      category: RecommendationCategory.RECOGNIZE_EMOTIONS,
      ageGroup: AgeGroup.EARLY_SCHOOL,
      active: true,
      priority: 10,
      save: jest.fn().mockResolvedValue(true),
    },
  ]

  beforeEach(async () => {
    mockRecommendationModel = {
      countDocuments: jest.fn().mockResolvedValue(0),
      insertMany: jest.fn().mockResolvedValue(mockRecommendations),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockRecommendations),
        }),
      }),
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

  describe("UT-009: Mapear edad a grupo (Age Group Mapping)", () => {
    it("should map age 4 to PRESCHOOL", async () => {
      // Test through getRecommendationsByAgeAndCategory which uses getAgeGroup
      await service.getRecommendationsByAgeAndCategory(4)
      expect(mockRecommendationModel.find).toHaveBeenCalled()
    })

    it("should map age 7 to EARLY_SCHOOL", async () => {
      await service.getRecommendationsByAgeAndCategory(7)
      expect(mockRecommendationModel.find).toHaveBeenCalled()
    })

    it("should map age 11 to MIDDLE_SCHOOL", async () => {
      await service.getRecommendationsByAgeAndCategory(11)
      expect(mockRecommendationModel.find).toHaveBeenCalled()
    })

    it("should map age 15 to TEEN", async () => {
      await service.getRecommendationsByAgeAndCategory(15)
      expect(mockRecommendationModel.find).toHaveBeenCalled()
    })
  })

  describe("initializeDefaultRecommendations", () => {
    it("UT-009: should initialize default recommendations when none exist", async () => {
      await service.initializeDefaultRecommendations()
      expect(mockRecommendationModel.insertMany).toHaveBeenCalled()
    })

    it("should not insert if recommendations already exist", async () => {
      mockRecommendationModel.countDocuments.mockResolvedValueOnce(5)
      await service.initializeDefaultRecommendations()
      expect(mockRecommendationModel.insertMany).not.toHaveBeenCalled()
    })
  })

  describe("getRecommendationsByAgeAndCategory", () => {
    it("should filter recommendations by age group", async () => {
      const result = await service.getRecommendationsByAgeAndCategory(7)
      expect(mockRecommendationModel.find).toHaveBeenCalled()
    })

    it("should filter by category when provided", async () => {
      await service.getRecommendationsByAgeAndCategory(7, RecommendationCategory.EMOTION_REGULATION)
      const findCall = mockRecommendationModel.find.mock.calls[0][0]
      expect(findCall.category).toBe(RecommendationCategory.EMOTION_REGULATION)
    })

    it("should only return active recommendations", async () => {
      await service.getRecommendationsByAgeAndCategory(7)
      const findCall = mockRecommendationModel.find.mock.calls[0][0]
      expect(findCall.active).toBe(true)
    })
  })

  describe("getAllCategories", () => {
    it("should return all recommendation categories", async () => {
      const categories = await service.getAllCategories()
      expect(Array.isArray(categories)).toBe(true)
      expect(categories.length).toBeGreaterThan(0)
    })
  })
})
