import { Test, TestingModule } from "@nestjs/testing";
import { LeaseService } from "../src/modules/lease/lease.service";
import { PrismaService } from "../src/prisma/prisma.service";
import { AuditLogService } from "../src/modules/audit-log/audit-log.service";
import { LeaseStatus } from "@prisma/client";
import { LeaseNotFoundException } from "../src/common/errors/not-found.exception";

describe("LeaseService - Key Branches", () => {
  let service: LeaseService;
  let prisma: PrismaService;

  const mockPrismaService = {
    lease: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    tenant: {
      findFirst: jest.fn(),
    },
    unit: {
      findFirst: jest.fn(),
    },
    property: {
      findFirst: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockAuditLogService = {
    createLeaseActivatedLog: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaseService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    service = module.get<LeaseService>(LeaseService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe("findMany - status filtering branches", () => {
    const listQuery = {
      page: 1,
      pageSize: 10,
      sort: "startDate",
      order: "desc" as const,
      raw: {},
    };
    const organizationId = "org-1";

    it("should filter by status=PENDING", async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany(listQuery, {
        organizationId,
        status: LeaseStatus.PENDING,
      });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should filter by status=ACTIVE", async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany(listQuery, {
        organizationId,
        status: LeaseStatus.ACTIVE,
      });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should filter by tenantId", async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany(listQuery, {
        organizationId,
        tenantId: "tenant-1",
      });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should filter by unitId", async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany(listQuery, {
        organizationId,
        unitId: "unit-1",
      });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should filter by propertyId", async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany(listQuery, {
        organizationId,
        propertyId: "property-1",
      });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should filter by dateStart only", async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany(listQuery, {
        organizationId,
        dateStart: "2024-01-01",
      });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should filter by dateEnd only", async () => {
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

    it("should use default sort when sort not provided", async () => {
      const queryWithoutSort = { page: 1, pageSize: 10, raw: {} };
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany(queryWithoutSort, { organizationId });

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe("findById", () => {
    it("should throw LeaseNotFoundException if lease not found", async () => {
      mockPrismaService.lease.findFirst.mockResolvedValue(null);

      await expect(service.findById("lease-1", "org-1")).rejects.toThrow(
        LeaseNotFoundException,
      );
    });
  });
});
