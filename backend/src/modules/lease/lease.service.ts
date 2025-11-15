import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  Lease,
  LeaseStatus,
  Prisma,
  Payment,
  BillType,
  PaymentStatus,
  BillCycle,
  UnitStatus,
} from "@prisma/client";
import { CreateLeaseDto } from "./dto/create-lease.dto";
import { UpdateLeaseDto } from "./dto/update-lease.dto";
import { QueryLeaseDto } from "./dto/query-lease.dto";
import { Paginated, createPaginatedResult } from "../../common/pagination";
import { ListQuery } from "../../common/query-parser";
import {
  OrganizationNotFoundException,
  LeaseNotFoundException,
  PropertyNotFoundException,
  UnitNotFoundException,
  TenantNotFoundException,
} from "../../common/errors/not-found.exception";
import { InvalidRelationException } from "../../common/errors/forbidden.exception";
import {
  LeaseAlreadyActiveException,
  LeaseInvalidStatusException,
  UnitNotVacantException,
} from "../../common/errors/lease-activation.exception";
import { ActivateLeaseResult } from "./dto/activate-lease-result.dto";
import { AuditLogService } from "../audit-log/audit-log.service";
import { AuditAction, AuditEntity } from "../audit-log/audit-event.enum";

/**
 * 租约激活配置选项
 */
export interface ActivateLeaseOptions {
  generateDepositPayment?: boolean;
}

@Injectable()
export class LeaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(dto: CreateLeaseDto): Promise<Lease> {
    await this.ensureOrganizationExists(dto.organizationId);
    await this.ensurePropertyInOrganization(dto.propertyId, dto.organizationId);
    await this.ensureUnitInProperty(dto.unitId, dto.propertyId);
    await this.ensureTenantInOrganization(dto.tenantId, dto.organizationId);

