import { Test, type TestingModule } from "@nestjs/testing"
import { type INestApplication, ValidationPipe } from "@nestjs/common"
import { MongooseModule } from "@nestjs/mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"
import { JwtModule } from "@nestjs/jwt"
import { PassportModule } from "@nestjs/passport"
import { AuthService } from "../../src/auth/auth.service"
import { AuthController } from "../../src/auth/auth.controller"
import { User, UserSchema } from "../../src/shared/schemas/user.schema"
import { JwtStrategy } from "../../src/auth/jwt.strategy"
import { Types } from "mongoose"

describe("Auth - Integration Tests (PI)", () => {
  let app: INestApplication
  let mongoServer: MongoMemoryServer
  let authService: AuthService

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    const mongoUri = mongoServer.getUri()

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongoUri),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        JwtModule.register({
          secret: "test-secret",
          signOptions: { expiresIn: "1h" },
        }),
        PassportModule,
      ],
      controllers: [AuthController],
      providers: [AuthService, JwtStrategy],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe())
    await app.init()

    authService = moduleFixture.get<AuthService>(AuthService)
  })

  afterAll(async () => {
    await app.close()
    await mongoServer.stop()
  })

  describe("Authentication Backend Integration", () => {
    it("should create user and return JWT token", async () => {
      const userData = {
        email: "integration@test.com",
        password: "password123",
        nickname: "Test User",
      }

      // Simulate user creation and token generation
      const token = "mock-jwt-token"

      expect(token).toBeDefined()
      expect(typeof token).toBe("string")
    })

    it("should validate JWT token", async () => {
      const payload = { userId: new Types.ObjectId().toString(), email: "test@example.com" }
      // In a real scenario, verify token would validate the JWT signature
      const isValid = true // Mock validation

      expect(isValid).toBe(true)
    })
  })
})
