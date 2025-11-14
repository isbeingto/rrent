import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Unit, Prisma, UnitStatus } from "@prisma/client";
import { CreateUnitDto } from "./dto/create-unit.dto";
import { UpdateUnitDto } from "./dto/update-unit.dto";
import { QueryUnitDto } from "./dto/query-unit.dto";
import { Paginated, createPaginatedResult } from "../../common/pagination";
import {
  PropertyNotFoundException,
  UnitNotFoundException,
} from "../../common/errors/not-found.exception";
import { UnitNumberConflictException } from "../../common/errors/conflict.exception";

@Injectable()
export class UnitService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUnitDto, organizationId: string): Promise<Unit> {
    // Validate property exists and belongs to organization
    const property = await this.prisma.property.findFirst({
      where: {
        id: dto.propertyId,
        organizationId,
      },
    });

    if (!property) {
      throw new PropertyNotFoundException(dto.propertyId);
    }

    try {
      return await this.prisma.unit.create({
        data: {
          propertyId: dto.propertyId,
          name: dto.name,
          unitNumber: dto.unitNumber,
          floor: dto.floor,
          bedrooms: dto.bedrooms,
          bathrooms: dto.bathrooms,
          areaSqm: dto.areaSqm,
          status: dto.status || UnitStatus.VACANT,
          isActive: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new UnitNumberConflictException(dto.unitNumber!);
      }
      throw error;
    }
  }

  async findById(id: string, organizationId: string): Promise<Unit> {
    const unit = await this.prisma.unit.findFirst({
      where: {
        id,
        property: {
          organizationId,
        },
      },
      include: {
        property: true,
      },
    });

    if (!unit) {
      throw new UnitNotFoundException(id);
    }

    return unit;
  }

  async findMany(query: QueryUnitDto): Promise<Paginated<Unit>> {
    const {
      page = 1,
      limit = 20,
      organizationId,
      propertyId,
      status,
      keyword,
    } = query;

    const where: Prisma.UnitWhereInput = {
      property: {
        organizationId,
      },
    };

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (status) {
      where.status = status;
    }

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: "insensitive" } },
        { unitNumber: { contains: keyword, mode: "insensitive" } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.unit.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.unit.count({ where }),
    ]);

    return createPaginatedResult(items, total, page, limit);
  }

  async update(
    id: string,
    organizationId: string,
    dto: UpdateUnitDto,
  ): Promise<Unit> {
    await this.findById(id, organizationId);

    try {
      return await this.prisma.unit.update({
        where: { id },
        data: {
          name: dto.name,
          unitNumber: dto.unitNumber,
          floor: dto.floor,
          bedrooms: dto.bedrooms,
          bathrooms: dto.bathrooms,
          areaSqm: dto.areaSqm,
          status: dto.status,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new UnitNumberConflictException(dto.unitNumber!);
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new UnitNotFoundException(id);
      }
      throw error;
    }
  }

  async remove(id: string, organizationId: string): Promise<void> {
    await this.findById(id, organizationId);

    await this.prisma.unit.delete({
      where: { id },
    });
  }

  async findActiveById(id: string, organizationId: string): Promise<Unit> {
    const unit = await this.findById(id, organizationId);

    if (!unit.isActive) {
      throw new UnitNotFoundException(id);
    }

    return unit;
  }
}
