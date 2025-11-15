/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from "@nestjs/testing";
import { OrganizationService } from "../src/modules/organization/organization.service";
import { PropertyService } from "../src/modules/property/property.service";
import { TenantService } from "../src/modules/tenant/tenant.service";
import { LeaseService } from "../src/modules/lease/lease.service";
import { PaymentService } from "../src/modules/payment/payment.service";
import { PrismaService } from "../src/prisma/prisma.service";
import { AuditLogService } from "../src/modules/audit-log/audit-log.service";
import { LeaseStatus, PaymentStatus } from "@prisma/client";

describe("BE-5-48: Filtering (keyword/status/date)", () => {
  let organizationService: OrganizationService;
  let propertyService: PropertyService;
  let tenantService: TenantService;
  let leaseService: LeaseService;
  let paymentService: PaymentService;
  let mockPrisma: any;
  let mockAuditLogService: any;

  beforeEach(async () => {
    mockPrisma = {
      organization: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      property: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      tenant: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      lease: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      payment: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    mockAuditLogService = {
      log: jest.fn(),
      logBatch: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationService,
        PropertyService,
        TenantService,
        LeaseService,
        PaymentService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    organizationService = module.get<OrganizationService>(OrganizationService);
    propertyService = module.get<PropertyService>(PropertyService);
    tenantService = module.get<TenantService>(TenantService);
    leaseService = module.get<LeaseService>(LeaseService);
    paymentService = module.get<PaymentService>(PaymentService);
  });

  describe("Keyword Search", () => {
    it("should search organizations by keyword (name/code)", async () => {
      const mockOrgs = [
        {
          id: "org-1",
          name: "Test Organization",
          code: "TEST",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.$transaction.mockResolvedValue([mockOrgs, 1]);

      const result = await organizationService.findMany(
        { page: 1, pageSize: 10, raw: {} },
        { keyword: "Test" },
      );

      expect(result.items).toEqual(mockOrgs);
      expect(result.meta.total).toBe(1);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("should search properties by keyword (name/code/address)", async () => {
      const mockProps = [
        {
          id: "prop-1",
          name: "Test Property",
          code: "PROP001",
          organizationId: "org-1",
          addressLine1: "123 Test St",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.$transaction.mockResolvedValue([mockProps, 1]);

      const result = await propertyService.findMany(
        { page: 1, pageSize: 10, raw: {} },
        { organizationId: "org-1", keyword: "Test" },
      );

      expect(result.items).toEqual(mockProps);
      expect(result.meta.total).toBe(1);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("should search tenants by keyword (fullName/email/phone)", async () => {
      const mockTenants = [
        {
          id: "tenant-1",
          fullName: "Alice Test",
          email: "alice@test.com",
          phone: "+1234567890",
          organizationId: "org-1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.$transaction.mockResolvedValue([mockTenants, 1]);

      const result = await tenantService.findMany(
        { page: 1, pageSize: 10, raw: {} },
        { organizationId: "org-1", keyword: "Alice" },
      );

      expect(result.items).toEqual(mockTenants);
      expect(result.meta.total).toBe(1);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe("Status Filter", () => {
    it("should filter leases by status", async () => {
      const mockLeases = [
        {
          id: "lease-1",
          organizationId: "org-1",
          status: LeaseStatus.ACTIVE,
          startDate: new Date(),
          endDate: new Date(),
          rentAmount: 1000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.$transaction.mockResolvedValue([mockLeases, 1]);

      const result = await leaseService.findMany(
        { page: 1, pageSize: 10, raw: {} },
        { organizationId: "org-1", status: LeaseStatus.ACTIVE },
      );

      expect(result.items).toEqual(mockLeases);
      expect(result.meta.total).toBe(1);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("should filter payments by status", async () => {
      const mockPayments = [
        {
          id: "payment-1",
          organizationId: "org-1",
          leaseId: "lease-1",
          amount: 1000,
          dueDate: new Date(),
          status: PaymentStatus.PAID,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.$transaction.mockResolvedValue([mockPayments, 1]);

      const result = await paymentService.findMany(
        { page: 1, pageSize: 10, raw: {} },
        { organizationId: "org-1", status: PaymentStatus.PAID },
      );

      expect(result.items).toEqual(mockPayments);
      expect(result.meta.total).toBe(1);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe("Date Range Filter", () => {
    it("should filter by dateStart", async () => {
      const mockOrgs = [
        {
          id: "org-1",
          name: "Test Org",
          code: "TEST",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.$transaction.mockResolvedValue([mockOrgs, 1]);

      const dateStart = new Date("2024-01-01");
      const result = await organizationService.findMany(
        { page: 1, pageSize: 10, raw: {} },
        { dateStart: dateStart.toISOString() },
      );

      expect(result.items).toEqual(mockOrgs);
      expect(result.meta.total).toBe(1);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("should filter by dateEnd", async () => {
      const mockOrgs = [
        {
          id: "org-1",
          name: "Test Org",
          code: "TEST",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.$transaction.mockResolvedValue([mockOrgs, 1]);

      const dateEnd = new Date("2024-12-31");
      const result = await organizationService.findMany(
        { page: 1, pageSize: 10, raw: {} },
        { dateEnd: dateEnd.toISOString() },
      );

      expect(result.items).toEqual(mockOrgs);
      expect(result.meta.total).toBe(1);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("should filter by dateStart and dateEnd", async () => {
      const mockTenants = [
        {
          id: "tenant-1",
          fullName: "Test Tenant",
          email: "test@test.com",
          organizationId: "org-1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.$transaction.mockResolvedValue([mockTenants, 1]);

      const dateStart = new Date("2024-01-01");
      const dateEnd = new Date("2024-12-31");

      const result = await tenantService.findMany(
        { page: 1, pageSize: 10, raw: {} },
        {
          organizationId: "org-1",
          dateStart: dateStart.toISOString(),
          dateEnd: dateEnd.toISOString(),
        },
      );

      expect(result.items).toEqual(mockTenants);
      expect(result.meta.total).toBe(1);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe("Combined Filters", () => {
    it("should apply keyword and date filters together", async () => {
      const mockOrgs = [
        {
          id: "org-1",
          name: "Test Organization",
          code: "TEST",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.$transaction.mockResolvedValue([mockOrgs, 1]);

      const dateStart = new Date("2024-01-01");
      const result = await organizationService.findMany(
        { page: 1, pageSize: 10, raw: {} },
        {
          keyword: "Test",
          dateStart: dateStart.toISOString(),
        },
      );

      expect(result.items).toEqual(mockOrgs);
      expect(result.meta.total).toBe(1);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("should apply status and date filters together for leases", async () => {
      const mockLeases = [
        {
          id: "lease-1",
          organizationId: "org-1",
          status: LeaseStatus.PENDING,
          startDate: new Date(),
          endDate: new Date(),
          rentAmount: 1000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.$transaction.mockResolvedValue([mockLeases, 1]);

      const dateStart = new Date("2024-01-01");
      const result = await leaseService.findMany(
        { page: 1, pageSize: 10, raw: {} },
        {
          organizationId: "org-1",
          status: LeaseStatus.PENDING,
          dateStart: dateStart.toISOString(),
        },
      );

      expect(result.items).toEqual(mockLeases);
      expect(result.meta.total).toBe(1);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });
});
