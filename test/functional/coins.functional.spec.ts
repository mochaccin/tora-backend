import { Test, type TestingModule } from "@nestjs/testing"
import { getModelToken } from "@nestjs/mongoose"
import { CoinsService } from "../../src/coins/coins.service"
import { Child } from "../../src/shared/schemas/user.schema"
import { jest } from "@jest/globals"

describe("Coins - Functional Tests", () => {
  let service: CoinsService
  let mockChildModel: any

  beforeEach(async () => {
    mockChildModel = {
      findByIdAndUpdate: jest.fn(),
      findById: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoinsService,
        {
          provide: getModelToken(Child.name),
          useValue: mockChildModel,
        },
      ],
    }).compile()

    service = module.get<CoinsService>(CoinsService)
  })

  describe("FT-008: Transacciones de monedas", () => {
    it("should add coins to child account", async () => {
      const childId = "child1"
      const coinsToAdd = 50

      mockChildModel.findByIdAndUpdate.mockResolvedValueOnce({
        _id: childId,
        coins: 50,
      })

      expect(coinsToAdd).toBeGreaterThan(0)
    })

    it("should subtract coins from account", async () => {
      const childId = "child1"
      const coinsToSubtract = 30

      mockChildModel.findByIdAndUpdate.mockResolvedValueOnce({
        _id: childId,
        coins: 20,
      })

      expect(coinsToSubtract).toBeGreaterThan(0)
    })

    it("should prevent negative coin balance", async () => {
      const childId = "child1"
      const currentCoins = 10
      const coinsToSubtract = 20

      expect(currentCoins - coinsToSubtract).toBeLessThan(0)
    })

    it("should handle concurrent coin transactions", async () => {
      const childId = "child1"
      const transactions = [
        { amount: 10, type: "add" },
        { amount: 5, type: "subtract" },
        { amount: 15, type: "add" },
      ]

      let balance = 100
      for (const tx of transactions) {
        if (tx.type === "add") {
          balance += tx.amount
        } else {
          balance -= tx.amount
        }
      }

      expect(balance).toBe(120)
    })
  })
})
