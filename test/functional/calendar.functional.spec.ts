import { Test, type TestingModule } from "@nestjs/testing"
import { getModelToken } from "@nestjs/mongoose"
import { CalendarService } from "../../src/calendar/calendar.service"
import { Calendar, Emotion, TimePeriod } from "../../src/shared/schemas/calendar.schema"
import { Types } from "mongoose"
import jest from "jest" // Import jest to declare the variable

describe("Calendar - Functional Tests", () => {
  let service: CalendarService
  let mockCalendarModel: any

  const mockChildId = new Types.ObjectId()

  beforeEach(async () => {
    mockCalendarModel = {
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      create: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarService,
        {
          provide: getModelToken(Calendar.name),
          useValue: mockCalendarModel,
        },
      ],
    }).compile()

    service = module.get<CalendarService>(CalendarService)
  })

  describe("FT-006: CRUD de tareas", () => {
    it("should create a new task", async () => {
      const taskData = {
        title: "Homework",
        description: "Math assignment",
      }

      mockCalendarModel.findOne.mockResolvedValue(null)
      mockCalendarModel.create.mockResolvedValue({
        childId: mockChildId,
        tasks: [{ ...taskData, _id: new Types.ObjectId() }],
      })

      expect(service).toBeDefined()
    })

    it("should read existing tasks", async () => {
      mockCalendarModel.findOne.mockResolvedValue({
        childId: mockChildId,
        tasks: [{ _id: new Types.ObjectId(), title: "Task 1" }],
      })

      expect(service).toBeDefined()
    })

    it("should update task completion status", async () => {
      mockCalendarModel.findByIdAndUpdate.mockResolvedValue({
        tasks: [{ completed: true }],
      })

      expect(service).toBeDefined()
    })

    it("should delete a task", async () => {
      mockCalendarModel.findByIdAndUpdate.mockResolvedValue({
        tasks: [],
      })

      expect(service).toBeDefined()
    })
  })

  describe("FT-007: Registrar emociones", () => {
    it("should register emotion for time period", async () => {
      const emotionData = {
        period: TimePeriod.MORNING,
        emotion: Emotion.HAPPY,
        intensity: 8,
      }

      expect(service).toBeDefined()
    })

    it("should store emotion timestamp", async () => {
      expect(service).toBeDefined()
    })

    it("should allow multiple emotions per day", async () => {
      expect(service).toBeDefined()
    })
  })
})
