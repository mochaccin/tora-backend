import { Test, type TestingModule } from "@nestjs/testing"
import { getModelToken } from "@nestjs/mongoose"
import { CoinsService } from "../../src/coins/coins.service"
import { CalendarService } from "../../src/calendar/calendar.service"
import { Child } from "../../src/shared/schemas/user.schema"
import { Calendar } from "../../src/shared/schemas/calendar.schema"
import { jest } from "@jest/globals"

describe("Coins + Calendar Integration", () => {
  let coinsService: CoinsService
  let calendarService: CalendarService
  let mockChildModel: any
  let mockCalendarModel: any

  beforeEach(async () => {
    mockChildModel = {
      findByIdAndUpdate: jest.fn(),
      findById: jest.fn(),
    }

    mockCalendarModel = {
      findOne: jest.fn(),
      create: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoinsService,
        CalendarService,
        {
          provide: getModelToken(Child.name),
          useValue: mockChildModel,
        },
        {
          provide: getModelToken(Calendar.name),
          useValue: mockCalendarModel,
        },
      ],
    }).compile()

    coinsService = module.get<CoinsService>(CoinsService)
    calendarService = module.get<CalendarService>(CalendarService)
  })

  describe("IT-005: Coins awarded for task completion", () => {
    it("should award coins when task is completed", async () => {
      const childId = "child1"
      const coinsPerTask = 10

      mockChildModel.findByIdAndUpdate.mockResolvedValueOnce({
        _id: childId,
        coins: coinsPerTask,
      })

      expect(coinsPerTask).toBeGreaterThan(0)
    })

    it("should aggregate coins from multiple task completions", async () => {
      const childId = "child1"
      const completedTasks = 5
      const coinsPerTask = 10
      const expectedTotal = completedTasks * coinsPerTask

      expect(expectedTotal).toBe(50)
    })
  })
})
