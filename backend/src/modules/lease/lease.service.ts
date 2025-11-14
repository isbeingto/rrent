import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Lease, Prisma, LeaseStatus } from "@prisma/client";
import { CreateLeaseDto } from "./dto/create-lease.dto";
import { UpdateLeaseDto } from "./dto/update-lease.dto";
import { QueryLeaseDto } from "./dto/query-lease.dto";
import { Paginated, createPaginatedResult } from "../../common/pagination";

@Injectable()
export class LeaseService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLeaseDto): Promise<Lease> {
    await this.ensureOrganizationExists(dto.organizationId);
    await this.ensurePropertyBelongsToOrganization(
      dto.propertyId,
      dto.organizationId,
    );
    await this.ensureUnitBelongsToProperty(dto.unitId, dto.propertyId);
    await this.ensureTenantBelongsToOrganization(
      dto.tenantId,
      dto.organizationId,
    );

    return this.prisma.lease.create({
      data: {
        organizationId: dto.organizationId,
        propertyId: dto.propertyId,
        unitId: dto.unitId,
        tenantId: dto.tenantId,
        status: dto.status ?? LeaseStatus.PENDING,
        billCycle: dto.billCycle,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
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
      throw new NotFoundException(
        `Lease with id "${id}" not found in organization "${organizationId}"`,
      );
    }

    return lease;
  }

  async findMany(query: QueryLeaseDto): Promise<Paginated<Lease>> {
    const {
      page = 1,
      limit = 20,
      organizationId,
      propertyId,
      unitId,
      tenantId,
      status,
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

    const [items, total] = await this.prisma.$transaction([
      this.prisma.lease.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startDate: "desc" },
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

    return this.prisma.lease.update({
      where: { id },
      data: {
        status: dto.status,
        billCycle: dto.billCycle,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        rentAmount: dto.rentAmount,
        depositAmount: dto.depositAmount,
        currency: dto.currency,
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

  private async ensureOrganizationExists(id: string): Promise<void> {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with id "${id}" not found`);
    }
  }

  private async ensurePropertyBelongsToOrganization(
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
      throw new NotFoundException(
        `Property with id "${propertyId}" not found in organization "${organizationId}"`,
      );
    }
  }

  private async ensureUnitBelongsToProperty(
    unitId: string,
    propertyId: string,
  ): Promise<void> {
    const unit = await this.prisma.unit.findFirst({
      where: {
        id: unitId,
        propertyId,
      },
    });

    if (!unit) {
      throw new NotFoundException(
        `Unit with id "${unitId}" not found in property "${propertyId}"`,
      );
    }
  }

  private async ensureTenantBelongsToOrganization(
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
      throw new NotFoundException(
        `Tenant with id "${tenantId}" not found in organization "${organizationId}"`,
      );
    }
  }
}
