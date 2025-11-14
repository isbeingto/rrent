/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from "@nestjs/testing";
import { Prisma } from "@prisma/client";
import {
  OrganizationNotFoundException,
  TenantNotFoundException,
  LeaseNotFoundException,
  PaymentNotFoundException,
} from "../src/common/errors/not-found.exception";
import { TenantEmailConflictException } from "../src/common/errors/conflict.exception";
import { TenantPhoneConflictException } from "../src/common/errors/conflict.exception";
import { TenantService } from "../src/modules/tenant/tenant.service";
import { LeaseService } from "../src/modules/lease/lease.service";
import { PaymentService } from "../src/modules/payment/payment.service";
import { PrismaService } from "../src/prisma/prisma.service";

describe("BE-2-31: Tenant/Lease/Payment Services", () => {
  let tenantService: TenantService;
  let leaseService: LeaseService;
  let paymentService: PaymentService;
  let mockPrisma: any;

  beforeEach(async () => {
    // Mock Prisma with all necessary tables and methods
    mockPrisma = {
      organization: {
        findUnique: jest.fn(),
      },
      tenant: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      property: {
        findFirst: jest.fn(),
      },
      unit: {
        findFirst: jest.fn(),
      },
      lease: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      payment: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn((callback: any) => {
        if (typeof callback === "function") {
          return callback(mockPrisma);
        }
        return Promise.all(callback);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        LeaseService,
        PaymentService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    tenantService = module.get<TenantService>(TenantService);
    leaseService = module.get<LeaseService>(LeaseService);
    paymentService = module.get<PaymentService>(PaymentService);
  });

  describe("TenantService", () => {
    const orgId = "org-1";
    const orgId2 = "org-2";

    describe("create", () => {
      it("should throw NotFoundException when organization does not exist", async () => {
        mockPrisma.organization.findUnique.mockResolvedValue(null);

        await expect(
          tenantService.create({
            organizationId: "nonexistent-org",
            fullName: "John Doe",
            email: "john@example.com",
            phone: "1234567890",
          }),
        ).rejects.toThrow(OrganizationNotFoundException);
      });

      it("should create tenant when org exists", async () => {
        mockPrisma.organization.findUnique.mockResolvedValue({ id: orgId });
        const tenantData = {
          id: "tenant-1",
          organizationId: orgId,
          fullName: "John Doe",
          email: "john@example.com",
          phone: "1234567890",
          idNumber: "ID123",
          notes: "Test",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockPrisma.tenant.create.mockResolvedValue(tenantData);

        const result = await tenantService.create({
          organizationId: orgId,
          fullName: "John Doe",
          email: "john@example.com",
          phone: "1234567890",
          idNumber: "ID123",
          notes: "Test",
        });

        expect(result).toEqual(tenantData);
        expect(mockPrisma.organization.findUnique).toHaveBeenCalledWith({
          where: { id: orgId },
        });
      });

      it("should throw ConflictException for duplicate email within organization", async () => {
        mockPrisma.organization.findUnique.mockResolvedValue({ id: orgId });
        const p2002Error = new Prisma.PrismaClientKnownRequestError(
          "Unique constraint failed",
          { code: "P2002", clientVersion: "6.19.0" },
        );
        (p2002Error.meta as any) = { target: ["organizationId", "email"] };
        mockPrisma.tenant.create.mockRejectedValue(p2002Error);

        await expect(
          tenantService.create({
            organizationId: orgId,
            fullName: "Jane Doe",
            email: "duplicate@example.com",
            phone: "9876543210",
          }),
        ).rejects.toThrow(TenantEmailConflictException);

        await expect(
          tenantService.create({
            organizationId: orgId,
            fullName: "Jane Doe",
            email: "duplicate@example.com",
            phone: "9876543210",
          }),
        ).rejects.toThrow(/email.*already exists/i);
      });

      it("should throw ConflictException for duplicate phone within organization", async () => {
        mockPrisma.organization.findUnique.mockResolvedValue({ id: orgId });
        const p2002Error = new Prisma.PrismaClientKnownRequestError(
          "Unique constraint failed",
          { code: "P2002", clientVersion: "6.19.0" },
        );
        (p2002Error.meta as any) = { target: ["organizationId", "phone"] };
        mockPrisma.tenant.create.mockRejectedValue(p2002Error);

        await expect(
          tenantService.create({
            organizationId: orgId,
            fullName: "Bob Smith",
            email: "bob@example.com",
            phone: "5555555555",
          }),
        ).rejects.toThrow(TenantPhoneConflictException);

        await expect(
          tenantService.create({
            organizationId: orgId,
            fullName: "Alice Smith",
            email: "alice@example.com",
            phone: "5555555555",
          }),
        ).rejects.toThrow(/phone.*already exists/i);
      });
    });

    describe("findById", () => {
      it("should find tenant in correct organization", async () => {
        const tenant = {
          id: "tenant-1",
          organizationId: orgId,
          fullName: "John Doe",
          email: "john@example.com",
          phone: "1234567890",
          idNumber: null,
          notes: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockPrisma.tenant.findFirst.mockResolvedValue(tenant);

        const result = await tenantService.findById("tenant-1", orgId);

        expect(result).toEqual(tenant);
        expect(mockPrisma.tenant.findFirst).toHaveBeenCalledWith({
          where: { id: "tenant-1", organizationId: orgId },
        });
      });

      it("should throw NotFoundException when tenant does not belong to organization", async () => {
        mockPrisma.tenant.findFirst.mockResolvedValue(null);

        await expect(
          tenantService.findById("tenant-1", orgId2),
        ).rejects.toThrow(TenantNotFoundException);
      });

      it("should prevent cross-org access via findById", async () => {
        mockPrisma.tenant.findFirst.mockImplementation((args: any) => {
          if (args.where.organizationId === orgId) {
            return Promise.resolve({
              id: "tenant-1",
              organizationId: orgId,
            });
          }
          return Promise.resolve(null);
        });

        const result = await tenantService.findById("tenant-1", orgId);
        expect(result).toBeDefined();

        await expect(
          tenantService.findById("tenant-1", orgId2),
        ).rejects.toThrow(TenantNotFoundException);
      });
    });

    describe("update", () => {
      it("should throw NotFoundException when updating cross-org tenant", async () => {
        mockPrisma.tenant.findFirst.mockResolvedValueOnce(null);

        await expect(
          tenantService.update("tenant-1", orgId2, {
            fullName: "Updated Name",
          }),
        ).rejects.toThrow(TenantNotFoundException);
      });

      it("should update tenant successfully within organization", async () => {
        const existingTenant = {
          id: "tenant-1",
          organizationId: orgId,
          fullName: "John Doe",
        };
        mockPrisma.tenant.findFirst.mockResolvedValueOnce(existingTenant);
        const updatedTenant = { ...existingTenant, fullName: "Jane Doe" };
        mockPrisma.tenant.update.mockResolvedValueOnce(updatedTenant);

        const result = await tenantService.update("tenant-1", orgId, {
          fullName: "Jane Doe",
        });

        expect(result.fullName).toBe("Jane Doe");
      });

      it("should throw ConflictException on email conflict during update", async () => {
        mockPrisma.tenant.findFirst.mockResolvedValueOnce({
          id: "tenant-1",
          organizationId: orgId,
        });
        const p2002Error = new Prisma.PrismaClientKnownRequestError(
          "Unique constraint failed",
          { code: "P2002", clientVersion: "6.19.0" },
        );
        (p2002Error.meta as any) = { target: ["organizationId", "email"] };
        mockPrisma.tenant.update.mockRejectedValueOnce(p2002Error);

        await expect(
          tenantService.update("tenant-1", orgId, {
            email: "conflict@example.com",
          }),
        ).rejects.toThrow(TenantEmailConflictException);
      });
    });

    describe("remove", () => {
      it("should throw NotFoundException when removing cross-org tenant", async () => {
        mockPrisma.tenant.findFirst.mockResolvedValueOnce(null);

        await expect(tenantService.remove("tenant-1", orgId2)).rejects.toThrow(
          TenantNotFoundException,
        );
      });

      it("should remove tenant successfully from organization", async () => {
        mockPrisma.tenant.findFirst.mockResolvedValueOnce({
          id: "tenant-1",
          organizationId: orgId,
        });
        mockPrisma.tenant.delete.mockResolvedValueOnce({});

        await expect(
          tenantService.remove("tenant-1", orgId),
        ).resolves.toBeUndefined();
        expect(mockPrisma.tenant.delete).toHaveBeenCalledWith({
          where: { id: "tenant-1" },
        });
      });
    });

    describe("findMany", () => {
      it("should return paginated tenants with correct organization filter", async () => {
        const tenants = [
          {
            id: "tenant-1",
            organizationId: orgId,
            fullName: "Alice Smith",
            email: "alice@example.com",
            phone: "1111111111",
            idNumber: null,
            notes: null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "tenant-2",
            organizationId: orgId,
            fullName: "Bob Johnson",
            email: "bob@example.com",
            phone: "2222222222",
            idNumber: null,
            notes: null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        mockPrisma.$transaction.mockResolvedValue([tenants, 2]);

        const result = await tenantService.findMany({
          organizationId: orgId,
          page: 1,
          limit: 20,
        });

        expect(result.items).toHaveLength(2);
        expect(result.meta.total).toBe(2);
        expect(result.meta.page).toBe(1);
      });

      it("should filter tenants by keyword across fullName, email, phone", async () => {
        const filteredTenant = {
          id: "tenant-1",
          organizationId: orgId,
          fullName: "Alice Smith",
          email: "alice@example.com",
          phone: "1111111111",
          idNumber: null,
          notes: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrisma.$transaction.mockResolvedValue([[filteredTenant], 1]);

        const result = await tenantService.findMany({
          organizationId: orgId,
          keyword: "Alice",
          page: 1,
          limit: 20,
        });

        expect(result.items).toHaveLength(1);
        expect(result.items[0].fullName).toContain("Alice");
        expect(result.meta.total).toBe(1);
      });

      it("should filter tenants by fullName parameter", async () => {
        const filteredTenant = {
          id: "tenant-1",
          organizationId: orgId,
          fullName: "John Doe",
          email: "john@example.com",
          phone: "3333333333",
          idNumber: null,
          notes: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrisma.$transaction.mockResolvedValue([[filteredTenant], 1]);

        const result = await tenantService.findMany({
          organizationId: orgId,
          fullName: "John",
          page: 1,
          limit: 20,
        });

        expect(result.items).toHaveLength(1);
        expect(result.meta.total).toBe(1);
      });

      it("should handle empty results correctly", async () => {
        mockPrisma.$transaction.mockResolvedValue([[], 0]);

        const result = await tenantService.findMany({
          organizationId: orgId,
          keyword: "NonExistent",
          page: 1,
          limit: 20,
        });

        expect(result.items).toHaveLength(0);
        expect(result.meta.total).toBe(0);
        expect(result.meta.pageCount).toBe(0);
      });
    });
  });

  describe("LeaseService", () => {
    const orgId = "org-1";
    const propertyId = "prop-1";
    const unitId = "unit-1";
    const tenantId = "tenant-1";

    describe("create", () => {
      it("should throw NotFoundException when organization does not exist", async () => {
        mockPrisma.organization.findUnique.mockResolvedValue(null);

        await expect(
          leaseService.create({
            organizationId: "nonexistent-org",
            propertyId,
            unitId,
            tenantId,
            billCycle: "MONTHLY",
            startDate: "2025-01-01",
            rentAmount: 1000,
          }),
        ).rejects.toThrow(OrganizationNotFoundException);
      });

      it("should create lease without validating property, unit, or tenant", async () => {
        mockPrisma.organization.findUnique.mockResolvedValue({ id: orgId });

        const leaseData = {
          id: "lease-1",
          organizationId: orgId,
          propertyId: "any-property",
          unitId: "any-unit",
          tenantId: "any-tenant",
          status: "PENDING",
          billCycle: "MONTHLY",
          startDate: new Date("2025-01-01"),
          endDate: null,
          rentAmount: 1000,
          depositAmount: null,
          currency: "CNY",
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockPrisma.lease.create.mockResolvedValue(leaseData);

        const result = await leaseService.create({
          organizationId: orgId,
          propertyId: "any-property",
          unitId: "any-unit",
          tenantId: "any-tenant",
          billCycle: "MONTHLY",
          startDate: "2025-01-01",
          rentAmount: 1000,
        });

        expect(result).toEqual(leaseData);
      });

      it("should create lease with full chain validation passing", async () => {
        mockPrisma.organization.findUnique.mockResolvedValue({ id: orgId });
        mockPrisma.property.findFirst.mockResolvedValue({
          id: propertyId,
          organizationId: orgId,
        });
        mockPrisma.unit.findFirst.mockResolvedValue({
          id: unitId,
          propertyId,
        });
        mockPrisma.tenant.findFirst.mockResolvedValue({
          id: tenantId,
          organizationId: orgId,
        });

        const leaseData = {
          id: "lease-1",
          organizationId: orgId,
          propertyId,
          unitId,
          tenantId,
          status: "PENDING",
          billCycle: "MONTHLY",
          startDate: new Date("2025-01-01"),
          endDate: null,
          rentAmount: 1000,
          depositAmount: null,
          currency: "CNY",
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockPrisma.lease.create.mockResolvedValue(leaseData);

        const result = await leaseService.create({
          organizationId: orgId,
          propertyId,
          unitId,
          tenantId,
          billCycle: "MONTHLY",
          startDate: "2025-01-01",
          rentAmount: 1000,
        });

        expect(result).toEqual(leaseData);
        expect(result.status).toBe("PENDING");
        expect(result.currency).toBe("CNY");
      });

      it("should create lease with default status and currency when not provided", async () => {
        mockPrisma.organization.findUnique.mockResolvedValue({ id: orgId });
        mockPrisma.property.findFirst.mockResolvedValue({
          id: propertyId,
          organizationId: orgId,
        });
        mockPrisma.unit.findFirst.mockResolvedValue({
          id: unitId,
          propertyId,
        });
        mockPrisma.tenant.findFirst.mockResolvedValue({
          id: tenantId,
          organizationId: orgId,
        });

        mockPrisma.lease.create.mockResolvedValue({
          id: "lease-1",
          organizationId: orgId,
          propertyId,
          unitId,
          tenantId,
          status: "PENDING",
          billCycle: "MONTHLY",
          startDate: new Date("2025-01-01"),
          endDate: null,
          rentAmount: 1000,
          depositAmount: null,
          currency: "CNY",
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const result = await leaseService.create({
          organizationId: orgId,
          propertyId,
          unitId,
          tenantId,
          billCycle: "MONTHLY",
          startDate: "2025-01-01",
          rentAmount: 1000,
        });

        expect(result.status).toBe("PENDING");
        expect(result.currency).toBe("CNY");
      });
    });

    describe("findById", () => {
      it("should find lease in correct organization", async () => {
        const lease = {
          id: "lease-1",
          organizationId: orgId,
          propertyId,
          unitId,
          tenantId,
          status: "ACTIVE",
          billCycle: "MONTHLY",
          startDate: new Date("2025-01-01"),
          endDate: null,
          rentAmount: 1000,
          depositAmount: 5000,
          currency: "CNY",
          notes: "Test lease",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockPrisma.lease.findFirst.mockResolvedValue(lease);

        const result = await leaseService.findById("lease-1", orgId);

        expect(result).toEqual(lease);
        expect(mockPrisma.lease.findFirst).toHaveBeenCalledWith({
          where: { id: "lease-1", organizationId: orgId },
        });
      });

      it("should throw NotFoundException when lease not in organization", async () => {
        mockPrisma.lease.findFirst.mockResolvedValue(null);

        await expect(leaseService.findById("lease-1", "org-2")).rejects.toThrow(
          LeaseNotFoundException,
        );
      });

      it("should prevent cross-org access", async () => {
        mockPrisma.lease.findFirst.mockImplementation((args: any) => {
          if (args.where.organizationId === orgId) {
            return Promise.resolve({
              id: "lease-1",
              organizationId: orgId,
            });
          }
          return Promise.resolve(null);
        });

        const result = await leaseService.findById("lease-1", orgId);
        expect(result).toBeDefined();

        await expect(leaseService.findById("lease-1", "org-2")).rejects.toThrow(
          LeaseNotFoundException,
        );
      });
    });

    describe("update", () => {
      it("should throw NotFoundException when updating lease in different organization", async () => {
        mockPrisma.lease.findFirst.mockResolvedValueOnce(null);

        await expect(
          leaseService.update("lease-1", "org-2", {
            status: "ACTIVE",
          }),
        ).rejects.toThrow(LeaseNotFoundException);
      });

      it("should update lease successfully within organization", async () => {
        const existingLease = {
          id: "lease-1",
          organizationId: orgId,
        };
        mockPrisma.lease.findFirst.mockResolvedValueOnce(existingLease);
        const updatedLease = { ...existingLease, status: "ACTIVE" };
        mockPrisma.lease.update.mockResolvedValueOnce(updatedLease);

        const result = await leaseService.update("lease-1", orgId, {
          status: "ACTIVE",
        });

        expect(result.status).toBe("ACTIVE");
      });
    });

    describe("remove", () => {
      it("should throw NotFoundException when removing lease from different org", async () => {
        mockPrisma.lease.findFirst.mockResolvedValueOnce(null);

        await expect(leaseService.remove("lease-1", "org-2")).rejects.toThrow(
          LeaseNotFoundException,
        );
      });

      it("should remove lease successfully", async () => {
        mockPrisma.lease.findFirst.mockResolvedValueOnce({
          id: "lease-1",
          organizationId: orgId,
        });
        mockPrisma.lease.delete.mockResolvedValueOnce({});

        await expect(
          leaseService.remove("lease-1", orgId),
        ).resolves.toBeUndefined();
      });
    });

    describe("findMany", () => {
      it("should return leases with organization filter", async () => {
        const leases = [
          {
            id: "lease-1",
            organizationId: orgId,
            propertyId,
            unitId,
            tenantId,
            status: "ACTIVE",
            billCycle: "MONTHLY",
            startDate: new Date(),
            rentAmount: 1000,
            currency: "CNY",
          },
          {
            id: "lease-2",
            organizationId: orgId,
            propertyId,
            unitId: "unit-2",
            tenantId: "tenant-2",
            status: "PENDING",
            billCycle: "MONTHLY",
            startDate: new Date(),
            rentAmount: 1200,
            currency: "CNY",
          },
        ];

        mockPrisma.$transaction.mockResolvedValue([leases, 2]);

        const result = await leaseService.findMany({
          organizationId: orgId,
          page: 1,
          limit: 20,
        });

        expect(result.items).toHaveLength(2);
        expect(result.meta.total).toBe(2);
      });

      it("should filter leases by status", async () => {
        const activeLease = {
          id: "lease-1",
          organizationId: orgId,
          status: "ACTIVE",
        };

        mockPrisma.$transaction.mockResolvedValue([[activeLease], 1]);

        const result = await leaseService.findMany({
          organizationId: orgId,
          status: "ACTIVE",
          page: 1,
          limit: 20,
        });

        expect(result.items).toHaveLength(1);
        expect(result.items[0].status).toBe("ACTIVE");
      });

      it("should filter leases by unitId", async () => {
        const unitLease = {
          id: "lease-1",
          organizationId: orgId,
          unitId,
        };

        mockPrisma.$transaction.mockResolvedValue([[unitLease], 1]);

        const result = await leaseService.findMany({
          organizationId: orgId,
          unitId,
          page: 1,
          limit: 20,
        });

        expect(result.items).toHaveLength(1);
        expect(result.items[0].unitId).toBe(unitId);
      });

      it("should filter leases by tenantId", async () => {
        const tenantLease = {
          id: "lease-1",
          organizationId: orgId,
          tenantId,
        };

        mockPrisma.$transaction.mockResolvedValue([[tenantLease], 1]);

        const result = await leaseService.findMany({
          organizationId: orgId,
          tenantId,
          page: 1,
          limit: 20,
        });

        expect(result.items).toHaveLength(1);
        expect(result.items[0].tenantId).toBe(tenantId);
      });

      it("should filter leases by propertyId", async () => {
        const propertyLease = {
          id: "lease-1",
          organizationId: orgId,
          propertyId,
        };

        mockPrisma.$transaction.mockResolvedValue([[propertyLease], 1]);

        const result = await leaseService.findMany({
          organizationId: orgId,
          propertyId,
          page: 1,
          limit: 20,
        });

        expect(result.items).toHaveLength(1);
        expect(result.items[0].propertyId).toBe(propertyId);
      });

      it("should calculate pageCount correctly", async () => {
        const leases = Array(15)
          .fill(null)
          .map((_, i) => ({
            id: `lease-${i}`,
            organizationId: orgId,
          }));

        mockPrisma.$transaction.mockResolvedValue([leases, 15]);

        const result = await leaseService.findMany({
          organizationId: orgId,
          page: 1,
          limit: 10,
        });

        expect(result.meta.pageCount).toBe(2);
      });
    });
  });

  describe("PaymentService", () => {
    const orgId = "org-1";
    const orgId2 = "org-2";
    const leaseId = "lease-1";

    describe("create", () => {
      it("should throw NotFoundException when lease does not exist", async () => {
        mockPrisma.lease.findFirst.mockResolvedValue(null);

        await expect(
          paymentService.create({
            organizationId: "nonexistent-org",
            leaseId,
            type: "RENT",
            amount: 1000,
            dueDate: "2025-01-15",
          }),
        ).rejects.toThrow(LeaseNotFoundException);
      });

      it("should throw NotFoundException when lease does not belong to organization", async () => {
        mockPrisma.lease.findFirst.mockResolvedValue(null);

        await expect(
          paymentService.create({
            organizationId: orgId,
            leaseId,
            type: "RENT",
            amount: 1000,
            dueDate: "2025-01-15",
          }),
        ).rejects.toThrow(LeaseNotFoundException);
      });

      it("should create payment when lease exists", async () => {
        mockPrisma.lease.findFirst.mockResolvedValue({
          id: leaseId,
          organizationId: orgId,
        });

        const paymentData = {
          id: "payment-1",
          organizationId: orgId,
          leaseId,
          type: "RENT",
          status: "PENDING",
          method: null,
          amount: 1000,
          currency: "CNY",
          dueDate: new Date("2025-01-15"),
          paidAt: null,
          externalRef: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockPrisma.payment.create.mockResolvedValue(paymentData);

        const result = await paymentService.create({
          organizationId: orgId,
          leaseId,
          type: "RENT",
          amount: 1000,
          dueDate: "2025-01-15",
        });

        expect(result).toEqual(paymentData);
      });

      it("should create payment with default status and currency", async () => {
        mockPrisma.lease.findFirst.mockResolvedValue({
          id: leaseId,
          organizationId: orgId,
        });

        const paymentData = {
          id: "payment-1",
          organizationId: orgId,
          leaseId,
          type: "RENT",
          status: "PENDING",
          method: null,
          amount: 1000,
          currency: "CNY",
          dueDate: new Date("2025-01-15"),
          paidAt: null,
          externalRef: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockPrisma.payment.create.mockResolvedValue(paymentData);

        const result = await paymentService.create({
          organizationId: orgId,
          leaseId,
          type: "RENT",
          amount: 1000,
          dueDate: "2025-01-15",
        });

        expect(result).toEqual(paymentData);
        expect(result.status).toBe("PENDING");
        expect(result.currency).toBe("CNY");
      });

      it("should create payment with custom status and currency", async () => {
        mockPrisma.lease.findFirst.mockResolvedValue({
          id: leaseId,
          organizationId: orgId,
        });

        const paymentData = {
          id: "payment-1",
          organizationId: orgId,
          leaseId,
          type: "RENT",
          status: "PAID",
          method: "BANK_TRANSFER",
          amount: 1000,
          currency: "USD",
          dueDate: new Date("2025-01-15"),
          paidAt: new Date("2025-01-10"),
          externalRef: "REF123",
          notes: "Paid early",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockPrisma.payment.create.mockResolvedValue(paymentData);

        const result = await paymentService.create({
          organizationId: orgId,
          leaseId,
          type: "RENT",
          status: "PAID",
          method: "BANK_TRANSFER",
          amount: 1000,
          currency: "USD",
          dueDate: "2025-01-15",
          paidAt: "2025-01-10",
          externalRef: "REF123",
          notes: "Paid early",
        });

        expect(result.status).toBe("PAID");
        expect(result.currency).toBe("USD");
        expect(result.method).toBe("BANK_TRANSFER");
      });
    });

    describe("findById", () => {
      it("should find payment in correct organization", async () => {
        const payment = {
          id: "payment-1",
          organizationId: orgId,
          leaseId,
          type: "RENT",
          status: "PENDING",
          amount: 1000,
          currency: "CNY",
          dueDate: new Date(),
        };
        mockPrisma.payment.findFirst.mockResolvedValue(payment);

        const result = await paymentService.findById("payment-1", orgId);

        expect(result).toEqual(payment);
        expect(mockPrisma.payment.findFirst).toHaveBeenCalledWith({
          where: { id: "payment-1", organizationId: orgId },
        });
      });

      it("should throw NotFoundException when payment not in organization", async () => {
        mockPrisma.payment.findFirst.mockResolvedValue(null);

        await expect(
          paymentService.findById("payment-1", orgId2),
        ).rejects.toThrow(PaymentNotFoundException);
      });

      it("should prevent cross-org access", async () => {
        mockPrisma.payment.findFirst.mockImplementation((args: any) => {
          if (args.where.organizationId === orgId) {
            return Promise.resolve({
              id: "payment-1",
              organizationId: orgId,
            });
          }
          return Promise.resolve(null);
        });

        const result = await paymentService.findById("payment-1", orgId);
        expect(result).toBeDefined();

        await expect(
          paymentService.findById("payment-1", orgId2),
        ).rejects.toThrow(PaymentNotFoundException);
      });
    });

    describe("update", () => {
      it("should throw NotFoundException when updating payment in different org", async () => {
        mockPrisma.payment.findFirst.mockResolvedValueOnce(null);

        await expect(
          paymentService.update("payment-1", orgId2, {
            status: "PAID",
          }),
        ).rejects.toThrow(PaymentNotFoundException);
      });

      it("should update payment successfully within organization", async () => {
        mockPrisma.payment.findFirst.mockResolvedValueOnce({
          id: "payment-1",
          organizationId: orgId,
        });
        const updatedPayment = {
          id: "payment-1",
          organizationId: orgId,
          status: "PAID",
        };
        mockPrisma.payment.update.mockResolvedValueOnce(updatedPayment);

        const result = await paymentService.update("payment-1", orgId, {
          status: "PAID",
        });

        expect(result.status).toBe("PAID");
      });
    });

    describe("remove", () => {
      it("should throw NotFoundException when removing payment from different org", async () => {
        mockPrisma.payment.findFirst.mockResolvedValueOnce(null);

        await expect(
          paymentService.remove("payment-1", orgId2),
        ).rejects.toThrow(PaymentNotFoundException);
      });

      it("should remove payment successfully", async () => {
        mockPrisma.payment.findFirst.mockResolvedValueOnce({
          id: "payment-1",
          organizationId: orgId,
        });
        mockPrisma.payment.delete.mockResolvedValueOnce({});

        await expect(
          paymentService.remove("payment-1", orgId),
        ).resolves.toBeUndefined();
      });
    });

    describe("findMany", () => {
      it("should return payments with organization filter", async () => {
        const payments = [
          {
            id: "payment-1",
            organizationId: orgId,
            leaseId,
            type: "RENT",
            status: "PENDING",
            amount: 1000,
            dueDate: new Date("2025-01-15"),
          },
          {
            id: "payment-2",
            organizationId: orgId,
            leaseId,
            type: "UTILITIES",
            status: "PAID",
            amount: 200,
            dueDate: new Date("2025-01-15"),
          },
        ];

        mockPrisma.$transaction.mockResolvedValue([payments, 2]);

        const result = await paymentService.findMany({
          organizationId: orgId,
          page: 1,
          limit: 20,
        });

        expect(result.items).toHaveLength(2);
        expect(result.meta.total).toBe(2);
      });

      it("should filter payments by status", async () => {
        const pendingPayments = [
          {
            id: "payment-1",
            organizationId: orgId,
            status: "PENDING",
          },
        ];

        mockPrisma.$transaction.mockResolvedValue([pendingPayments, 1]);

        const result = await paymentService.findMany({
          organizationId: orgId,
          status: "PENDING",
          page: 1,
          limit: 20,
        });

        expect(result.items).toHaveLength(1);
        expect(result.items[0].status).toBe("PENDING");
      });

      it("should filter payments by leaseId", async () => {
        const leasePayments = [
          {
            id: "payment-1",
            organizationId: orgId,
            leaseId,
          },
        ];

        mockPrisma.$transaction.mockResolvedValue([leasePayments, 1]);

        const result = await paymentService.findMany({
          organizationId: orgId,
          leaseId,
          page: 1,
          limit: 20,
        });

        expect(result.items).toHaveLength(1);
        expect(result.items[0].leaseId).toBe(leaseId);
      });

      it("should filter payments by dueDate range", async () => {
        const paymentInRange = {
          id: "payment-1",
          organizationId: orgId,
          dueDate: new Date("2025-02-15"),
        };

        mockPrisma.$transaction.mockResolvedValue([[paymentInRange], 1]);

        const result = await paymentService.findMany({
          organizationId: orgId,
          dueDateFrom: "2025-02-01",
          dueDateTo: "2025-02-28",
          page: 1,
          limit: 20,
        });

        expect(result.items).toHaveLength(1);
        expect(result.items[0].dueDate).toEqual(new Date("2025-02-15"));
      });

      it("should order payments by dueDate ascending", async () => {
        const payments = [
          {
            id: "payment-1",
            organizationId: orgId,
            dueDate: new Date("2025-01-15"),
          },
          {
            id: "payment-2",
            organizationId: orgId,
            dueDate: new Date("2025-01-20"),
          },
        ];

        mockPrisma.$transaction.mockResolvedValue([payments, 2]);

        const result = await paymentService.findMany({
          organizationId: orgId,
          page: 1,
          limit: 20,
        });

        expect(new Date(result.items[0].dueDate).getTime()).toBeLessThanOrEqual(
          new Date(result.items[1].dueDate).getTime(),
        );
      });

      it("should calculate pageCount correctly for payments", async () => {
        const payments = Array(35)
          .fill(null)
          .map((_, i) => ({
            id: `payment-${i}`,
            organizationId: orgId,
          }));

        mockPrisma.$transaction.mockResolvedValue([payments, 35]);

        const result = await paymentService.findMany({
          organizationId: orgId,
          page: 1,
          limit: 20,
        });

        expect(result.meta.pageCount).toBe(2);
      });

      it("should handle empty results for date range query", async () => {
        mockPrisma.$transaction.mockResolvedValue([[], 0]);

        const result = await paymentService.findMany({
          organizationId: orgId,
          dueDateFrom: "2026-01-01",
          dueDateTo: "2026-12-31",
          page: 1,
          limit: 20,
        });

        expect(result.items).toHaveLength(0);
        expect(result.meta.total).toBe(0);
        expect(result.meta.pageCount).toBe(0);
      });
    });
  });
});
