import { Test, type TestingModule } from "@nestjs/testing"
import { SelfRegulationController } from "./self-regulation.controller"
import { SelfRegulationService } from "./self-regulation.service"
import { RegulationLevel } from "../shared/schemas/self-regulation-button.schema"
import { UserRole } from "../shared/schemas/user.schema"
import { jest } from "@jest/globals"

describe("SelfRegulationController - Functional Tests", () => {
  let controller: SelfRegulationController
  let mockSelfRegulationService: any

  beforeEach(async () => {
    mockSelfRegulationService = {
      activateButton: jest.fn().mockResolvedValue({
        _id: "event1",
        childId: "child1",
        level: RegulationLevel.CRITICAL,
        timestamp: new Date(),
      }),
      resolveEvent: jest.fn().mockResolvedValue({
        _id: "event1",
        resolved: true,
        resolvedAt: new Date(),
      }),
      getButtonHistory: jest.fn().mockResolvedValue([]),
      addEmergencyContact: jest.fn().mockResolvedValue({ _id: "contact1" }),
      getEmergencyContacts: jest.fn().mockResolvedValue([]),
      updateEmergencyContact: jest.fn().mockResolvedValue({}),
      deleteEmergencyContact: jest.fn().mockResolvedValue({}),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SelfRegulationController],
      providers: [
        {
          provide: SelfRegulationService,
          useValue: mockSelfRegulationService,
        },
      ],
    }).compile()

    controller = module.get<SelfRegulationController>(SelfRegulationController)
  })

  describe("FT-003: Activar botón CRÍTICO", () => {
    it("should activate critical level button as child", async () => {
      const req = {
        user: { userId: "child1", role: UserRole.CHILD },
      }
      const activateDto = {
        level: RegulationLevel.CRITICAL,
        emotion: "anxiety",
      }

      const result = await controller.activateButton(activateDto, req)

      expect(result.level).toBe(RegulationLevel.CRITICAL)
      expect(mockSelfRegulationService.activateButton).toHaveBeenCalled()
    })

    it("should reject non-child users from activating button", async () => {
      const req = {
        user: { userId: "parent1", role: UserRole.PARENT },
      }
      const activateDto = {
        level: RegulationLevel.CRITICAL,
      }

      expect(async () => {
        await controller.activateButton(activateDto, req)
      }).rejects.toThrow()
    })
  })

  describe("FT-004: Resolver evento", () => {
    it("should resolve event as parent", async () => {
      const req = {
        user: { userId: "parent1", role: UserRole.PARENT },
      }
      const resolveDto = {
        resolvedBy: "parent1",
        notes: "Crisis resolved",
      }

      const result = await controller.resolveEvent("event1", resolveDto, req)

      expect(result.resolved).toBe(true)
      expect(mockSelfRegulationService.resolveEvent).toHaveBeenCalledWith("event1", "parent1", "Crisis resolved")
    })

    it("should reject non-parent users from resolving", async () => {
      const req = {
        user: { userId: "child1", role: UserRole.CHILD },
      }
      const resolveDto = {
        resolvedBy: "child1",
      }

      expect(async () => {
        await controller.resolveEvent("event1", resolveDto, req)
      }).rejects.toThrow()
    })
  })

  describe("Emergency Contacts Management", () => {
    it("should add emergency contact as parent", async () => {
      const req = {
        user: { userId: "parent1", role: UserRole.PARENT },
      }
      const contactDto = {
        name: "School Counselor",
        phone: "+1234567890",
        email: "counselor@school.com",
        relationship: "Professional",
      }

      const result = await controller.addEmergencyContact(contactDto, req)

      expect(result._id).toBe("contact1")
      expect(mockSelfRegulationService.addEmergencyContact).toHaveBeenCalled()
    })

    it("should get emergency contacts as parent", async () => {
      const req = {
        user: { userId: "parent1", role: UserRole.PARENT },
      }

      const result = await controller.getEmergencyContacts(req)

      expect(Array.isArray(result)).toBe(true)
      expect(mockSelfRegulationService.getEmergencyContacts).toHaveBeenCalledWith("parent1")
    })

    it("should reject non-parent from adding contacts", async () => {
      const req = {
        user: { userId: "child1", role: UserRole.CHILD },
      }
      const contactDto = {
        name: "Contact",
        phone: "123",
        email: "test@test.com",
        relationship: "Friend",
      }

      expect(async () => {
        await controller.addEmergencyContact(contactDto, req)
      }).rejects.toThrow()
    })
  })

  describe("History Access Control", () => {
    it("should get child history as parent", async () => {
      const req = {
        user: { userId: "parent1", role: UserRole.PARENT },
      }

      await controller.getButtonHistory("child1", 30, req)

      expect(mockSelfRegulationService.getButtonHistory).toHaveBeenCalledWith("child1", 30)
    })

    it("should get own history as child", async () => {
      const req = {
        user: { userId: "child1", role: UserRole.CHILD },
      }

      await controller.getMyButtonHistory(30, req)

      expect(mockSelfRegulationService.getButtonHistory).toHaveBeenCalledWith("child1", 30)
    })
  })
})
