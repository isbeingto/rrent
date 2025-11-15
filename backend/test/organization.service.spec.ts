import { Test, TestingModule } from "@nestjs/testing";
import { OrganizationService } from "../src/modules/organization/organization.service";
import { PrismaService } from "../src/prisma/prisma.service";
import { Prisma } from "@prisma/client";
import { OrganizationNotFoundException } from "../src/common/errors/not-found.exception";
import { OrganizationCodeConflictException } from "../src/common/errors/conflict.exception";

describe("OrganizationService", () => {
  let service: OrganizationService;
  let prisma: PrismaService;

  const mockPrismaService = {
    organization: {
      create: jest.fn(),
      findUnique: jest.fn(),
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
        OrganizationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<OrganizationService>(OrganizationService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe("create", () => {
    const createDto = {
      name: "Test Organization",
      code: "TESTORG",
      description: "Test description",
      timezone: "Asia/Tokyo",
    };

    it("should create organization successfully", async () => {
      const mockOrganization = {
        id: "org-1",
        ...createDto,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.organization.create.mockResolvedValue(mockOrganization);

      const result = await service.create(createDto);

      expect(result).toEqual(mockOrganization);
      expect(prisma.organization.create).toHaveBeenCalledWith({
        data: {
          name: createDto.name,
          code: createDto.code,
          description: createDto.description,
          timezone: createDto.timezone,
          isActive: true,
        },
      });
    });

    it("should use default timezone if not provided", async () => {
      const dtoWithoutTimezone = {
        name: "Test Org",
        code: "TEST",
        description: "Test",
      };
      const mockOrganization = {
        id: "org-1",
        ...dtoWithoutTimezone,
        timezone: "Asia/Shanghai",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.organization.create.mockResolvedValue(mockOrganization);

      await service.create(dtoWithoutTimezone);

      expect(prisma.organization.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          timezone: "Asia/Shanghai",
        }),
      });
    });

    it("should throw OrganizationCodeConflictException on duplicate code", async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
          code: "P2002",
          clientVersion: "5.0.0",
        },
      );
      mockPrismaService.organization.create.mockRejectedValue(prismaError);

      await expect(service.create(createDto)).rejects.toThrow(
        OrganizationCodeConflictException,
      );
    });

    it("should rethrow other errors", async () => {
      const genericError = new Error("Database error");
      mockPrismaService.organization.create.mockRejectedValue(genericError);

      await expect(service.create(createDto)).rejects.toThrow("Database error");
    });
  });

  describe("findById", () => {
    const orgId = "org-1";

    it("should find organization by id successfully", async () => {
      const mockOrganization = {
        id: orgId,
        name: "Test Org",
        code: "TEST",
        description: "Test",
        timezone: "Asia/Shanghai",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.organization.findUnique.mockResolvedValue(
        mockOrganization,
      );

      const result = await service.findById(orgId);

      expect(result).toEqual(mockOrganization);
      expect(prisma.organization.findUnique).toHaveBeenCalledWith({
        where: { id: orgId },
      });
    });

    it("should throw OrganizationNotFoundException if not found", async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      await expect(service.findById(orgId)).rejects.toThrow(
        OrganizationNotFoundException,
      );
    });
  });

  describe("findMany", () => {
    const listQuery = {
      page: 1,
      pageSize: 10,
      sort: "name",
      order: "asc" as const,
      raw: {},
    };

    it("should return paginated organizations", async () => {
      const mockOrganizations = [
        {
          id: "org-1",
          name: "Org 1",
          code: "ORG1",
          description: null,
          timezone: "Asia/Shanghai",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const total = 1;

      mockPrismaService.$transaction.mockResolvedValue([
        mockOrganizations,
        total,
      ]);

      const result = await service.findMany(listQuery, {});

      expect(result).toEqual({
        items: mockOrganizations,
        meta: {
          total,
          page: 1,
          limit: 10,
          pageCount: 1,
        },
      });
    });

    it("should filter by keyword", async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany(listQuery, { keyword: "test" });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should filter by dateStart", async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany(listQuery, { dateStart: "2024-01-01" });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should filter by dateEnd", async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany(listQuery, { dateEnd: "2024-12-31" });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should filter by both dateStart and dateEnd", async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany(listQuery, {
        dateStart: "2024-01-01",
        dateEnd: "2024-12-31",
      });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should use default sort order when sort not provided", async () => {
      const queryWithoutSort = { page: 1, pageSize: 10, raw: {} };
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany(queryWithoutSort, {});

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe("update", () => {
    const orgId = "org-1";
    const updateDto = {
      name: "Updated Org",
      description: "Updated description",
      timezone: "America/New_York",
    };

    it("should update organization successfully", async () => {
      const existingOrg = {
        id: orgId,
        name: "Old Org",
        code: "OLD",
        description: "Old",
        timezone: "Asia/Shanghai",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedOrg = { ...existingOrg, ...updateDto };

      mockPrismaService.organization.findUnique.mockResolvedValue(existingOrg);
      mockPrismaService.organization.update.mockResolvedValue(updatedOrg);

      const result = await service.update(orgId, updateDto);

      expect(result).toEqual(updatedOrg);
      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: orgId },
        data: {
          name: updateDto.name,
          description: updateDto.description,
          timezone: updateDto.timezone,
        },
      });
    });

    it("should throw OrganizationNotFoundException if not found before update", async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      await expect(service.update(orgId, updateDto)).rejects.toThrow(
        OrganizationNotFoundException,
      );
    });

    it("should throw OrganizationNotFoundException on P2025 error", async () => {
      const existingOrg = {
        id: orgId,
        name: "Old Org",
        code: "OLD",
        description: "Old",
        timezone: "Asia/Shanghai",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.organization.findUnique.mockResolvedValue(existingOrg);

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Record not found",
        {
          code: "P2025",
          clientVersion: "5.0.0",
        },
      );
      mockPrismaService.organization.update.mockRejectedValue(prismaError);

      await expect(service.update(orgId, updateDto)).rejects.toThrow(
        OrganizationNotFoundException,
      );
    });

    it("should rethrow other errors", async () => {
      const existingOrg = {
        id: orgId,
        name: "Old Org",
        code: "OLD",
        description: "Old",
        timezone: "Asia/Shanghai",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.organization.findUnique.mockResolvedValue(existingOrg);

      const genericError = new Error("Database error");
      mockPrismaService.organization.update.mockRejectedValue(genericError);

      await expect(service.update(orgId, updateDto)).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("remove", () => {
    const orgId = "org-1";

    it("should delete organization successfully", async () => {
      const existingOrg = {
        id: orgId,
        name: "Test Org",
        code: "TEST",
        description: "Test",
        timezone: "Asia/Shanghai",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.organization.findUnique.mockResolvedValue(existingOrg);
      mockPrismaService.organization.delete.mockResolvedValue(existingOrg);

      await service.remove(orgId);

      expect(prisma.organization.delete).toHaveBeenCalledWith({
        where: { id: orgId },
      });
    });

    it("should throw OrganizationNotFoundException if not found", async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      await expect(service.remove(orgId)).rejects.toThrow(
        OrganizationNotFoundException,
      );
    });
  });
});
