import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Lease, Prisma } from "@prisma/client";
import { CreateLeaseDto } from "./dto/create-lease.dto";
import { UpdateLeaseDto } from "./dto/update-lease.dto";
import { QueryLeaseDto } from "./dto/query-lease.dto";
import { Paginated, createPaginatedResult } from "../../common/pagination";
import {
  OrganizationNotFoundException,
  LeaseNotFoundException,
} from "../../common/errors/not-found.exception";

@Injectable()
export class LeaseService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLeaseDto): Promise<Lease> {
    // Validate organization exists
    const org = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId },
    });

    if (!org) {
      throw new OrganizationNotFoundException(dto.organizationId);
    }

    return await this.prisma.lease.create({
      data: {
        organizationId: dto.organizationId,
        propertyId: dto.propertyId,
        unitId: dto.unitId,
        tenantId: dto.tenantId,
        status: dto.status,
        billCycle: dto.billCycle,
        startDate: dto.startDate,
        endDate: dto.endDate,
        rentAmount: dto.rentAmount,
        depositAmount: dto.depositAmount,
        currency: dto.currency,
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

  async findMany(query: QueryLeaseDto): Promise<Paginated<Lease>> {
    const { page = 1, limit = 20, organizationId, status } = query;

    const where: Prisma.LeaseWhereInput = {
      organizationId,
    };

    if (status) {
      where.status = status;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.lease.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.lease.count({ where }),
    ]);

    return createPaginatedResult(items, total, page, limit);
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
}
