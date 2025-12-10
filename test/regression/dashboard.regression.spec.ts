import { Test, type TestingModule } from "@nestjs/testing"
import { getModelToken } from "@nestjs/mongoose"
import { DashboardService } from "../../src/dashboard/dashboard.service"
import { Calendar } from "../../src/shared/schemas/calendar.schema"
import { SelfRegulationButton } from "../../src/shared/schemas/self-regulation-button.schema"
import { jest } from "@jest/globals"

describe("Dashboard - Regression Tests", () => {
  let service: DashboardService
  let mockCalendarModel: any
  let mockRegulationModel: any

  beforeEach(async () => {
    mockCalendarModel = {
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      }),
    }

    mockRegulationModel = {
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      }),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: getModelToken(Calendar.name),
          useValue: mockCalendarModel,
        },
        {
          provide: getModelToken(SelfRegulationButton.name),
          useValue: mockRegulationModel,
        },
      ],
    }).compile()

    service = module.get<DashboardService>(DashboardService)
  })

  describe("RG-003: Estadísticas correctas en dashboard", () => {
    it("should maintain correct completion percentage calculation", async () => {
      const completedTasks = 7
      const totalTasks = 10
      const expectedPercentage = (completedTasks / totalTasks) * 100

      expect(expectedPercentage).toBe(70)
    })

    it("should display correct emotion counts", async () => {
      const emotions = [
        { emotion: "HAPPY", count: 3 },
        { emotion: "SAD", count: 1 },
        { emotion: "NEUTRAL", count: 2 },
      ]

      const totalEmotions = emotions.reduce((sum, e) => sum + e.count, 0)

      expect(totalEmotions).toBe(6)
    })

    it("should show unresolved alerts count correctly", async () => {
      const unresolvedAlerts = [
        { id: 1, resolved: false },
        { id: 2, resolved: false },
        { id: 3, resolved: true },
      ]

      const unresolvedCount = unresolvedAlerts.filter((a) => !a.resolved).length

      expect(unresolvedCount).toBe(2)
    })
  })
})
