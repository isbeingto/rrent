import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Payment, Prisma, PaymentStatus } from "@prisma/client";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { UpdatePaymentDto } from "./dto/update-payment.dto";
import { QueryPaymentDto } from "./dto/query-payment.dto";
import { Paginated, createPaginatedResult } from "../../common/pagination";

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePaymentDto): Promise<Payment> {
    await this.ensureOrganizationExists(dto.organizationId);
    await this.ensureLeaseBelongsToOrganization(
      dto.leaseId,
      dto.organizationId,
    );

    return this.prisma.payment.create({
      data: {
        organizationId: dto.organizationId,
        leaseId: dto.leaseId,
        type: dto.type,
        status: dto.status ?? PaymentStatus.PENDING,
        method: dto.method,
        amount: dto.amount,
        currency: dto.currency ?? "CNY",
        dueDate: new Date(dto.dueDate),
        paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
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
      throw new NotFoundException(
        `Payment with id "${id}" not found in organization "${organizationId}"`,
      );
    }

    return payment;
  }

  async findMany(query: QueryPaymentDto): Promise<Paginated<Payment>> {
    const {
      page = 1,
      limit = 20,
      organizationId,
      leaseId,
      status,
      dueDateFrom,
      dueDateTo,
    } = query;

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
      const dueDateFilter: Prisma.DateTimeFilter = {};

      if (dueDateFrom) {
        dueDateFilter.gte = new Date(dueDateFrom);
      }

      if (dueDateTo) {
        dueDateFilter.lte = new Date(dueDateTo);
      }

      where.dueDate = dueDateFilter;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { dueDate: "asc" },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return createPaginatedResult(items, total, page, limit);
  }

  async update(
    id: string,
    organizationId: string,
    dto: UpdatePaymentDto,
  ): Promise<Payment> {
    await this.findById(id, organizationId);

    return this.prisma.payment.update({
      where: { id },
      data: {
        status: dto.status,
        method: dto.method,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
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

  private async ensureOrganizationExists(id: string): Promise<void> {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with id "${id}" not found`);
    }
  }

  private async ensureLeaseBelongsToOrganization(
    leaseId: string,
    organizationId: string,
  ): Promise<void> {
    const lease = await this.prisma.lease.findUnique({
      where: { id: leaseId },
    });

    if (!lease || lease.organizationId !== organizationId) {
      throw new NotFoundException(
        `Lease with id "${leaseId}" not found in organization "${organizationId}"`,
      );
    }
  }
}
