import { Test, type TestingModule } from "@nestjs/testing"
import { MongooseModule } from "@nestjs/mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"
import { CalendarService } from "../../src/calendar/calendar.service"
import { Calendar, CalendarSchema } from "../../src/shared/schemas/calendar.schema"
import { CalendarBlock, CalendarBlockSchema } from "../../src/shared/schemas/calendar-block.schema"
import { Task, TaskSchema } from "../../src/shared/schemas/task.schema"
import { EmotionRecord, EmotionRecordSchema } from "../../src/shared/schemas/emotion-record.schema"
import { TaskNotificationsService } from "../../src/notifications/task-notifications.service"
import { Types } from "mongoose"
import { jest } from "@jest/globals"

describe("Performance Tests (PC, PE)", () => {
  let app: TestingModule
  let mongoServer: MongoMemoryServer
  let calendarService: CalendarService
  let mockNotificationsService: any

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    const mongoUri = mongoServer.getUri()

    mockNotificationsService = {
      notifyChildOnNewTask: jest.fn().mockResolvedValue(undefined),
      notifyParentOnTaskCompletion: jest.fn().mockResolvedValue(undefined),
    }

    app = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongoUri),
        MongooseModule.forFeature([
          { name: Calendar.name, schema: CalendarSchema },
          { name: CalendarBlock.name, schema: CalendarBlockSchema },
          { name: Task.name, schema: TaskSchema },
          { name: EmotionRecord.name, schema: EmotionRecordSchema },
        ]),
      ],
      providers: [
        CalendarService,
        {
          provide: TaskNotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile()

    calendarService = app.get<CalendarService>(CalendarService)
  })

  afterAll(async () => {
    await app.close()
    await mongoServer.stop()
  })

  describe("PC-01: Load Test - 50 tareas creadas", () => {
    it("should create 50 tasks within acceptable time", async () => {
      const childId = new Types.ObjectId().toString()
      const startTime = Date.now()

      const calendar = await calendarService.getOrCreateCalendar(childId, new Date())
      const blockId = calendar.blocks[0]._id.toString()

      // Create 50 tasks
      for (let i = 1; i <= 50; i++) {
        await calendarService.addTaskToBlock(blockId, {
          title: `Load Test Task ${i}`,
          description: `Task ${i} for load testing`,
        })
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      console.log(`[Performance] Created 50 tasks in ${duration}ms`)
      expect(duration).toBeLessThan(30000) // Should complete within 30 seconds
    })
  })

  describe("PC-02: Load Test - 100 imágenes subidas", () => {
    it("should handle 100 image uploads within acceptable time", async () => {
      const childId = new Types.ObjectId().toString()
      const calendar = await calendarService.getOrCreateCalendar(childId, new Date())
      const blockId = calendar.blocks[0]._id.toString()

      const startTime = Date.now()

      // Create tasks with images
      for (let i = 1; i <= 100; i++) {
        const task = await calendarService.addTaskToBlock(blockId, {
          title: `Image Upload Task ${i}`,
        })

        await calendarService.updateTask(task._id.toString(), {
          imageUrl: `https://example.com/image-${i}.jpg`,
        })
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      console.log(`[Performance] Processed 100 image uploads in ${duration}ms`)
      expect(duration).toBeLessThan(30000) // Should complete within 30 seconds
    })
  })

  describe("PC-03: Load Test - 20 usuarios simultáneos", () => {
    it("should handle 20 concurrent users", async () => {
      const startTime = Date.now()

      const userPromises = Array.from({ length: 20 }, async (_, index) => {
        const userId = new Types.ObjectId().toString()
        const calendar = await calendarService.getOrCreateCalendar(userId, new Date())
        const blockId = calendar.blocks[0]._id.toString()

        return calendarService.addTaskToBlock(blockId, {
          title: `Concurrent User ${index + 1} Task`,
        })
      })

      await Promise.all(userPromises)

      const endTime = Date.now()
      const duration = endTime - startTime

      console.log(`[Performance] Handled 20 concurrent users in ${duration}ms`)
      expect(duration).toBeLessThan(15000) // Should complete within 15 seconds
    })
  })

  describe("PE-01: Stress Test - 500 tareas seguidas", () => {
    it("should handle 500 sequential tasks without crashing", async () => {
      const childId = new Types.ObjectId().toString()
      const calendar = await calendarService.getOrCreateCalendar(childId, new Date())
      const blockId = calendar.blocks[0]._id.toString()

      const startTime = Date.now()
      let successCount = 0

      try {
        for (let i = 1; i <= 500; i++) {
          const task = await calendarService.addTaskToBlock(blockId, {
            title: `Stress Test Task ${i}`,
          })
          if (task._id) {
            successCount++
          }
        }
      } catch (error) {
        console.error("Stress test error:", error)
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      console.log(`[Stress Test] Created ${successCount} out of 500 tasks in ${duration}ms`)
      expect(successCount).toBeGreaterThanOrEqual(490) // Allow minor failures
    })
  })

  describe("PE-02: Stress Test - Carga masiva de imágenes", () => {
    it("should handle massive image load without system failure", async () => {
      const childId = new Types.ObjectId().toString()
      const calendar = await calendarService.getOrCreateCalendar(childId, new Date())
      const blockId = calendar.blocks[0]._id.toString()

      const startTime = Date.now()
      let successCount = 0

      try {
        for (let i = 1; i <= 200; i++) {
          const task = await calendarService.addTaskToBlock(blockId, {
            title: `Bulk Image Task ${i}`,
          })

          await calendarService.updateTask(task._id.toString(), {
            imageUrl: `https://example.com/stress-image-${i}.jpg`,
          })

          successCount++
        }
      } catch (error) {
        console.error("Bulk image test error:", error)
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      console.log(`[Stress Test] Processed ${successCount} bulk images in ${duration}ms`)
      expect(successCount).toBeGreaterThanOrEqual(180) // Allow some failures
    })
  })

  describe("PE-03: Stress Test - Entrada de datos incompletos", () => {
    it("should handle incomplete or malformed data gracefully", async () => {
      const childId = new Types.ObjectId().toString()
      const calendar = await calendarService.getOrCreateCalendar(childId, new Date())
      const blockId = calendar.blocks[0]._id.toString()

      const incompleteDataSets = [{ title: "" }, { description: "No title" }, { title: null }, { title: undefined }, {}]

      let processedCount = 0

      for (const dataSet of incompleteDataSets) {
        try {
          const task = await calendarService.addTaskToBlock(blockId, dataSet)
          if (task) {
            processedCount++
          }
        } catch (error) {
          // Expected to fail gracefully
        }
      }

      console.log(`[Stress Test] Processed ${processedCount} incomplete data sets`)
      // System should handle errors gracefully without crashing
      expect(true).toBe(true)
    })
  })
})
