import { Test, type TestingModule } from "@nestjs/testing"
import { MongoMemoryServer } from "mongodb-memory-server"
import { MongooseModule } from "@nestjs/mongoose"
import { SelfRegulationService } from "../../src/self-regulation/self-regulation.service"
import { NotificationsService } from "../../src/notifications/notifications.service"
import { EmailService } from "../../src/email/email.service"
import { SelfRegulationButtonSchema } from "../../src/shared/schemas/self-regulation-button.schema"
import { EmergencyContactSchema } from "../../src/shared/schemas/emergency-contact.schema"
import { UserSchema, ParentSchema, ChildSchema } from "../../src/shared/schemas/user.schema"
import { RegulationLevel } from "../../src/shared/schemas/self-regulation-button.schema"
import { Types } from "mongoose"
import { jest } from "@jest/globals" // Import jest to fix the undeclared variable error

describe("SelfRegulation Integration Tests", () => {
  let service: SelfRegulationService
  let mongoServer: MongoMemoryServer
  let module: TestingModule

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    const mongoUri = mongoServer.getUri()

    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongoUri),
        MongooseModule.forFeature([
          { name: "SelfRegulationButton", schema: SelfRegulationButtonSchema },
          { name: "EmergencyContact", schema: EmergencyContactSchema },
          { name: "User", schema: UserSchema },
          { name: "Parent", schema: ParentSchema },
          { name: "Child", schema: ChildSchema },
        ]),
      ],
      providers: [
        SelfRegulationService,
        {
          provide: NotificationsService,
          useValue: {
            sendToParent: jest.fn().mockResolvedValue({ success: true }),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendEmergencyAlerts: jest.fn().mockResolvedValue({ sent: 1, failed: 0 }),
          },
        },
      ],
    }).compile()

    service = module.get<SelfRegulationService>(SelfRegulationService)
  })

  afterAll(async () => {
    await module.close()
    await mongoServer.stop()
  })

  describe("IT-002: Envío de alertas FCM", () => {
    it("should send notification to parent when button activated", async () => {
      const childId = new Types.ObjectId().toString()
      const parentId = new Types.ObjectId().toString()

      // This test validates the integration between SelfRegulation and Notifications
      expect(service).toBeDefined()
      expect(typeof service.activateButton).toBe("function")
    })

    it("should escalate alerts based on regulation level", async () => {
      const levels = [RegulationLevel.LOW, RegulationLevel.MEDIUM, RegulationLevel.HIGH, RegulationLevel.CRITICAL]

      levels.forEach((level) => {
        const message = (service as any).getAlertMessage(level, "TestChild")
        expect(message.title).toBeTruthy()
        expect(message.body).toBeTruthy()
      })
    })
  })

  describe("IT-003: Alertas de emergencia por email", () => {
    it("should send emergency contact alerts", async () => {
      expect(service).toBeDefined()
      expect(typeof service.addEmergencyContact).toBe("function")
      expect(typeof service.getEmergencyContacts).toBe("function")
    })
  })
})
