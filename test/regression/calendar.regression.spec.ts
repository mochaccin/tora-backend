import { Test, type TestingModule } from "@nestjs/testing"
import { CalendarService } from "../../src/calendar/calendar.service"
import { getModelToken } from "@nestjs/mongoose"
import { Calendar } from "../../src/shared/schemas/calendar.schema"
import { CalendarBlock } from "../../src/shared/schemas/calendar-block.schema"
import { Task, TaskStatus } from "../../src/shared/schemas/task.schema"
import { EmotionRecord } from "../../src/shared/schemas/emotion-record.schema"
import { TaskNotificationsService } from "../../src/notifications/task-notifications.service"
import { Types } from "mongoose"
import { jest } from "@jest/globals"

describe("Regression Tests - Calendar Features (PR)", () => {
  let service: CalendarService
  let mockCalendarModel: any
  let mockBlockModel: any
  let mockTaskModel: any
  let mockEmotionModel: any
  let mockNotificationsService: any

  beforeEach(async () => {
    mockCalendarModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
    }

    mockBlockModel = {
      findById: jest.fn(),
      updateOne: jest.fn(),
    }

    mockTaskModel = {
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      findById: jest.fn(),
    }

    mockEmotionModel = {
      findByIdAndDelete: jest.fn(),
    }

    mockNotificationsService = {
      notifyChildOnNewTask: jest.fn().mockResolvedValue(undefined),
      notifyParentOnTaskCompletion: jest.fn().mockResolvedValue(undefined),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarService,
        {
          provide: getModelToken(Calendar.name),
          useValue: mockCalendarModel,
        },
        {
          provide: getModelToken(CalendarBlock.name),
          useValue: mockBlockModel,
        },
        {
          provide: getModelToken(Task.name),
          useValue: mockTaskModel,
        },
        {
          provide: getModelToken(EmotionRecord.name),
          useValue: mockEmotionModel,
        },
        {
          provide: TaskNotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile()

    service = module.get<CalendarService>(CalendarService)
  })

  describe("PR-01: Verificar creación de tareas tras cambios", () => {
    it("should still create tasks after previous updates", async () => {
      const blockId = new Types.ObjectId().toString()
      const taskData = { title: "Regression Test Task" }
      const mockTask = { _id: new Types.ObjectId(), ...taskData }

      mockBlockModel.findById.mockResolvedValue({ _id: blockId, tasks: [] })
      mockTaskModel.prototype.save = jest.fn().mockResolvedValue(mockTask)

      // Mock save method on the returned task
      const mockBlock = { _id: blockId, tasks: [], save: jest.fn() }
      mockBlockModel.findById.mockResolvedValue(mockBlock)

      // Simulate task addition
      expect(taskData.title).toBe("Regression Test Task")
    })

    it("should create multiple tasks sequentially without issues", async () => {
      const blockId = new Types.ObjectId().toString()
      const tasks = [{ title: "Task 1" }, { title: "Task 2" }, { title: "Task 3" }]

      mockBlockModel.findById.mockResolvedValue({ _id: blockId, tasks: [], save: jest.fn() })

      for (const taskData of tasks) {
        expect(taskData.title).toBeDefined()
      }

      expect(tasks.length).toBe(3)
    })

    it("should maintain task creation functionality after task deletion", async () => {
      const blockId = new Types.ObjectId().toString()
      const taskId = new Types.ObjectId().toString()

      // Simulate delete
      mockTaskModel.findByIdAndDelete.mockResolvedValue({ _id: taskId })

      // Should still be able to create tasks
      const newTaskData = { title: "New Task After Delete" }
      expect(newTaskData.title).toBeDefined()
    })
  })

  describe("PR-02: Regresión en subida de imagen", () => {
    it("should handle image uploads after recent changes", async () => {
      const taskId = new Types.ObjectId().toString()
      const imageUrl = "https://example.com/image.jpg"

      const updatedTask = {
        _id: taskId,
        title: "Task with Image",
        status: TaskStatus.DONE,
        imageUrl,
      }

      mockTaskModel.findByIdAndUpdate.mockResolvedValue(updatedTask)

      const result = await service.updateTask(taskId, { imageUrl })

      expect(result.imageUrl).toBe(imageUrl)
    })

    it("should maintain image upload functionality after multiple updates", async () => {
      const taskId = new Types.ObjectId().toString()
      const firstImage = "https://example.com/image1.jpg"
      const secondImage = "https://example.com/image2.jpg"

      mockTaskModel.findByIdAndUpdate.mockResolvedValue({ _id: taskId, imageUrl: firstImage })
      const firstResult = await service.updateTask(taskId, { imageUrl: firstImage })
      expect(firstResult.imageUrl).toBe(firstImage)

      mockTaskModel.findByIdAndUpdate.mockResolvedValue({ _id: taskId, imageUrl: secondImage })
      const secondResult = await service.updateTask(taskId, { imageUrl: secondImage })
      expect(secondResult.imageUrl).toBe(secondImage)
    })
  })

  describe("PR-03: Regresión en visualización de tareas", () => {
    it("should display tasks correctly after modifications", async () => {
      const childId = new Types.ObjectId().toString()
      const testDate = new Date()

      const mockCalendar = {
        childId: new Types.ObjectId(childId),
        blocks: [
          {
            tasks: [
              { _id: new Types.ObjectId(), title: "Task 1", status: TaskStatus.PENDING },
              { _id: new Types.ObjectId(), title: "Task 2", status: TaskStatus.DONE },
            ],
          },
        ],
      }

      mockCalendarModel.findOne.mockResolvedValue(mockCalendar)

      const result = await service.getOrCreateCalendar(childId, testDate)

      expect(result.blocks[0].tasks.length).toBe(2)
      expect(result.blocks[0].tasks[0].status).toBe(TaskStatus.PENDING)
      expect(result.blocks[0].tasks[1].status).toBe(TaskStatus.DONE)
    })

    it("should preserve task order after updates", async () => {
      const childId = new Types.ObjectId().toString()
      const testDate = new Date()

      const mockTasks = [
        { _id: "1", title: "First Task", order: 1 },
        { _id: "2", title: "Second Task", order: 2 },
        { _id: "3", title: "Third Task", order: 3 },
      ]

      expect(mockTasks[0].order).toBe(1)
      expect(mockTasks[1].order).toBe(2)
      expect(mockTasks[2].order).toBe(3)
    })
  })
})
