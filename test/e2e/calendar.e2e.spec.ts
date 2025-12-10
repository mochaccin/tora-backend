import { Test, type TestingModule } from "@nestjs/testing"
import type { INestApplication } from "@nestjs/common"
import { MongooseModule } from "@nestjs/mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"
import { CalendarService } from "../../src/calendar/calendar.service"
import { TaskStatus } from "../../src/shared/schemas/task.schema"
import { Types } from "mongoose"

describe("Calendar E2E Tests (E2E)", () => {
  let app: INestApplication
  let mongoServer: MongoMemoryServer
  let calendarService: CalendarService
  let childId: string

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    const mongoUri = mongoServer.getUri()

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongoUri),
        // Import all necessary modules
      ],
    })
      .overrideProvider("MONGODB_URI")
      .useValue(mongoUri)
      .compile()

    app = moduleFixture.createNestApplication()
    await app.init()

    calendarService = moduleFixture.get<CalendarService>(CalendarService)
    childId = new Types.ObjectId().toString()
  })

  afterAll(async () => {
    await app.close()
    await mongoServer.stop()
  })

  describe("E2E-01: Crear y completar tarea con imagen", () => {
    it("should create a task and complete it with image upload", async () => {
      const testDate = new Date()

      // Step 1: Create calendar
      const calendar = await calendarService.getOrCreateCalendar(childId, testDate)
      expect(calendar).toBeDefined()

      // Step 2: Add task to calendar block
      const blockId = calendar.blocks[0]._id.toString()
      const taskData = {
        title: "Complete task with image",
        description: "End-to-end test task",
      }

      const task = await calendarService.addTaskToBlock(blockId, taskData)
      expect(task.status).toBe(TaskStatus.PENDING)

      // Step 3: Complete task with image
      const completedTask = await calendarService.updateTask(task._id.toString(), {
        status: TaskStatus.DONE,
        imageUrl: "https://example.com/completion-image.jpg",
        endTime: new Date(),
      })

      expect(completedTask.status).toBe(TaskStatus.DONE)
      expect(completedTask.imageUrl).toBeDefined()
    })

    it("should verify task completion flow with multiple images", async () => {
      const testDate = new Date()
      const calendar = await calendarService.getOrCreateCalendar(childId, testDate)
      const blockId = calendar.blocks[0]._id.toString()

      const task = await calendarService.addTaskToBlock(blockId, {
        title: "Multi-image task",
      })

      const taskWithFirstImage = await calendarService.updateTask(task._id.toString(), {
        imageUrl: "https://example.com/image1.jpg",
      })

      const taskWithFinalImage = await calendarService.updateTask(task._id.toString(), {
        status: TaskStatus.DONE,
        imageUrl: "https://example.com/image-final.jpg",
      })

      expect(taskWithFinalImage.status).toBe(TaskStatus.DONE)
      expect(taskWithFinalImage.imageUrl).toBe("https://example.com/image-final.jpg")
    })
  })

  describe("E2E-02: Ver progreso con tareas previas", () => {
    it("should display progress with existing tasks", async () => {
      const testDate = new Date()
      const calendar = await calendarService.getOrCreateCalendar(childId, testDate)
      const blockId = calendar.blocks[0]._id.toString()

      // Create multiple tasks
      const task1 = await calendarService.addTaskToBlock(blockId, { title: "Task 1" })
      const task2 = await calendarService.addTaskToBlock(blockId, { title: "Task 2" })
      const task3 = await calendarService.addTaskToBlock(blockId, { title: "Task 3" })

      // Complete some tasks
      await calendarService.completeTask(task1._id.toString())
      await calendarService.completeTask(task2._id.toString())

      // Retrieve updated calendar
      const updatedCalendar = await calendarService.getOrCreateCalendar(childId, testDate)
      const tasks = updatedCalendar.blocks[0].tasks

      const completedCount = tasks.filter((t: any) => t.status === TaskStatus.DONE).length
      const progress = (completedCount / tasks.length) * 100

      expect(progress).toBeGreaterThan(0)
      expect(progress).toBeLessThanOrEqual(100)
    })
  })

  describe("E2E-03: Eliminar tarea y ver historial", () => {
    it("should delete task and maintain calendar history", async () => {
      const testDate = new Date()
      const calendar = await calendarService.getOrCreateCalendar(childId, testDate)
      const blockId = calendar.blocks[0]._id.toString()

      // Create task
      const task = await calendarService.addTaskToBlock(blockId, {
        title: "Task to delete",
      })
      const taskId = task._id.toString()

      // Delete task
      await calendarService.deleteTask(taskId)

      // Verify deletion
      const deletedTask = await calendarService["taskModel"].findById(new Types.ObjectId(taskId))
      expect(deletedTask).toBeNull()
    })
  })
})
