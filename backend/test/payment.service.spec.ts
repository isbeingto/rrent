import { Test, TestingModule } from "@nestjs/testing";
import { PaymentService } from "../src/modules/payment/payment.service";
import { PrismaService } from "../src/prisma/prisma.service";
import { AuditLogService } from "../src/modules/audit-log/audit-log.service";
import { PaymentStatus, BillType } from "@prisma/client";
import {
  LeaseNotFoundException,
  PaymentNotFoundException,
} from "../src/common/errors/not-found.exception";
import { CrossOrgAccessException } from "../src/common/errors/forbidden.exception";
import { PaymentInvalidStatusForMarkPaidException } from "../src/common/errors/payment.exception";

describe("PaymentService", () => {
  let service: PaymentService;
  let prisma: PrismaService;
  let auditLogService: AuditLogService;

  const mockPrismaService = {
    lease: {
      findUnique: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockAuditLogService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
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

    service = module.get<PaymentService>(PaymentService);
    prisma = module.get<PrismaService>(PrismaService);
    auditLogService = module.get<AuditLogService>(AuditLogService);

    jest.clearAllMocks();
  });

  describe("create", () => {
    const createDto = {
      organizationId: "org-1",
      leaseId: "lease-1",
      type: BillType.RENT,
      status: PaymentStatus.PENDING,
      amount: 5000,
      currency: "CNY",
      dueDate: "2024-01-01",
      method: undefined,
      paidAt: undefined,
      externalRef: undefined,
      notes: undefined,
    };

    it("should create payment successfully", async () => {
      const mockLease = { id: "lease-1", organizationId: "org-1" };
      const mockPayment = { id: "payment-1", ...createDto };

      mockPrismaService.lease.findUnique.mockResolvedValue(mockLease);
      mockPrismaService.payment.create.mockResolvedValue(mockPayment);

      const result = await service.create(createDto);

      expect(result).toEqual(mockPayment);
      expect(prisma.lease.findUnique).toHaveBeenCalledWith({
        where: { id: createDto.leaseId },
      });
    });

    it("should throw LeaseNotFoundException if lease not found", async () => {
      mockPrismaService.lease.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        LeaseNotFoundException,
      );
    });

    it("should throw CrossOrgAccessException for cross-org access", async () => {
      const mockLease = { id: "lease-1", organizationId: "different-org" };
      mockPrismaService.lease.findUnique.mockResolvedValue(mockLease);

      await expect(service.create(createDto)).rejects.toThrow(
        CrossOrgAccessException,
      );
    });

    it("should use default status PENDING if not provided", async () => {
      const dtoWithoutStatus = { ...createDto, status: undefined };
      const mockLease = { id: "lease-1", organizationId: "org-1" };
      const mockPayment = {
        id: "payment-1",
        ...dtoWithoutStatus,
        status: PaymentStatus.PENDING,
      };

      mockPrismaService.lease.findUnique.mockResolvedValue(mockLease);
      mockPrismaService.payment.create.mockResolvedValue(mockPayment);

      await service.create(dtoWithoutStatus);

      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: PaymentStatus.PENDING,
        }),
      });
    });

    it("should use default currency CNY if not provided", async () => {
      const dtoWithoutCurrency = { ...createDto, currency: undefined };
      const mockLease = { id: "lease-1", organizationId: "org-1" };
      const mockPayment = {
        id: "payment-1",
        ...dtoWithoutCurrency,
        currency: "CNY",
      };

      mockPrismaService.lease.findUnique.mockResolvedValue(mockLease);
      mockPrismaService.payment.create.mockResolvedValue(mockPayment);

      await service.create(dtoWithoutCurrency);

      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          currency: "CNY",
        }),
      });
    });
  });

  describe("findMany", () => {
    const listQuery = {
      page: 1,
      pageSize: 10,
      sort: "dueDate",
      order: "asc" as const,
      raw: {},
    };
    const organizationId = "org-1";

    it("should filter by leaseId", async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany(listQuery, { organizationId, leaseId: "lease-1" });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should filter by status", async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany(listQuery, {
        organizationId,
        status: PaymentStatus.PAID,
      });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should filter by dueDateFrom", async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany(listQuery, {
        organizationId,
        dueDateFrom: "2024-01-01",
      });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should filter by dueDateTo", async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany(listQuery, {
        organizationId,
        dueDateTo: "2024-12-31",
      });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should filter by both dueDateFrom and dueDateTo", async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.findMany(listQuery, {
        organizationId,
        dueDateFrom: "2024-01-01",
        dueDateTo: "2024-12-31",
      });

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe("markPaid", () => {
    const paymentId = "payment-1";
    const organizationId = "org-1";
    const markPaidDto = { paidAt: "2024-01-15T00:00:00Z" };

    it("should mark PENDING payment as PAID", async () => {
      const mockPayment = {
        id: paymentId,
        organizationId,
        status: PaymentStatus.PENDING,
        amount: 5000,
        type: BillType.RENT,
      };

      const updatedPayment = {
        ...mockPayment,
        status: PaymentStatus.PAID,
        paidAt: new Date(markPaidDto.paidAt),
      };

      mockPrismaService.payment.findFirst.mockResolvedValue(mockPayment);
      mockPrismaService.payment.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.payment.findUniqueOrThrow.mockResolvedValue(
        updatedPayment,
      );
      mockAuditLogService.log.mockResolvedValue(undefined);

      const result = await service.markPaid(
        paymentId,
        organizationId,
        markPaidDto,
      );

      expect(result.status).toBe(PaymentStatus.PAID);
      expect(prisma.payment.updateMany).toHaveBeenCalledWith({
        where: {
          id: paymentId,
          status: { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE] },
        },
        data: {
          status: PaymentStatus.PAID,
          paidAt: new Date(markPaidDto.paidAt),
        },
      });
      expect(auditLogService.log).toHaveBeenCalled();
    });

    it("should mark OVERDUE payment as PAID", async () => {
      const mockPayment = {
        id: paymentId,
        organizationId,
        status: PaymentStatus.OVERDUE,
        amount: 5000,
        type: BillType.RENT,
      };

      const updatedPayment = {
        ...mockPayment,
        status: PaymentStatus.PAID,
        paidAt: new Date(),
      };

      mockPrismaService.payment.findFirst.mockResolvedValue(mockPayment);
      mockPrismaService.payment.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.payment.findUniqueOrThrow.mockResolvedValue(
        updatedPayment,
      );
      mockAuditLogService.log.mockResolvedValue(undefined);

      const result = await service.markPaid(paymentId, organizationId, {});

      expect(result.status).toBe(PaymentStatus.PAID);
    });

    it("should return payment if already PAID (idempotent)", async () => {
      const mockPayment = {
        id: paymentId,
        organizationId,
        status: PaymentStatus.PAID,
        paidAt: new Date("2024-01-10"),
        amount: 5000,
        type: BillType.RENT,
      };

      mockPrismaService.payment.findFirst.mockResolvedValue(mockPayment);

      const result = await service.markPaid(
        paymentId,
        organizationId,
        markPaidDto,
      );

      expect(result).toEqual(mockPayment);
      expect(prisma.payment.updateMany).not.toHaveBeenCalled();
    });

    it("should throw PaymentNotFoundException if not found", async () => {
      mockPrismaService.payment.findFirst.mockResolvedValue(null);

      await expect(
        service.markPaid(paymentId, organizationId, markPaidDto),
      ).rejects.toThrow(PaymentNotFoundException);
    });

    it("should throw PaymentInvalidStatusForMarkPaidException for CANCELLED status", async () => {
      const mockPayment = {
        id: paymentId,
        organizationId,
        status: "CANCELLED" as PaymentStatus,
        amount: 5000,
        type: BillType.RENT,
      };

      mockPrismaService.payment.findFirst.mockResolvedValue(mockPayment);

      await expect(
        service.markPaid(paymentId, organizationId, markPaidDto),
      ).rejects.toThrow(PaymentInvalidStatusForMarkPaidException);
    });

    it("should handle concurrent modification (updateMany returns 0)", async () => {
      const mockPayment = {
        id: paymentId,
        organizationId,
        status: PaymentStatus.PENDING,
        amount: 5000,
        type: BillType.RENT,
      };

      const currentPayment = {
        ...mockPayment,
        status: PaymentStatus.PAID,
        paidAt: new Date(),
      };

      mockPrismaService.payment.findFirst.mockResolvedValue(mockPayment);
      mockPrismaService.payment.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaService.payment.findUnique.mockResolvedValue(currentPayment);

      const result = await service.markPaid(
        paymentId,
        organizationId,
        markPaidDto,
      );

      expect(result.status).toBe(PaymentStatus.PAID);
    });

    it("should throw exception if concurrent modification changed to invalid status", async () => {
      const mockPayment = {
        id: paymentId,
        organizationId,
        status: PaymentStatus.PENDING,
        amount: 5000,
        type: BillType.RENT,
      };

      const currentPayment = {
        ...mockPayment,
        status: "CANCELLED" as PaymentStatus,
      };

      mockPrismaService.payment.findFirst.mockResolvedValue(mockPayment);
      mockPrismaService.payment.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaService.payment.findUnique.mockResolvedValue(currentPayment);

      await expect(
        service.markPaid(paymentId, organizationId, markPaidDto),
      ).rejects.toThrow(PaymentInvalidStatusForMarkPaidException);
    });
  });

  describe("remove", () => {
    it("should delete payment successfully", async () => {
      const mockPayment = {
        id: "payment-1",
        organizationId: "org-1",
        status: PaymentStatus.PENDING,
      };

      mockPrismaService.payment.findFirst.mockResolvedValue(mockPayment);
      mockPrismaService.payment.delete.mockResolvedValue(mockPayment);

      await service.remove("payment-1", "org-1");

      expect(prisma.payment.delete).toHaveBeenCalledWith({
        where: { id: "payment-1" },
      });
    });

    it("should throw PaymentNotFoundException if not found", async () => {
      mockPrismaService.payment.findFirst.mockResolvedValue(null);

      await expect(service.remove("payment-1", "org-1")).rejects.toThrow(
        PaymentNotFoundException,
      );
    });
  });
});
