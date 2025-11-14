import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { LeaseService } from "./lease.service";
import { CreateLeaseDto } from "./dto/create-lease.dto";
import { UpdateLeaseDto } from "./dto/update-lease.dto";
import { QueryLeaseDto } from "./dto/query-lease.dto";
import { Paginated } from "../../common/pagination";
import { Lease } from "@prisma/client";

@Controller("leases")
export class LeaseController {
  constructor(private readonly leaseService: LeaseService) {}

  @Get()
  async findAll(@Query() query: QueryLeaseDto): Promise<Paginated<Lease>> {
    return this.leaseService.findMany(query);
  }

  @Get(":id")
  async findOne(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Query("organizationId", new ParseUUIDPipe()) organizationId: string,
  ): Promise<Lease> {
    return this.leaseService.findById(id, organizationId);
  }

  @Post()
  async create(@Body() dto: CreateLeaseDto): Promise<Lease> {
    return this.leaseService.create(dto);
  }

  @Put(":id")
  async update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Query("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Body() dto: UpdateLeaseDto,
  ): Promise<Lease> {
    return this.leaseService.update(id, organizationId, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Query("organizationId", new ParseUUIDPipe()) organizationId: string,
  ): Promise<void> {
    await this.leaseService.remove(id, organizationId);
  }
}
