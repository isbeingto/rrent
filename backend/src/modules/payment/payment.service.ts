import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Payment, Prisma } from "@prisma/client";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { UpdatePaymentDto } from "./dto/update-payment.dto";
import { QueryPaymentDto } from "./dto/query-payment.dto";
import { Paginated, createPaginatedResult } from "../../common/pagination";
import {
  LeaseNotFoundException,
  PaymentNotFoundException,
} from "../../common/errors/not-found.exception";

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePaymentDto): Promise<Payment> {
    // Validate lease exists and belongs to organization
    const lease = await this.prisma.lease.findFirst({
      where: {
        id: dto.leaseId,
        organizationId: dto.organizationId,
      },
    });

    if (!lease) {
      throw new LeaseNotFoundException(dto.leaseId);
    }

    return await this.prisma.payment.create({
      data: {
        organizationId: dto.organizationId,
        leaseId: dto.leaseId,
        type: dto.type,
        status: dto.status,
        amount: dto.amount,
        currency: dto.currency,
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
    const { page = 1, limit = 20, organizationId, status } = query;

    const where: Prisma.PaymentWhereInput = {
      organizationId,
    };

    if (status) {
      where.status = status;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
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
