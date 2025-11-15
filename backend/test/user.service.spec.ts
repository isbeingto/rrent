import { Test, TestingModule } from "@nestjs/testing";
import { UserService } from "../src/modules/user/user.service";
import { PrismaService } from "../src/prisma/prisma.service";
import { BcryptPasswordHasher } from "../src/common/security/password-hasher";
import { OrgRole, Prisma } from "@prisma/client";
import {
  OrganizationNotFoundException,
  UserNotFoundException,
} from "../src/common/errors/not-found.exception";
import { UserEmailConflictException } from "../src/common/errors/conflict.exception";

describe("UserService", () => {
  let service: UserService;
  let prisma: PrismaService;
  let passwordHasher: BcryptPasswordHasher;

  const mockPrismaService = {
    organization: {
      findUnique: jest.fn(),
    },
    user: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockPasswordHasher = {
    hash: jest.fn(),
    compare: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: BcryptPasswordHasher,
          useValue: mockPasswordHasher,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
    passwordHasher = module.get<BcryptPasswordHasher>(BcryptPasswordHasher);

    jest.clearAllMocks();
  });

  describe("create", () => {
    const createDto = {
      organizationId: "org-1",
      email: "test@example.com",
      password: "Password123!",
      fullName: "Test User",
      role: OrgRole.STAFF,
      isActive: true,
    };

    it("should create user successfully", async () => {
      const mockOrganization = { id: "org-1", name: "Test Org" };
      const hashedPassword = "hashed_password";
      const mockUser = {
        id: "user-1",
        organizationId: "org-1",
        email: "test@example.com",
        passwordHash: hashedPassword,
        fullName: "Test User",
        role: OrgRole.STAFF,
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.organization.findUnique.mockResolvedValue(
        mockOrganization,
      );
      mockPasswordHasher.hash.mockResolvedValue(hashedPassword);
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.create(createDto);

      expect(prisma.organization.findUnique).toHaveBeenCalledWith({
        where: { id: createDto.organizationId },
      });
      expect(passwordHasher.hash).toHaveBeenCalledWith(createDto.password);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          organizationId: createDto.organizationId,
          email: createDto.email,
          passwordHash: hashedPassword,
          fullName: createDto.fullName,
          role: createDto.role,
          isActive: true,
        },
      });
      expect(result).not.toHaveProperty("passwordHash");
      expect(result.email).toBe(createDto.email);
    });

    it("should throw OrganizationNotFoundException if organization not found", async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        OrganizationNotFoundException,
      );
      expect(passwordHasher.hash).not.toHaveBeenCalled();
    });

    it("should throw UserEmailConflictException on duplicate email", async () => {
      const mockOrganization = { id: "org-1", name: "Test Org" };
      mockPrismaService.organization.findUnique.mockResolvedValue(
        mockOrganization,
      );
      mockPasswordHasher.hash.mockResolvedValue("hashed_password");

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
          code: "P2002",
          clientVersion: "5.0.0",
        },
      );
      mockPrismaService.user.create.mockRejectedValue(prismaError);

      await expect(service.create(createDto)).rejects.toThrow(
        UserEmailConflictException,
      );
    });

    it("should use default isActive=true if not provided", async () => {
      const dtoWithoutActive = { ...createDto, isActive: undefined };
      const mockOrganization = { id: "org-1", name: "Test Org" };
      const mockUser = {
        id: "user-1",
        organizationId: "org-1",
        email: "test@example.com",
        passwordHash: "hashed",
        fullName: "Test User",
        role: OrgRole.STAFF,
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.organization.findUnique.mockResolvedValue(
        mockOrganization,
      );
      mockPasswordHasher.hash.mockResolvedValue("hashed");
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      await service.create(dtoWithoutActive);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isActive: true,
        }),
      });
    });

    it("should rethrow other errors", async () => {
      const mockOrganization = { id: "org-1", name: "Test Org" };
      mockPrismaService.organization.findUnique.mockResolvedValue(
        mockOrganization,
      );
      mockPasswordHasher.hash.mockResolvedValue("hashed");

      const genericError = new Error("Database error");
      mockPrismaService.user.create.mockRejectedValue(genericError);

      await expect(service.create(createDto)).rejects.toThrow("Database error");
    });
  });

  describe("findById", () => {
    const userId = "user-1";
    const organizationId = "org-1";

    it("should find user by id successfully", async () => {
      const mockUser = {
        id: userId,
        organizationId,
        email: "test@example.com",
        passwordHash: "hashed",
        fullName: "Test User",
        role: OrgRole.STAFF,
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.findById(userId, organizationId);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: userId, organizationId },
      });
      expect(result).not.toHaveProperty("passwordHash");
      expect(result.id).toBe(userId);
    });

    it("should throw UserNotFoundException if user not found", async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.findById(userId, organizationId)).rejects.toThrow(
        UserNotFoundException,
      );
    });
  });

  describe("findByEmail", () => {
    const email = "test@example.com";
    const organizationId = "org-1";

    it("should find user by email successfully", async () => {
      const mockUser = {
        id: "user-1",
        organizationId,
        email,
        passwordHash: "hashed",
        fullName: "Test User",
        role: OrgRole.STAFF,
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.findByEmail(email, organizationId);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email, organizationId },
      });
      expect(result).toEqual(mockUser);
      expect(result?.passwordHash).toBe("hashed");
    });

    it("should return null if user not found", async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      const result = await service.findByEmail(email, organizationId);

      expect(result).toBeNull();
    });
  });

  describe("findMany", () => {
    const organizationId = "org-1";

    it("should return paginated users", async () => {
      const mockUsers = [
        {
          id: "user-1",
          organizationId,
          email: "test1@example.com",
          fullName: "User 1",
          role: OrgRole.STAFF,
          isActive: true,
          lastLoginAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const total = 1;

      mockPrismaService.$transaction.mockResolvedValue([mockUsers, total]);

      const result = await service.findMany({ organizationId });

      expect(result).toEqual({
        items: mockUsers,
        meta: {
          total,
          page: 1,
          limit: 20,
          pageCount: 1,
        },
      });
    });

    it("should filter by keyword", async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany({ organizationId, keyword: "test" });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should filter by role", async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany({ organizationId, role: OrgRole.OWNER });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should filter by isActive", async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany({ organizationId, isActive: true });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should handle pagination parameters", async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany({ organizationId, page: 2, limit: 10 });

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe("update", () => {
    const userId = "user-1";
    const organizationId = "org-1";
    const updateDto = {
      fullName: "Updated Name",
      role: OrgRole.OWNER,
      isActive: false,
    };

    it("should update user successfully", async () => {
      const existingUser = {
        id: userId,
        organizationId,
        email: "test@example.com",
        passwordHash: "hashed",
        fullName: "Old Name",
        role: OrgRole.STAFF,
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedUser = { ...existingUser, ...updateDto };

      mockPrismaService.user.findFirst.mockResolvedValue(existingUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update(userId, organizationId, updateDto);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          fullName: updateDto.fullName,
          role: updateDto.role,
          isActive: updateDto.isActive,
        },
      });
      expect(result).not.toHaveProperty("passwordHash");
      expect(result.fullName).toBe(updateDto.fullName);
    });

    it("should throw UserNotFoundException if user not found", async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.update(userId, organizationId, updateDto),
      ).rejects.toThrow(UserNotFoundException);
    });

    it("should handle P2002 error", async () => {
      const existingUser = {
        id: userId,
        organizationId,
        email: "test@example.com",
        passwordHash: "hashed",
        fullName: "Old Name",
        role: OrgRole.STAFF,
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findFirst.mockResolvedValue(existingUser);

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
          code: "P2002",
          clientVersion: "5.0.0",
          meta: { cause: "email already exists" },
        },
      );
      mockPrismaService.user.update.mockRejectedValue(prismaError);

      await expect(
        service.update(userId, organizationId, updateDto),
      ).rejects.toThrow(UserEmailConflictException);
    });

    it("should rethrow other errors", async () => {
      const existingUser = {
        id: userId,
        organizationId,
        email: "test@example.com",
        passwordHash: "hashed",
        fullName: "Old Name",
        role: OrgRole.STAFF,
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findFirst.mockResolvedValue(existingUser);

      const genericError = new Error("Database error");
      mockPrismaService.user.update.mockRejectedValue(genericError);

      await expect(
        service.update(userId, organizationId, updateDto),
      ).rejects.toThrow("Database error");
    });
  });

  describe("remove", () => {
    const userId = "user-1";
    const organizationId = "org-1";

    it("should delete user successfully", async () => {
      const existingUser = {
        id: userId,
        organizationId,
        email: "test@example.com",
        passwordHash: "hashed",
        fullName: "Test User",
        role: OrgRole.STAFF,
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findFirst.mockResolvedValue(existingUser);
      mockPrismaService.user.delete.mockResolvedValue(existingUser);

      await service.remove(userId, organizationId);

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it("should throw UserNotFoundException if user not found", async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.remove(userId, organizationId)).rejects.toThrow(
        UserNotFoundException,
      );
    });
  });
});
