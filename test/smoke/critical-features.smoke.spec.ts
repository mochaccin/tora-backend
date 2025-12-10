import { Test, type TestingModule } from "@nestjs/testing"
import { getModelToken } from "@nestjs/mongoose"
import { JwtService } from "@nestjs/jwt"
import { AuthService } from "../../src/auth/auth.service"
import { SelfRegulationService } from "../../src/self-regulation/self-regulation.service"
import { DashboardService } from "../../src/dashboard/dashboard.service"
import { User, Parent, Child } from "../../src/shared/schemas/user.schema"
import { SelfRegulationButton, RegulationLevel } from "../../src/shared/schemas/self-regulation-button.schema"
import { EmergencyContact } from "../../src/shared/schemas/emergency-contact.schema"
import { NotificationsService } from "../../src/notifications/notifications.service"
import { EmailService } from "../../src/email/email.service"
import { jest } from "@jest/globals" // Import jest to fix the undeclared variable error

describe("Smoke Tests - Critical Features", () => {
  let authService: AuthService
  let selfRegService: SelfRegulationService
  let dashboardService: DashboardService

  beforeEach(async () => {
    const mockModels = {
      [getModelToken(User.name)]: { findOne: jest.fn() },
      [getModelToken(Parent.name)]: { findOne: jest.fn(), findById: jest.fn() },
      [getModelToken(Child.name)]: { findOne: jest.fn(), findById: jest.fn() },
      [getModelToken(SelfRegulationButton.name)]: { findById: jest.fn(), find: jest.fn() },
      [getModelToken(EmergencyContact.name)]: { find: jest.fn() },
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        SelfRegulationService,
        DashboardService,
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue("token") } },
        { provide: NotificationsService, useValue: { sendToParent: jest.fn() } },
        { provide: EmailService, useValue: { sendEmergencyAlerts: jest.fn() } },
        ...Object.entries(mockModels).map(([key, value]) => ({
          provide: key,
          useValue: value,
        })),
      ],
    }).compile()

    authService = module.get<AuthService>(AuthService)
    selfRegService = module.get<SelfRegulationService>(SelfRegulationService)
    dashboardService = module.get<DashboardService>(DashboardService)
  })

  describe("SM-001: Login funciona", () => {
    it("should verify AuthService is instantiated", () => {
      expect(authService).toBeDefined()
    })

    it("should have login method available", () => {
      expect(typeof authService.login).toBe("function")
    })
  })

  describe("SM-003: Botón autorregulación accesible", () => {
    it("should verify SelfRegulationService is instantiated", () => {
      expect(selfRegService).toBeDefined()
    })

    it("should have activateButton method available", () => {
      expect(typeof selfRegService.activateButton).toBe("function")
    })

    it("should have all regulation levels defined", () => {
      expect(RegulationLevel.LOW).toBe("LOW")
      expect(RegulationLevel.MEDIUM).toBe("MEDIUM")
      expect(RegulationLevel.HIGH).toBe("HIGH")
      expect(RegulationLevel.CRITICAL).toBe("CRITICAL")
    })
  })

  describe("SM-002: Dashboard carga", () => {
    it("should verify DashboardService is instantiated", () => {
      expect(dashboardService).toBeDefined()
    })

    it("should have getParentDashboard method available", () => {
      expect(typeof dashboardService.getParentDashboard).toBe("function")
    })
  })
})
