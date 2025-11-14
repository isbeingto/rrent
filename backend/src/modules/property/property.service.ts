import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Property, Prisma } from "@prisma/client";
import { CreatePropertyDto } from "./dto/create-property.dto";
import { UpdatePropertyDto } from "./dto/update-property.dto";
import { QueryPropertyDto } from "./dto/query-property.dto";
import { Paginated, createPaginatedResult } from "../../common/pagination";
import {
  OrganizationNotFoundException,
  PropertyNotFoundException,
} from "../../common/errors/not-found.exception";
import { PropertyCodeConflictException } from "../../common/errors/conflict.exception";

@Injectable()
export class PropertyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePropertyDto): Promise<Property> {
    // Validate organization exists
    const org = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId },
    });

    if (!org) {
      throw new OrganizationNotFoundException(dto.organizationId);
    }

    try {
      return await this.prisma.property.create({
        data: {
          organizationId: dto.organizationId,
          name: dto.name,
          code: dto.code,
          description: dto.description,
          addressLine1: dto.addressLine1,
          addressLine2: dto.addressLine2,
          city: dto.city,
          state: dto.state,
          postalCode: dto.postalCode,
          country: dto.country,
          isActive: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new PropertyCodeConflictException(dto.code);
      }
      throw error;
    }
  }

  async findById(id: string, organizationId: string): Promise<Property> {
    const property = await this.prisma.property.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!property) {
      throw new PropertyNotFoundException(id);
    }

    return property;
  }

  async findMany(query: QueryPropertyDto): Promise<Paginated<Property>> {
    const {
      page = 1,
      limit = 20,
      organizationId,
      propertyId,
      keyword,
      city,
    } = query;

    const where: Prisma.PropertyWhereInput = {};

    if (organizationId) {
      where.organizationId = organizationId;
    }

    if (propertyId) {
      where.id = propertyId;
    }

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: "insensitive" } },
        { code: { contains: keyword, mode: "insensitive" } },
      ];
    }

    if (city) {
      where.city = { contains: city, mode: "insensitive" };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.property.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.property.count({ where }),
    ]);

    return createPaginatedResult(items, total, page, limit);
  }

  async update(
    id: string,
    organizationId: string,
    dto: UpdatePropertyDto,
  ): Promise<Property> {
    await this.findById(id, organizationId);

    try {
      return await this.prisma.property.update({
        where: { id },
        data: {
          name: dto.name,
          code: dto.code,
          description: dto.description,
          addressLine1: dto.addressLine1,
          addressLine2: dto.addressLine2,
          city: dto.city,
          state: dto.state,
          postalCode: dto.postalCode,
          country: dto.country,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new PropertyCodeConflictException(dto.code!);
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new PropertyNotFoundException(id);
      }
      throw error;
    }
  }

  async remove(id: string, organizationId: string): Promise<void> {
    await this.findById(id, organizationId);

    await this.prisma.property.delete({
      where: { id },
    });
  }
}