    return await this.prisma.lease.create({
      data: {
        organizationId: dto.organizationId,
        propertyId: dto.propertyId,
        unitId: dto.unitId,
        tenantId: dto.tenantId,
        status: dto.status ?? LeaseStatus.PENDING,
        billCycle: dto.billCycle,
        startDate: dto.startDate,
        endDate: dto.endDate,
        rentAmount: dto.rentAmount,
        depositAmount: dto.depositAmount,
        currency: dto.currency ?? "CNY",
        notes: dto.notes,
      },
    });
  }

  async findById(id: string, organizationId: string): Promise<Lease> {
    const lease = await this.prisma.lease.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!lease) {
      throw new LeaseNotFoundException(id);
    }

    return lease;
  }

  async findMany(
    listQuery: ListQuery,
    query: QueryLeaseDto,
  ): Promise<Paginated<Lease>> {
    const { page, pageSize, sort, order } = listQuery;
    const {
      organizationId,
      propertyId,
      unitId,
      tenantId,
      status,
      dateStart,
      dateEnd,
    } = query;

    const where: Prisma.LeaseWhereInput = {
      organizationId,
    };

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (unitId) {
      where.unitId = unitId;
    }

    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (status) {
      where.status = status;
    }

    if (dateStart || dateEnd) {
      where.createdAt = {};
      if (dateStart) {
        where.createdAt.gte = new Date(dateStart);
      }
      if (dateEnd) {
        where.createdAt.lte = new Date(dateEnd);
      }
    }

    const defaultOrder: Prisma.LeaseOrderByWithRelationInput = {
      createdAt: "desc",
    };

    const orderBy = sort
      ? ({ [sort]: order ?? "asc" } as Prisma.LeaseOrderByWithRelationInput)
      : defaultOrder;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.lease.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
      }),
      this.prisma.lease.count({ where }),
    ]);

    return createPaginatedResult(items, total, page, pageSize);
  }

  async update(
    id: string,
    organizationId: string,
    dto: UpdateLeaseDto,
  ): Promise<Lease> {
    await this.findById(id, organizationId);

    return await this.prisma.lease.update({
      where: { id },
      data: {
        status: dto.status,
        billCycle: dto.billCycle,
        endDate: dto.endDate,
        rentAmount: dto.rentAmount,
        depositAmount: dto.depositAmount,
        notes: dto.notes,
      },
    });
  }

  async remove(id: string, organizationId: string): Promise<void> {
    await this.findById(id, organizationId);

    await this.prisma.lease.delete({
      where: { id },
    });
  }

  /**
   * 激活租约（事务）
   *
   * 在单一事务中：
   * 1. 验证租约状态与房源状态
   * 2. 更新租约状态为 ACTIVE
   * 3. 更新房源状态为 OCCUPIED
   * 4. 根据租约配置生成账单（租金 + 押金）
   *
   * @param organizationId 当前组织 ID
   * @param leaseId 要激活的租约 ID
   * @param options 激活选项（默认生成押金账单）
   * @returns 激活结果，包含更新后的租约、房源和生成的账单列表
   * @throws 若租约已激活、状态非法、房源不空闲或跨组织访问
   */
  async activateLease(
    organizationId: string,
    leaseId: string,
    options: ActivateLeaseOptions = {},
  ): Promise<ActivateLeaseResult> {
    const { generateDepositPayment = true } = options;

    return await this.prisma.$transaction(async (tx) => {
      // 1. 查询并锁定租约（防止条件被篡改）
      const lease = await tx.lease.findFirst({
        where: {
          id: leaseId,
          organizationId,
        },
        include: {
          unit: true,
        },
      });

      // 租约不存在或跨组织访问
      if (!lease) {
        throw new LeaseNotFoundException(leaseId);
      }

      // 2. 验证租约状态：仅允许 PENDING 状态激活
      if (lease.status === LeaseStatus.ACTIVE) {
        throw new LeaseAlreadyActiveException(leaseId);
      }

      if (lease.status !== LeaseStatus.PENDING) {
        throw new LeaseInvalidStatusException(leaseId, lease.status);
      }

      // 3. 加载房源并验证状态
      const unit = lease.unit;
      if (!unit) {
        throw new UnitNotFoundException(lease.unitId);
      }

      if (
        unit.status !== UnitStatus.VACANT &&
        unit.status !== UnitStatus.RESERVED
      ) {
        throw new UnitNotVacantException(unit.id, unit.status);
      }

      // 4. 使用条件更新租约状态（幂等性保证 - 只有 PENDING 才能更新）
      // 这样即使并发调用，数据库层面也能保证只有一次成功
      const updateResult = await tx.lease.updateMany({
        where: {
          id: leaseId,
          status: LeaseStatus.PENDING, // 额外的状态检查
        },
        data: {
          status: LeaseStatus.ACTIVE,
        },
      });

      // 如果更新数为 0，说明状态已被其他事务修改
      if (updateResult.count === 0) {
        throw new LeaseAlreadyActiveException(leaseId);
      }

      // 重新查询更新后的租约
      const updatedLease = await tx.lease.findUniqueOrThrow({
        where: { id: leaseId },
      });

      // 5. 更新房源状态为 OCCUPIED
      const updatedUnit = await tx.unit.update({
        where: { id: lease.unitId },
        data: {
          status: UnitStatus.OCCUPIED,
        },
      });

      // 6. 生成账单（Payment）
      const payments: Payment[] = [];

      // 6.1 生成租金账单
      const rentPayments = this.generateRentPayments(lease);
      for (const paymentData of rentPayments) {
        const payment = await tx.payment.create({
          data: {
            organizationId,
            leaseId,
            type: BillType.RENT,
            status: PaymentStatus.PENDING,
            amount: lease.rentAmount,
            currency: lease.currency,
            dueDate: paymentData.dueDate,
          },
        });
        payments.push(payment);
      }

      // 6.2 生成押金账单（如果配置启用且押金金额 > 0）
      if (
        generateDepositPayment &&
        lease.depositAmount &&
        lease.depositAmount.toNumber() > 0
      ) {
        const depositPayment = await tx.payment.create({
          data: {
            organizationId,
            leaseId,
            type: BillType.DEPOSIT,
            status: PaymentStatus.PENDING,
            amount: lease.depositAmount,
            currency: lease.currency,
            dueDate: new Date(lease.startDate),
          },
        });
        payments.push(depositPayment);
      }

      // 7. 写入审计日志（在事务成功后）
      await this.auditLogService.log(
        {
          organizationId,
          userId: undefined, // 可在 Controller 层传入
        },
        {
          entity: AuditEntity.LEASE,
          entityId: leaseId,
          action: AuditAction.LEASE_ACTIVATED,
          metadata: {
            unitId: updatedUnit.id,
            unitStatus: updatedUnit.status,
            paymentsGenerated: payments.length,
            rentPayments: payments.filter((p) => p.type === BillType.RENT)
              .length,
            depositPayments: payments.filter((p) => p.type === BillType.DEPOSIT)
              .length,
          },
        },
      );

      return {
        lease: updatedLease,
        unit: updatedUnit,
        payments,
      };
    });
  }

  /**
   * 生成租金账单
   *
   * 根据租约的账单周期从开始日期滚动生成到结束日期或最近一期
   *
   * @param lease 租约信息
   * @returns 账单数据列表（包含 dueDate）
   */
  private generateRentPayments(lease: Lease): Array<{ dueDate: Date }> {
    const payments: Array<{ dueDate: Date }> = [];
    const startDate = new Date(lease.startDate);
    const endDate = lease.endDate ? new Date(lease.endDate) : null;

    let currentDueDate = new Date(startDate);

    // 根据账单周期计算每期的到期日期
    while (!endDate || currentDueDate <= endDate) {
      payments.push({ dueDate: new Date(currentDueDate) });

      // 计算下一期账单日期
      switch (lease.billCycle) {
        case BillCycle.MONTHLY:
          currentDueDate = new Date(
            currentDueDate.getFullYear(),
            currentDueDate.getMonth() + 1,
            currentDueDate.getDate(),
          );
          break;
        case BillCycle.QUARTERLY:
          currentDueDate = new Date(
            currentDueDate.getFullYear(),
            currentDueDate.getMonth() + 3,
            currentDueDate.getDate(),
          );
          break;
        case BillCycle.YEARLY:
          currentDueDate = new Date(
            currentDueDate.getFullYear() + 1,
            currentDueDate.getMonth(),
            currentDueDate.getDate(),
          );
          break;
        case BillCycle.ONE_TIME:
          // 一次性账单，只生成一条
          currentDueDate = endDate || new Date(9999, 11, 31);
          break;
      }
    }

    return payments;
  }

  private async ensureOrganizationExists(
    organizationId: string,
  ): Promise<void> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new OrganizationNotFoundException(organizationId);
    }
  }

  private async ensurePropertyInOrganization(
    propertyId: string,
    organizationId: string,
  ): Promise<void> {
    const property = await this.prisma.property.findFirst({
      where: {
        id: propertyId,
        organizationId,
      },
    });

    if (!property) {
      throw new PropertyNotFoundException(propertyId);
    }
  }

  private async ensureUnitInProperty(
    unitId: string,
    propertyId: string,
  ): Promise<void> {
    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
    });

    if (!unit) {
      throw new UnitNotFoundException(unitId);
    }

    if (unit.propertyId !== propertyId) {
      throw new InvalidRelationException(
        `Unit "${unitId}" does not belong to property "${propertyId}"`,
      );
    }
  }

  private async ensureTenantInOrganization(
    tenantId: string,
    organizationId: string,
  ): Promise<void> {
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        id: tenantId,
        organizationId,
      },
    });

    if (!tenant) {
      throw new TenantNotFoundException(tenantId);
    }
  }
}
