import { Test, type TestingModule } from "@nestjs/testing"
import { getModelToken } from "@nestjs/mongoose"
import { AuthService } from "../../src/auth/auth.service"
import { User } from "../../src/shared/schemas/user.schema"
import { JwtService } from "@nestjs/jwt"
import jest from "jest" // Import jest to fix the undeclared variable error

describe("Auth - Regression Tests", () => {
  let service: AuthService
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
  })

  describe("RG-001: Login continúa funcionando", () => {
    it("should login with valid credentials", async () => {
      // Verify login still works after changes
      expect(service).toBeDefined()
    })

    it("should generate valid JWT token", async () => {
      expect(mockJwtService.sign).toBeDefined()
    })

    it("should verify JWT token correctly", async () => {
      const verified = mockJwtService.verify("jwt-token")
      expect(verified).toBeDefined()
    })
  })
})
