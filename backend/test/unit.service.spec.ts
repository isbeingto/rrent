import { Test, TestingModule } from "@nestjs/testing";
import { UnitService } from "../src/modules/unit/unit.service";
import { PrismaService } from "../src/prisma/prisma.service";
import { UnitStatus, Prisma } from "@prisma/client";
import {
  PropertyNotFoundException,
  UnitNotFoundException,
} from "../src/common/errors/not-found.exception";
import { UnitNumberConflictException } from "../src/common/errors/conflict.exception";

describe("UnitService", () => {
  let service: UnitService;
  let prisma: PrismaService;

  const mockPrismaService = {
    property: {
      findFirst: jest.fn(),
    },
    unit: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnitService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UnitService>(UnitService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe("create", () => {
    const createDto = {
      propertyId: "prop-1",
      unitNumber: "101",
      name: "Unit 101",
      floor: 1,
      bedrooms: 2,
      bathrooms: 1,
      areaSqm: 50,
      status: UnitStatus.VACANT,
    };

    const organizationId = "org-1";

    it("should create a unit successfully", async () => {
      const mockProperty = { id: "prop-1", organizationId: "org-1" };
      const mockUnit = { id: "unit-1", ...createDto };

      mockPrismaService.property.findFirst.mockResolvedValue(mockProperty);
      mockPrismaService.unit.create.mockResolvedValue(mockUnit);

      const result = await service.create(createDto, organizationId);

      expect(result).toEqual(mockUnit);
      expect(prisma.property.findFirst).toHaveBeenCalledWith({
        where: { id: createDto.propertyId, organizationId },
      });
      expect(prisma.unit.create).toHaveBeenCalledWith({
        data: {
          propertyId: createDto.propertyId,
          name: createDto.name,
          unitNumber: createDto.unitNumber,
          floor: createDto.floor,
          bedrooms: createDto.bedrooms,
          bathrooms: createDto.bathrooms,
          areaSqm: createDto.areaSqm,
          status: UnitStatus.VACANT,
          isActive: true,
        },
      });
    });

    it("should throw PropertyNotFoundException if property not found", async () => {
      mockPrismaService.property.findFirst.mockResolvedValue(null);

      await expect(service.create(createDto, organizationId)).rejects.toThrow(
        PropertyNotFoundException,
      );
    });

    it("should throw UnitNumberConflictException on duplicate unitNumber", async () => {
      const mockProperty = { id: "prop-1", organizationId: "org-1" };
      mockPrismaService.property.findFirst.mockResolvedValue(mockProperty);

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
          code: "P2002",
          clientVersion: "5.0.0",
        },
      );
      mockPrismaService.unit.create.mockRejectedValue(prismaError);

      await expect(service.create(createDto, organizationId)).rejects.toThrow(
        UnitNumberConflictException,
      );
    });

    it("should rethrow other Prisma errors", async () => {
      const mockProperty = { id: "prop-1", organizationId: "org-1" };
      mockPrismaService.property.findFirst.mockResolvedValue(mockProperty);

      const genericError = new Error("Database error");
      mockPrismaService.unit.create.mockRejectedValue(genericError);

      await expect(service.create(createDto, organizationId)).rejects.toThrow(
        "Database error",
      );
    });

    it("should use default VACANT status if not provided", async () => {
      const mockProperty = { id: "prop-1", organizationId: "org-1" };
      const dtoWithoutStatus = { ...createDto, status: undefined };
      const mockUnit = {
        id: "unit-1",
        ...dtoWithoutStatus,
        status: UnitStatus.VACANT,
      };

      mockPrismaService.property.findFirst.mockResolvedValue(mockProperty);
      mockPrismaService.unit.create.mockResolvedValue(mockUnit);

      await service.create(dtoWithoutStatus, organizationId);

      expect(prisma.unit.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: UnitStatus.VACANT,
        }),
      });
    });
  });

  describe("findById", () => {
    const unitId = "unit-1";
    const organizationId = "org-1";

    it("should find unit by id successfully", async () => {
      const mockUnit = {
        id: unitId,
        unitNumber: "101",
        property: { id: "prop-1", organizationId },
      };

      mockPrismaService.unit.findFirst.mockResolvedValue(mockUnit);

      const result = await service.findById(unitId, organizationId);

      expect(result).toEqual(mockUnit);
      expect(prisma.unit.findFirst).toHaveBeenCalledWith({
        where: {
          id: unitId,
          property: { organizationId },
        },
        include: { property: true },
      });
    });

    it("should throw UnitNotFoundException if unit not found", async () => {
      mockPrismaService.unit.findFirst.mockResolvedValue(null);

      await expect(service.findById(unitId, organizationId)).rejects.toThrow(
        UnitNotFoundException,
      );
    });
  });

  describe("findMany", () => {
    const organizationId = "org-1";
    const listQuery = {
      page: 1,
      pageSize: 10,
      sort: "unitNumber",
      order: "asc" as const,
      raw: {},
    };

    it("should return paginated units", async () => {
      const mockUnits = [{ id: "unit-1", unitNumber: "101" }];
      const total = 1;

      mockPrismaService.$transaction.mockResolvedValue([mockUnits, total]);

      const result = await service.findMany(listQuery, { organizationId });

      expect(result).toEqual({
        items: mockUnits,
        meta: {
          total,
          page: 1,
          limit: 10,
          pageCount: 1,
        },
      });
    });

    it("should filter by propertyId", async () => {
      const propertyId = "prop-1";
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany(listQuery, { organizationId, propertyId });

      expect(prisma.$transaction).toHaveBeenCalled();
      const transactionCalls = (prisma.$transaction as jest.Mock).mock
        .calls[0][0];
      expect(transactionCalls).toHaveLength(2);
    });

    it("should filter by status", async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany(listQuery, {
        organizationId,
        status: UnitStatus.OCCUPIED,
      });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should filter by keyword", async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany(listQuery, { organizationId, keyword: "101" });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should filter by dateStart", async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany(listQuery, {
        organizationId,
        dateStart: "2024-01-01",
      });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should filter by dateEnd", async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany(listQuery, {
        organizationId,
        dateEnd: "2024-12-31",
      });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should filter by both dateStart and dateEnd", async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany(listQuery, {
        organizationId,
        dateStart: "2024-01-01",
        dateEnd: "2024-12-31",
      });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should use default sort order when sort not provided", async () => {
      const queryWithoutSort = { page: 1, pageSize: 10, raw: {} };
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany(queryWithoutSort, { organizationId });

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe("update", () => {
    const unitId = "unit-1";
    const organizationId = "org-1";
    const updateDto = {
      name: "Updated Unit",
      unitNumber: "102",
      floor: 2,
      bedrooms: 3,
      bathrooms: 2,
      areaSqm: 75,
      status: UnitStatus.OCCUPIED,
    };

    it("should update unit successfully", async () => {
      const existingUnit = { id: unitId, unitNumber: "101", isActive: true };
      const updatedUnit = { ...existingUnit, ...updateDto };

      mockPrismaService.unit.findFirst.mockResolvedValue(existingUnit);
      mockPrismaService.unit.update.mockResolvedValue(updatedUnit);

      const result = await service.update(unitId, organizationId, updateDto);

      expect(result).toEqual(updatedUnit);
      expect(prisma.unit.update).toHaveBeenCalledWith({
        where: { id: unitId },
        data: updateDto,
      });
    });

    it("should throw UnitNotFoundException if unit not found during update", async () => {
      mockPrismaService.unit.findFirst.mockResolvedValue(null);

      await expect(
        service.update(unitId, organizationId, updateDto),
      ).rejects.toThrow(UnitNotFoundException);
    });

    it("should throw UnitNumberConflictException on duplicate unitNumber during update", async () => {
      const existingUnit = { id: unitId, unitNumber: "101", isActive: true };
      mockPrismaService.unit.findFirst.mockResolvedValue(existingUnit);

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
          code: "P2002",
          clientVersion: "5.0.0",
        },
      );
      mockPrismaService.unit.update.mockRejectedValue(prismaError);

      await expect(
        service.update(unitId, organizationId, updateDto),
      ).rejects.toThrow(UnitNumberConflictException);
    });

    it("should throw UnitNotFoundException on P2025 error during update", async () => {
      const existingUnit = { id: unitId, unitNumber: "101", isActive: true };
      mockPrismaService.unit.findFirst.mockResolvedValue(existingUnit);

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Record not found",
        {
          code: "P2025",
          clientVersion: "5.0.0",
        },
      );
      mockPrismaService.unit.update.mockRejectedValue(prismaError);

      await expect(
        service.update(unitId, organizationId, updateDto),
      ).rejects.toThrow(UnitNotFoundException);
    });

    it("should rethrow other errors during update", async () => {
      const existingUnit = { id: unitId, unitNumber: "101", isActive: true };
      mockPrismaService.unit.findFirst.mockResolvedValue(existingUnit);

      const genericError = new Error("Database error");
      mockPrismaService.unit.update.mockRejectedValue(genericError);

      await expect(
        service.update(unitId, organizationId, updateDto),
      ).rejects.toThrow("Database error");
    });
  });

  describe("remove", () => {
    const unitId = "unit-1";
    const organizationId = "org-1";

    it("should delete unit successfully", async () => {
      const existingUnit = { id: unitId, unitNumber: "101", isActive: true };

      mockPrismaService.unit.findFirst.mockResolvedValue(existingUnit);
      mockPrismaService.unit.delete.mockResolvedValue(existingUnit);

      await service.remove(unitId, organizationId);

      expect(prisma.unit.delete).toHaveBeenCalledWith({
        where: { id: unitId },
      });
    });

    it("should throw UnitNotFoundException if unit not found during delete", async () => {
      mockPrismaService.unit.findFirst.mockResolvedValue(null);

      await expect(service.remove(unitId, organizationId)).rejects.toThrow(
        UnitNotFoundException,
      );
    });
  });

  describe("findActiveById", () => {
    const unitId = "unit-1";
    const organizationId = "org-1";

    it("should find active unit successfully", async () => {
      const mockUnit = {
        id: unitId,
        unitNumber: "101",
        isActive: true,
        property: { id: "prop-1", organizationId },
      };

      mockPrismaService.unit.findFirst.mockResolvedValue(mockUnit);

      const result = await service.findActiveById(unitId, organizationId);

      expect(result).toEqual(mockUnit);
    });

    it("should throw UnitNotFoundException if unit is inactive", async () => {
      const mockUnit = {
        id: unitId,
        unitNumber: "101",
        isActive: false,
        property: { id: "prop-1", organizationId },
      };

      mockPrismaService.unit.findFirst.mockResolvedValue(mockUnit);

      await expect(
        service.findActiveById(unitId, organizationId),
      ).rejects.toThrow(UnitNotFoundException);
    });

    it("should throw UnitNotFoundException if unit not found", async () => {
      mockPrismaService.unit.findFirst.mockResolvedValue(null);

      await expect(
        service.findActiveById(unitId, organizationId),
      ).rejects.toThrow(UnitNotFoundException);
    });
  });
});
