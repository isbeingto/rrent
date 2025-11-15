import { Test, TestingModule } from "@nestjs/testing";
import { PropertyService } from "../src/modules/property/property.service";
import { PrismaService } from "../src/prisma/prisma.service";
import { Prisma } from "@prisma/client";
import { PropertyNotFoundException } from "../src/common/errors/not-found.exception";
import { PropertyCodeConflictException } from "../src/common/errors/conflict.exception";

describe("PropertyService - Key Branches", () => {
  let service: PropertyService;
  let prisma: PrismaService;

  const mockPrismaService = {
    property: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PropertyService>(PropertyService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe("create - conflict branches", () => {
    const createDto = {
      organizationId: "org-1",
      name: "Test Property",
      code: "PROP-001",
      address: "123 Main St",
    };

    it("should throw PropertyCodeConflictException on duplicate code", async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue({
        id: "org-1",
      });

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
          code: "P2002",
          clientVersion: "5.0.0",
          meta: { target: ["organizationId", "code"] },
        },
      );
      mockPrismaService.property.create.mockRejectedValue(prismaError);

      await expect(service.create(createDto)).rejects.toThrow(
        PropertyCodeConflictException,
      );
    });

    it("should rethrow other Prisma errors", async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue({
        id: "org-1",
      });

      const genericError = new Error("Database error");
      mockPrismaService.property.create.mockRejectedValue(genericError);

      await expect(service.create(createDto)).rejects.toThrow("Database error");
    });
  });

  describe("findMany - filtering branches", () => {
    const listQuery = {
      page: 1,
      pageSize: 10,
      sort: "name",
      order: "asc" as const,
      raw: {},
    };
    const organizationId = "org-1";

    it("should filter by keyword", async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany(listQuery, { organizationId, keyword: "test" });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should filter by city", async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany(listQuery, { organizationId, city: "Beijing" });

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

    it("should use default sort when sort not provided", async () => {
      const queryWithoutSort = { page: 1, pageSize: 10, raw: {} };
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany(queryWithoutSort, { organizationId });

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe("update - conflict branches", () => {
    const propertyId = "property-1";
    const organizationId = "org-1";
    const updateDto = {
      name: "Updated Property",
      code: "PROP-002",
    };

    it("should throw PropertyCodeConflictException on duplicate code during update", async () => {
      const existingProperty = {
        id: propertyId,
        organizationId,
        name: "Old Property",
        code: "PROP-001",
      };

      mockPrismaService.property.findFirst.mockResolvedValue(existingProperty);

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
          code: "P2002",
          clientVersion: "5.0.0",
          meta: { target: ["organizationId", "code"] },
        },
      );
      mockPrismaService.property.update.mockRejectedValue(prismaError);

      await expect(
        service.update(propertyId, organizationId, updateDto),
      ).rejects.toThrow(PropertyCodeConflictException);
    });

    it("should throw PropertyNotFoundException on P2025 error", async () => {
      const existingProperty = {
        id: propertyId,
        organizationId,
        name: "Old Property",
      };

      mockPrismaService.property.findFirst.mockResolvedValue(existingProperty);

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Record not found",
        {
          code: "P2025",
          clientVersion: "5.0.0",
        },
      );
      mockPrismaService.property.update.mockRejectedValue(prismaError);

      await expect(
        service.update(propertyId, organizationId, updateDto),
      ).rejects.toThrow(PropertyNotFoundException);
    });
  });

  describe("remove", () => {
    it("should throw PropertyNotFoundException if not found", async () => {
      mockPrismaService.property.findFirst.mockResolvedValue(null);

      await expect(service.remove("property-1", "org-1")).rejects.toThrow(
        PropertyNotFoundException,
      );
    });
  });
});
