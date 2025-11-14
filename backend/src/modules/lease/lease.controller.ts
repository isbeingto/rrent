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
  UseGuards,
} from "@nestjs/common";
import { LeaseService } from "./lease.service";
import { CreateLeaseDto } from "./dto/create-lease.dto";
import { UpdateLeaseDto } from "./dto/update-lease.dto";
import { QueryLeaseDto } from "./dto/query-lease.dto";
import { Paginated } from "../../common/pagination";
import { Lease } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { OrgRole } from "@prisma/client";

@Controller("leases")
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaseController {
  constructor(private readonly leaseService: LeaseService) {}

  @Get()
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR, OrgRole.OPERATOR, OrgRole.STAFF)
  async findAll(@Query() query: QueryLeaseDto): Promise<Paginated<Lease>> {
    return this.leaseService.findMany(query);
  }

  @Get(":id")
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR, OrgRole.OPERATOR, OrgRole.STAFF)
  async findOne(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Query("organizationId", new ParseUUIDPipe()) organizationId: string,
  ): Promise<Lease> {
    return this.leaseService.findById(id, organizationId);
  }

  @Post()
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR, OrgRole.OPERATOR)
  async create(@Body() dto: CreateLeaseDto): Promise<Lease> {
    return this.leaseService.create(dto);
  }

  @Put(":id")
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR, OrgRole.OPERATOR)
  async update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Query("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Body() dto: UpdateLeaseDto,
  ): Promise<Lease> {
    return this.leaseService.update(id, organizationId, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR)
  async remove(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Query("organizationId", new ParseUUIDPipe()) organizationId: string,
  ): Promise<void> {
    await this.leaseService.remove(id, organizationId);
  }
}
