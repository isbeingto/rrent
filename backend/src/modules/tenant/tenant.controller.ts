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
import { TenantService } from "./tenant.service";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { UpdateTenantDto } from "./dto/update-tenant.dto";
import { QueryTenantDto } from "./dto/query-tenant.dto";
import { Paginated } from "../../common/pagination";
import { Tenant } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { OrgRole } from "@prisma/client";

@Controller("tenants")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR, OrgRole.OPERATOR, OrgRole.STAFF)
  async findAll(@Query() query: QueryTenantDto): Promise<Paginated<Tenant>> {
    return this.tenantService.findMany(query);
  }

  @Get(":id")
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR, OrgRole.OPERATOR, OrgRole.STAFF)
  async findOne(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Query("organizationId", new ParseUUIDPipe()) organizationId: string,
  ): Promise<Tenant> {
    return this.tenantService.findById(id, organizationId);
  }

  @Post()
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR, OrgRole.OPERATOR)
  async create(@Body() dto: CreateTenantDto): Promise<Tenant> {
    return this.tenantService.create(dto);
  }

  @Put(":id")
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR, OrgRole.OPERATOR)
  async update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Query("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Body() dto: UpdateTenantDto,
  ): Promise<Tenant> {
    return this.tenantService.update(id, organizationId, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR)
  async remove(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Query("organizationId", new ParseUUIDPipe()) organizationId: string,
  ): Promise<void> {
    await this.tenantService.remove(id, organizationId);
  }
}
