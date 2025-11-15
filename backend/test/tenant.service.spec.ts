import { Test, TestingModule } from "@nestjs/testing";
import { TenantService } from "../src/modules/tenant/tenant.service";
import { PrismaService } from "../src/prisma/prisma.service";
import { Prisma } from "@prisma/client";
import { TenantNotFoundException } from "../src/common/errors/not-found.exception";
import {
  TenantEmailConflictException,
  TenantPhoneConflictException,
} from "../src/common/errors/conflict.exception";

describe("TenantService - Key Branches", () => {
  let service: TenantService;
  let prisma: PrismaService;

  const mockPrismaService = {
    tenant: {
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
        TenantService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe("create - conflict branches", () => {
    const createDto = {
      organizationId: "org-1",
      fullName: "Test Tenant",
      email: "test@example.com",
      phone: "+1234567890",
      isActive: true,
    };

    it("should throw TenantEmailConflictException on duplicate email", async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue({
        id: "org-1",
      });

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
          code: "P2002",
          clientVersion: "5.0.0",
          meta: { target: ["email"] },
        },
      );
      mockPrismaService.tenant.create.mockRejectedValue(prismaError);

      await expect(service.create(createDto)).rejects.toThrow(
        TenantEmailConflictException,
      );
    });

    it("should throw TenantPhoneConflictException on duplicate phone", async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue({
        id: "org-1",
      });

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
          code: "P2002",
          clientVersion: "5.0.0",
          meta: { target: ["phone"] },
        },
      );
      mockPrismaService.tenant.create.mockRejectedValue(prismaError);

      await expect(service.create(createDto)).rejects.toThrow(
        TenantPhoneConflictException,
      );
    });

    it("should rethrow other Prisma errors", async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue({
        id: "org-1",
      });

      const genericError = new Error("Database error");
      mockPrismaService.tenant.create.mockRejectedValue(genericError);

      await expect(service.create(createDto)).rejects.toThrow("Database error");
    });
  });

  describe("findMany - filtering branches", () => {
    const listQuery = {
      page: 1,
      pageSize: 10,
      sort: "fullName",
      order: "asc" as const,
      raw: {},
    };
    const organizationId = "org-1";

    it("should filter by keyword", async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany(listQuery, { organizationId, keyword: "test" });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should filter by isActive=true", async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany(listQuery, { organizationId, isActive: true });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should filter by isActive=false", async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany(listQuery, { organizationId, isActive: false });

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

  describe("update - conflict branches", () => {
    const tenantId = "tenant-1";
    const organizationId = "org-1";
    const updateDto = {
      fullName: "Updated Name",
      email: "updated@example.com",
    };

    it("should throw TenantEmailConflictException on duplicate email during update", async () => {
      const existingTenant = {
        id: tenantId,
        organizationId,
        fullName: "Old Name",
        email: "old@example.com",
      };

      mockPrismaService.tenant.findFirst.mockResolvedValue(existingTenant);

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
          code: "P2002",
          clientVersion: "5.0.0",
          meta: { target: ["email"] },
        },
      );
      mockPrismaService.tenant.update.mockRejectedValue(prismaError);

      await expect(
        service.update(tenantId, organizationId, updateDto),
      ).rejects.toThrow(TenantEmailConflictException);
    });

    it("should throw TenantPhoneConflictException on duplicate phone during update", async () => {
      const existingTenant = {
        id: tenantId,
        organizationId,
        fullName: "Old Name",
        phone: "+1111111111",
      };

      mockPrismaService.tenant.findFirst.mockResolvedValue(existingTenant);

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
          code: "P2002",
          clientVersion: "5.0.0",
          meta: { target: ["phone"] },
        },
      );
      mockPrismaService.tenant.update.mockRejectedValue(prismaError);

      await expect(
        service.update(tenantId, organizationId, { phone: "+2222222222" }),
      ).rejects.toThrow(TenantPhoneConflictException);
    });

    it("should throw TenantNotFoundException on P2025 error", async () => {
      const existingTenant = {
        id: tenantId,
        organizationId,
        fullName: "Old Name",
      };

      mockPrismaService.tenant.findFirst.mockResolvedValue(existingTenant);

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Record not found",
        {
          code: "P2025",
          clientVersion: "5.0.0",
        },
      );
      mockPrismaService.tenant.update.mockRejectedValue(prismaError);

      await expect(
        service.update(tenantId, organizationId, updateDto),
      ).rejects.toThrow(TenantNotFoundException);
    });
  });

  describe("remove", () => {
    it("should throw TenantNotFoundException if not found", async () => {
      mockPrismaService.tenant.findFirst.mockResolvedValue(null);

      await expect(service.remove("tenant-1", "org-1")).rejects.toThrow(
        TenantNotFoundException,
      );
    });
  });
});
