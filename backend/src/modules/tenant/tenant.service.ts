import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Tenant, Prisma } from "@prisma/client";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { UpdateTenantDto } from "./dto/update-tenant.dto";
import { QueryTenantDto } from "./dto/query-tenant.dto";
import { Paginated, createPaginatedResult } from "../../common/pagination";
import {
  OrganizationNotFoundException,
  TenantNotFoundException,
} from "../../common/errors/not-found.exception";
import {
  TenantEmailConflictException,
  TenantPhoneConflictException,
} from "../../common/errors/conflict.exception";

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTenantDto): Promise<Tenant> {
    await this.ensureOrganizationExists(dto.organizationId);

    try {
      return await this.prisma.tenant.create({
        data: {
          organizationId: dto.organizationId,
          fullName: dto.fullName,
          email: dto.email,
          phone: dto.phone,
          idNumber: dto.idNumber,
          notes: dto.notes,
          isActive: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw this.buildConflictException(error);
      }
      throw error;
    }
  }

  async findById(id: string, organizationId: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!tenant) {
      throw new TenantNotFoundException(id);
    }

    return tenant;
  }

  async findMany(query: QueryTenantDto): Promise<Paginated<Tenant>> {
    const { page = 1, limit = 20, organizationId, fullName, keyword } = query;

    const where: Prisma.TenantWhereInput = {
      organizationId,
    };

    const filters: Prisma.TenantWhereInput[] = [];

    if (fullName) {
      filters.push({
        fullName: { contains: fullName, mode: "insensitive" },
      });
    }

    if (keyword) {
      filters.push({
        OR: [
          { fullName: { contains: keyword, mode: "insensitive" } },
          { email: { contains: keyword, mode: "insensitive" } },
          { phone: { contains: keyword, mode: "insensitive" } },
        ],
      });
    }

    if (filters.length) {
      where.AND = filters;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.tenant.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return createPaginatedResult(items, total, page, limit);
  }

  async update(
    id: string,
    organizationId: string,
    dto: UpdateTenantDto,
  ): Promise<Tenant> {
    await this.findById(id, organizationId);

    try {
      return await this.prisma.tenant.update({
        where: { id },
        data: {
          fullName: dto.fullName,
          email: dto.email,
          phone: dto.phone,
          idNumber: dto.idNumber,
          notes: dto.notes,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw this.buildConflictException(error);
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new TenantNotFoundException(id);
      }
      throw error;
    }
  }

  async remove(id: string, organizationId: string): Promise<void> {
    await this.findById(id, organizationId);

    await this.prisma.tenant.delete({
      where: { id },
    });
  }

  private async ensureOrganizationExists(id: string): Promise<void> {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      throw new OrganizationNotFoundException(id);
    }
  }

  private buildConflictException(
    error: Prisma.PrismaClientKnownRequestError,
  ): Error {
    const fields = (error.meta?.target ?? []) as string[];
    if (fields.includes("email")) {
      return new TenantEmailConflictException("email");
    }
    if (fields.includes("phone")) {
      return new TenantPhoneConflictException("phone");
    }

    return new Error(
      "Tenant with the same identifier already exists in the organization",
    );
  }
}
