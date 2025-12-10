import { Test, type TestingModule } from "@nestjs/testing"
import { getModelToken } from "@nestjs/mongoose"
import { NonVerbalCommunicationService } from "./non-verbal-communication.service"
import { NonVerbalCommunication, CommunicationType } from "../shared/schemas/non-verbal-communication.schema"
import { AgeGroup } from "../shared/schemas/recommendation.schema"
import { jest } from "@jest/globals"

describe("NonVerbalCommunicationService - Unit Tests", () => {
  let service: NonVerbalCommunicationService
  let mockNonVerbalModel: any

  const mockCommunications = [
    {
      _id: "comm1",
      title: "Brazo cruzado",
      type: CommunicationType.GESTURE,
      ageGroup: AgeGroup.EARLY_SCHOOL,
      active: true,
      typicalPhrases: ["No estoy de acuerdo"],
    },
    {
      _id: "comm2",
      title: "Cejas fruncidas",
      type: CommunicationType.FACIAL_EXPRESSION,
      ageGroup: AgeGroup.EARLY_SCHOOL,
      active: true,
      typicalPhrases: ["Estoy confundido"],
    },
  ]

  beforeEach(async () => {
    mockNonVerbalModel = {
      countDocuments: jest.fn().mockResolvedValue(0),
      insertMany: jest.fn().mockResolvedValue(mockCommunications),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockCommunications),
        }),
      }),
      select: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCommunications),
      }),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NonVerbalCommunicationService,
        {
          provide: getModelToken(NonVerbalCommunication.name),
          useValue: mockNonVerbalModel,
        },
      ],
    }).compile()

    service = module.get<NonVerbalCommunicationService>(NonVerbalCommunicationService)
  })

  describe("UT-010: Interpretar gestos (Interpret Gestures)", () => {
    it("should retrieve gesture interpretations", async () => {
      const result = await service.getByType(CommunicationType.GESTURE)
      expect(result.length).toBeGreaterThan(0)
    })

    it("should get facial expression interpretations", async () => {
      await service.getByType(CommunicationType.FACIAL_EXPRESSION)
      expect(mockNonVerbalModel.find).toHaveBeenCalledWith({
        type: CommunicationType.FACIAL_EXPRESSION,
        active: true,
      })
    })

    it("should filter by age group when provided", async () => {
      await service.getByType(CommunicationType.GESTURE, AgeGroup.EARLY_SCHOOL)
      const findCall = mockNonVerbalModel.find.mock.calls[0][0]
      expect(findCall.ageGroup).toBe(AgeGroup.EARLY_SCHOOL)
    })
  })

  describe("initializeDefaultCommunications", () => {
    it("should initialize default non-verbal communications", async () => {
      await service.initializeDefaultCommunications()
      expect(mockNonVerbalModel.insertMany).toHaveBeenCalled()
    })

    it("should not insert if communications already exist", async () => {
      mockNonVerbalModel.countDocuments.mockResolvedValueOnce(5)
      await service.initializeDefaultCommunications()
      expect(mockNonVerbalModel.insertMany).not.toHaveBeenCalled()
    })
  })

  describe("getAllByAgeGroup", () => {
    it("should get all communications for an age group", async () => {
      const result = await service.getAllByAgeGroup(7)
      expect(result.length).toBeGreaterThan(0)
    })

    it("should filter by type when provided", async () => {
      await service.getAllByAgeGroup(7, CommunicationType.GESTURE)
      const findCall = mockNonVerbalModel.find.mock.calls[0][0]
      expect(findCall.type).toBe(CommunicationType.GESTURE)
    })

    it("should only return active communications", async () => {
      await service.getAllByAgeGroup(7)
      const findCall = mockNonVerbalModel.find.mock.calls[0][0]
      expect(findCall.active).toBe(true)
    })
  })

  describe("getTypicalPhrases", () => {
    it("should return typical phrases from communications", async () => {
      mockNonVerbalModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockCommunications),
        }),
      })
      const phrases = await service.getTypicalPhrases()
      expect(Array.isArray(phrases)).toBe(true)
    })
  })
})
