import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Organization, Prisma } from "@prisma/client";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { QueryOrganizationDto } from "./dto/query-organization.dto";
import { Paginated, createPaginatedResult } from "../../common/pagination";
import { ListQuery } from "../../common/query-parser";
import { OrganizationNotFoundException } from "../../common/errors/not-found.exception";
import { OrganizationCodeConflictException } from "../../common/errors/conflict.exception";

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrganizationDto): Promise<Organization> {
    try {
      return await this.prisma.organization.create({
        data: {
          name: dto.name,
          code: dto.code,
          description: dto.description,
          timezone: dto.timezone || "Asia/Shanghai",
          isActive: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new OrganizationCodeConflictException(dto.code);
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Organization> {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      throw new OrganizationNotFoundException(id);
    }

    return organization;
  }

  async findMany(
    listQuery: ListQuery,
    query: QueryOrganizationDto,
  ): Promise<Paginated<Organization>> {
    const { page, pageSize, sort, order } = listQuery;
    const { keyword, dateStart, dateEnd } = query;

    const where: Prisma.OrganizationWhereInput = {};
    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: "insensitive" } },
        { code: { contains: keyword, mode: "insensitive" } },
      ];
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

    const defaultOrder: Prisma.OrganizationOrderByWithRelationInput = {
      createdAt: "desc",
    };

    const orderBy = sort
      ? ({
          [sort]: order ?? "asc",
        } as Prisma.OrganizationOrderByWithRelationInput)
      : defaultOrder;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.organization.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
      }),
      this.prisma.organization.count({ where }),
    ]);

    return createPaginatedResult(items, total, page, pageSize);
  }

  async update(id: string, dto: UpdateOrganizationDto): Promise<Organization> {
    await this.findById(id);

    try {
      return await this.prisma.organization.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          timezone: dto.timezone,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new OrganizationNotFoundException(id);
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);

    await this.prisma.organization.delete({
      where: { id },
    });
  }
}
