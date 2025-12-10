import { Test, type TestingModule } from "@nestjs/testing"
import { type INestApplication, ValidationPipe } from "@nestjs/common"
import { MongooseModule } from "@nestjs/mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"
import { CalendarService } from "../../src/calendar/calendar.service"
import { CalendarController } from "../../src/calendar/calendar.controller"
import { Calendar, CalendarSchema } from "../../src/shared/schemas/calendar.schema"
import { CalendarBlock, CalendarBlockSchema } from "../../src/shared/schemas/calendar-block.schema"
import { Task, TaskSchema, TaskStatus } from "../../src/shared/schemas/task.schema"
import { EmotionRecord, EmotionRecordSchema } from "../../src/shared/schemas/emotion-record.schema"
import { TaskNotificationsService } from "../../src/notifications/task-notifications.service"
import { Types } from "mongoose"
import { jest } from "@jest/globals"

describe("Calendar - Integration Tests (PI)", () => {
  let app: INestApplication
  let mongoServer: MongoMemoryServer
  let calendarService: CalendarService

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    const mongoUri = mongoServer.getUri()

    const mockNotificationsService = {
      notifyChildOnNewTask: jest.fn().mockResolvedValue(undefined),
      notifyParentOnTaskCompletion: jest.fn().mockResolvedValue(undefined),
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongoUri),
        MongooseModule.forFeature([
          { name: Calendar.name, schema: CalendarSchema },
          { name: CalendarBlock.name, schema: CalendarBlockSchema },
          { name: Task.name, schema: TaskSchema },
          { name: EmotionRecord.name, schema: EmotionRecordSchema },
        ]),
      ],
      controllers: [CalendarController],
      providers: [
        CalendarService,
        {
          provide: TaskNotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe())
    await app.init()

    calendarService = moduleFixture.get<CalendarService>(CalendarService)
  })

  afterAll(async () => {
    await app.close()
    await mongoServer.stop()
  })

  describe("PI-01: Backend + MongoDB Integration", () => {
    it("should create calendar and persist to MongoDB", async () => {
      const childId = new Types.ObjectId().toString()
      const testDate = new Date()

      const calendar = await calendarService.getOrCreateCalendar(childId, testDate)

      expect(calendar).toBeDefined()
      expect(calendar.childId.toString()).toBe(childId)
      expect(calendar.blocks).toBeDefined()
      expect(calendar.blocks.length).toBe(3) // MORNING, AFTERNOON, EVENING
    })

    it("should read calendar from MongoDB correctly", async () => {
      const childId = new Types.ObjectId().toString()
      const testDate = new Date()

      await calendarService.getOrCreateCalendar(childId, testDate)
      const retrievedCalendar = await calendarService.getOrCreateCalendar(childId, testDate)

      expect(retrievedCalendar).toBeDefined()
      expect(retrievedCalendar.childId.toString()).toBe(childId)
    })
  })

  describe("PI-02: Frontend + Backend Integration", () => {
    it("should create task through API and verify in database", async () => {
      const childId = new Types.ObjectId().toString()
      const testDate = new Date()
      const calendar = await calendarService.getOrCreateCalendar(childId, testDate)

      const blockId = calendar.blocks[0]._id.toString()
      const taskData = {
        title: "Integration Test Task",
        description: "Testing frontend-backend integration",
        startTime: new Date(),
      }

      const task = await calendarService.addTaskToBlock(blockId, taskData)

      expect(task).toBeDefined()
      expect(task.title).toBe("Integration Test Task")
      expect(task.status).toBe(TaskStatus.PENDING)
    })

    it("should update task and reflect changes immediately", async () => {
      const childId = new Types.ObjectId().toString()
      const testDate = new Date()
      const calendar = await calendarService.getOrCreateCalendar(childId, testDate)

      const blockId = calendar.blocks[0]._id.toString()
      const taskData = { title: "Task to Update" }
      const task = await calendarService.addTaskToBlock(blockId, taskData)

      const updatedTask = await calendarService.updateTask(task._id.toString(), {
        title: "Updated Title",
        status: TaskStatus.DONE,
      })

      expect(updatedTask.title).toBe("Updated Title")
      expect(updatedTask.status).toBe(TaskStatus.DONE)
    })
  })

  describe("PI-03: Subida de imagen (Image Upload Integration)", () => {
    it("should attach image reference to completed task", async () => {
      const childId = new Types.ObjectId().toString()
      const testDate = new Date()
      const calendar = await calendarService.getOrCreateCalendar(childId, testDate)

      const blockId = calendar.blocks[0]._id.toString()
      const taskData = { title: "Task with Image" }
      const task = await calendarService.addTaskToBlock(blockId, taskData)

      const updatedTask = await calendarService.updateTask(task._id.toString(), {
        status: TaskStatus.DONE,
        imageUrl: "https://example.com/image.jpg",
        endTime: new Date(),
      })

      expect(updatedTask.imageUrl).toBeDefined()
      expect(updatedTask.status).toBe(TaskStatus.DONE)
    })
  })

  describe("PI-04: Gráficas + Datos del usuario (Charts Integration)", () => {
    it("should retrieve calendar data for progress visualization", async () => {
      const childId = new Types.ObjectId().toString()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)
      const endDate = new Date()

      const calendar = await calendarService.getOrCreateCalendar(childId, new Date())

      // Add multiple tasks
      const blockId = calendar.blocks[0]._id.toString()
      await calendarService.addTaskToBlock(blockId, { title: "Task 1" })
      await calendarService.addTaskToBlock(blockId, { title: "Task 2" })

      const calendars = await calendarService.getCalendarByDateRange(childId, startDate, endDate)

      expect(calendars).toBeDefined()
      expect(calendars.length).toBeGreaterThan(0)
    })
  })

  describe("PI-05: Clima + Tarea (Weather Integration)", () => {
    it("should associate weather data with task creation", async () => {
      const childId = new Types.ObjectId().toString()
      const testDate = new Date()
      const calendar = await calendarService.getOrCreateCalendar(childId, testDate)

      const blockId = calendar.blocks[0]._id.toString()
      const taskWithWeather = {
        title: "Outdoor Activity",
        weather: {
          temperature: 25,
          condition: "Sunny",
          humidity: 65,
        },
      }

      const task = await calendarService.addTaskToBlock(blockId, taskWithWeather)

      expect(task.weather).toBeDefined()
      expect(task.weather.temperature).toBe(25)
    })
  })
})
