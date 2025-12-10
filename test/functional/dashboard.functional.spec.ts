import { Test, type TestingModule } from "@nestjs/testing"
import { getModelToken } from "@nestjs/mongoose"
import { DashboardService } from "../../src/dashboard/dashboard.service"
import { Calendar } from "../../src/shared/schemas/calendar.schema"
import { SelfRegulationButton } from "../../src/shared/schemas/self-regulation-button.schema"
import { Types } from "mongoose"
import jest from "jest" // Declare the jest variable

describe("Dashboard - Functional Tests", () => {
  let service: DashboardService
  let mockCalendarModel: any
  let mockRegulationModel: any

  const mockChildId = new Types.ObjectId()
  const mockParentId = new Types.ObjectId()

  const mockTasks = [
    {
      _id: new Types.ObjectId(),
      childId: mockChildId,
      title: "Math homework",
      completed: true,
      completedAt: new Date(),
    },
    {
      _id: new Types.ObjectId(),
      childId: mockChildId,
      title: "Read a book",
      completed: false,
    },
  ]

  beforeEach(async () => {
    mockCalendarModel = {
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          {
            childId: mockChildId,
            tasks: mockTasks,
          },
        ]),
      }),
      aggregate: jest.fn().mockReturnValue([
        { _id: "MORNING", count: 5 },
        { _id: "AFTERNOON", count: 3 },
      ]),
    }

    mockRegulationModel = {
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          {
            _id: new Types.ObjectId(),
            childId: mockChildId,
            level: "CRITICAL",
            timestamp: new Date(),
            resolved: false,
          },
        ]),
      }),
      countDocuments: jest.fn().mockResolvedValue(1),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: getModelToken(Calendar.name),
          useValue: mockCalendarModel,
        },
        {
          provide: getModelToken(SelfRegulationButton.name),
          useValue: mockRegulationModel,
        },
      ],
    }).compile()

    service = module.get<DashboardService>(DashboardService)
  })

  describe("FT-005: Mostrar alertas sin resolver", () => {
    it("should display unresolved alerts", async () => {
      const alerts = await service.getUnresolvedAlerts(mockChildId.toString())

      expect(alerts).toBeDefined()
      expect(mockRegulationModel.find).toHaveBeenCalled()
    })

    it("should filter by child ID", async () => {
      await service.getUnresolvedAlerts(mockChildId.toString())

      const findCall = mockRegulationModel.find.mock.calls[0][0]
      expect(findCall.childId).toEqual(mockChildId)
      expect(findCall.resolved).toBe(false)
    })
  })
})
