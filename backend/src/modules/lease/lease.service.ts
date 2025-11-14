import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Lease, LeaseStatus, Prisma } from "@prisma/client";
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

@Injectable()
export class LeaseService {
  constructor(private readonly prisma: PrismaService) {}

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
    const { organizationId, propertyId, unitId, tenantId, status, dateStart, dateEnd } = query;

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
