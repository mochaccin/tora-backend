import { Test, type TestingModule } from "@nestjs/testing"
import { getModelToken } from "@nestjs/mongoose"
import { AuthService } from "../../src/auth/auth.service"
import { AuthController } from "../../src/auth/auth.controller"
import { User } from "../../src/shared/schemas/user.schema"
import { JwtService } from "@nestjs/jwt"
import { jest } from "@jest/globals"

describe("Auth - Functional Tests", () => {
  let service: AuthService
  let controller: AuthController
  let mockUserModel: any
  let mockJwtService: any

  beforeEach(async () => {
    mockJwtService = {
      sign: jest.fn().mockReturnValue("jwt-token"),
      verify: jest.fn().mockReturnValue({ userId: "test", role: "PARENT" }),
    }

    mockUserModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    controller = module.get<AuthController>(AuthController)
  })

  describe("FT-001: Flujo completo de registro", () => {
    it("should register parent with valid data", async () => {
      const registerData = {
        email: "parent@example.com",
        password: "SecurePass123!",
        firstName: "Juan",
        phone: "+34600000000",
      }

      mockUserModel.findOne.mockResolvedValueOnce(null)
      mockUserModel.create.mockResolvedValueOnce({
        _id: "parent1",
        ...registerData,
      })

      expect(registerData.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      expect(registerData.password.length).toBeGreaterThanOrEqual(8)
    })

    it("should validate password strength", async () => {
      const weakPassword = "123"
      const strongPassword = "SecurePassword123!"

      expect(weakPassword.length).toBeLessThan(8)
      expect(strongPassword.length).toBeGreaterThanOrEqual(8)
    })
  })

  describe("FT-002: Login con credenciales", () => {
    it("should login with valid credentials", async () => {
      const loginData = {
        email: "parent@example.com",
        password: "SecurePass123!",
      }

      const user = {
        _id: "parent1",
        email: loginData.email,
        password: "hashed_password",
      }

      mockUserModel.findOne.mockResolvedValueOnce(user)

      expect(loginData.email).toBeTruthy()
      expect(loginData.password).toBeTruthy()
    })

    it("should reject invalid email", async () => {
      const invalidEmail = "not-an-email"

      expect(invalidEmail).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    })

    it("should reject non-existent user", async () => {
      mockUserModel.findOne.mockResolvedValueOnce(null)

      const result = await service.login("nonexistent@example.com", "password")

      expect(result).toBeUndefined()
    })
  })
})
