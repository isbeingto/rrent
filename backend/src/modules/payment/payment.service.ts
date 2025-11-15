import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Payment, PaymentStatus, Prisma } from "@prisma/client";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { UpdatePaymentDto } from "./dto/update-payment.dto";
import { QueryPaymentDto } from "./dto/query-payment.dto";
import { MarkPaymentPaidDto } from "./dto/mark-payment-paid.dto";
import { Paginated, createPaginatedResult } from "../../common/pagination";
import { ListQuery } from "../../common/query-parser";
import {
  LeaseNotFoundException,
  PaymentNotFoundException,
} from "../../common/errors/not-found.exception";
import { CrossOrgAccessException } from "../../common/errors/forbidden.exception";
import { PaymentInvalidStatusForMarkPaidException } from "../../common/errors/payment.exception";
import { AuditLogService } from "../audit-log/audit-log.service";
import { AuditAction, AuditEntity } from "../audit-log/audit-event.enum";

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(dto: CreatePaymentDto): Promise<Payment> {
    const lease = await this.prisma.lease.findUnique({
      where: { id: dto.leaseId },
    });

    if (!lease) {
      throw new LeaseNotFoundException(dto.leaseId);
    }

    if (lease.organizationId !== dto.organizationId) {
      throw new CrossOrgAccessException(
        "Cannot access leases from another organization",
      );
    }

    return await this.prisma.payment.create({
      data: {
        organizationId: dto.organizationId,
        leaseId: dto.leaseId,
        type: dto.type,
        status: dto.status ?? PaymentStatus.PENDING,
        amount: dto.amount,
        currency: dto.currency ?? "CNY",
        dueDate: dto.dueDate,
        method: dto.method,
        paidAt: dto.paidAt,
        externalRef: dto.externalRef,
        notes: dto.notes,
      },
    });
  }

  async findById(id: string, organizationId: string): Promise<Payment> {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!payment) {
      throw new PaymentNotFoundException(id);
    }

    return payment;
  }

  async findMany(
    listQuery: ListQuery,
    query: QueryPaymentDto,
  ): Promise<Paginated<Payment>> {
    const { page, pageSize, sort, order } = listQuery;
    const { organizationId, leaseId, status, dueDateFrom, dueDateTo } = query;

    const where: Prisma.PaymentWhereInput = {
      organizationId,
    };

    if (leaseId) {
      where.leaseId = leaseId;
    }

    if (status) {
      where.status = status;
    }

    if (dueDateFrom || dueDateTo) {
      where.dueDate = {};
      if (dueDateFrom) {
        where.dueDate.gte = new Date(dueDateFrom);
      }
      if (dueDateTo) {
        where.dueDate.lte = new Date(dueDateTo);
      }
    }

    const defaultOrder: Prisma.PaymentOrderByWithRelationInput = {
      dueDate: "asc",
    };

    const orderBy = sort
      ? ({ [sort]: order ?? "asc" } as Prisma.PaymentOrderByWithRelationInput)
      : defaultOrder;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return createPaginatedResult(items, total, page, pageSize);
  }

  async update(
    id: string,
    organizationId: string,
    dto: UpdatePaymentDto,
  ): Promise<Payment> {
    await this.findById(id, organizationId);

    return await this.prisma.payment.update({
      where: { id },
      data: {
        status: dto.status,
        method: dto.method,
        paidAt: dto.paidAt,
        externalRef: dto.externalRef,
        notes: dto.notes,
      },
    });
  }

  async remove(id: string, organizationId: string): Promise<void> {
    await this.findById(id, organizationId);

    await this.prisma.payment.delete({
      where: { id },
    });
  }

  /**
   * 标记支付单为已支付
   *
   * 幂等性保证：
   * - 使用条件更新确保只有 PENDING/OVERDUE 状态可以转为 PAID
   * - 并发场景下，只有一个请求会成功，其他请求会抛出异常
   *
   * @param id 支付单 ID
   * @param organizationId 组织 ID
   * @param dto 标记支付 DTO（包含可选的 paidAt）
   * @returns 更新后的支付单
   * @throws PaymentNotFoundException 支付单不存在或跨组织访问
   * @throws PaymentInvalidStatusForMarkPaidException 支付单状态不允许标记已支付
   */
  async markPaid(
    id: string,
    organizationId: string,
    dto: MarkPaymentPaidDto,
  ): Promise<Payment> {
    // 1. 查询支付单并验证多租户隔离
    const payment = await this.prisma.payment.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!payment) {
      throw new PaymentNotFoundException(id);
    }

    // 2. 验证状态：仅允许从 PENDING 或 OVERDUE 标记为 PAID
    if (
      payment.status !== PaymentStatus.PENDING &&
      payment.status !== PaymentStatus.OVERDUE
    ) {
      throw new PaymentInvalidStatusForMarkPaidException(id, payment.status);
    }

    // 3. 使用条件更新（幂等性保证 - 只有 PENDING/OVERDUE 才能更新）
    const paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();

    // 使用 updateMany 进行条件更新，避免并发竞态
    const updateResult = await this.prisma.payment.updateMany({
      where: {
        id,
        status: {
          in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE],
        },
      },
      data: {
        status: PaymentStatus.PAID,
        paidAt,
      },
    });

    // 如果更新数为 0，说明状态已被其他请求修改
    if (updateResult.count === 0) {
      // 重新查询以获取当前状态
      const currentPayment = await this.prisma.payment.findUnique({
        where: { id },
      });

      if (currentPayment?.status === PaymentStatus.PAID) {
        // 如果已经是 PAID，说明是重复调用（幂等），返回当前状态
        // 注：这里选择返回而不是抛异常，根据业务需求可调整
        return currentPayment;
      }

      // 其他状态变化（例如被取消），抛出异常
      throw new PaymentInvalidStatusForMarkPaidException(
        id,
        currentPayment?.status || "UNKNOWN",
      );
    }

    // 4. 重新查询更新后的支付单
    const updatedPayment = await this.prisma.payment.findUniqueOrThrow({
      where: { id },
    });

    // 5. 写入审计日志
    await this.auditLogService.log(
      {
        organizationId,
        userId: undefined, // 可在 Controller 层传入
      },
      {
        entity: AuditEntity.PAYMENT,
        entityId: id,
        action: AuditAction.PAYMENT_MARK_PAID,
        metadata: {
          previousStatus: payment.status,
          paidAt: paidAt.toISOString(),
          amount: updatedPayment.amount.toString(),
          type: updatedPayment.type,
        },
      },
    );

    return updatedPayment;
  }
}
