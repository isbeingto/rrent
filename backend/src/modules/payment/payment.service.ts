import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Payment, PaymentStatus, Prisma } from "@prisma/client";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { UpdatePaymentDto } from "./dto/update-payment.dto";
import { QueryPaymentDto } from "./dto/query-payment.dto";
import { Paginated, createPaginatedResult } from "../../common/pagination";
import {
  LeaseNotFoundException,
  PaymentNotFoundException,
} from "../../common/errors/not-found.exception";
import { CrossOrgAccessException } from "../../common/errors/forbidden.exception";

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

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
      where.dueDate = {};
      if (dueDateFrom) {
        where.dueDate.gte = new Date(dueDateFrom);
      }
      if (dueDateTo) {
        where.dueDate.lte = new Date(dueDateTo);
      }
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
}
