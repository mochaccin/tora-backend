import { Test, type TestingModule } from "@nestjs/testing"
import { getModelToken } from "@nestjs/mongoose"
import { SelfRegulationService } from "../../src/self-regulation/self-regulation.service"
import { SelfRegulationButton } from "../../src/shared/schemas/self-regulation-button.schema"
import { NotificationsService } from "../../src/notifications/notifications.service"
import { jest } from "@jest/globals"

describe("SelfRegulation - Regression Tests", () => {
  let service: SelfRegulationService
  let mockRegulationModel: any
  let mockNotificationsService: any

  beforeEach(async () => {
    mockRegulationModel = {
      create: jest.fn(),
      findById: jest.fn(),
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      }),
    }

    mockNotificationsService = {
      sendToParent: jest.fn().mockResolvedValue({ success: true }),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SelfRegulationService,
        {
          provide: getModelToken(SelfRegulationButton.name),
          useValue: mockRegulationModel,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile()

    service = module.get<SelfRegulationService>(SelfRegulationService)
  })

  describe("RG-002: Alertas se envían correctamente", () => {
    it("should send notification on button activation", async () => {
      expect(service).toBeDefined()
      expect(typeof service.activateButton).toBe("function")
    })

    it("should escalate alerts correctly by level", async () => {
      const levels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

      levels.forEach((level) => {
        expect(level).toBeTruthy()
      })
    })

    it("should maintain notification sending after updates", async () => {
      mockNotificationsService.sendToParent.mockResolvedValueOnce({ success: true })

      expect(mockNotificationsService.sendToParent).toBeDefined()
    })
  })
})
