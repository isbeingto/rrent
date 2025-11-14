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
import { UnitService } from "./unit.service";
import { QueryUnitDto } from "./dto/query-unit.dto";
import { CreateUnitDto } from "./dto/create-unit.dto";
import { UpdateUnitDto } from "./dto/update-unit.dto";
import { Unit } from "@prisma/client";
import { Paginated } from "../../common/pagination";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { OrgRole } from "@prisma/client";

@Controller("units")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UnitController {
  constructor(private readonly unitService: UnitService) {}

  @Get()
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR, OrgRole.OPERATOR, OrgRole.STAFF)
  async findAll(@Query() query: QueryUnitDto): Promise<Paginated<Unit>> {
    return this.unitService.findMany(query);
  }

  @Get(":id")
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR, OrgRole.OPERATOR, OrgRole.STAFF)
  async findOne(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Query("organizationId", new ParseUUIDPipe()) organizationId: string,
  ): Promise<Unit> {
    return this.unitService.findById(id, organizationId);
  }

  @Post()
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR, OrgRole.OPERATOR)
  async create(
    @Query("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Body() dto: CreateUnitDto,
  ): Promise<Unit> {
    return this.unitService.create(dto, organizationId);
  }

  @Put(":id")
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR, OrgRole.OPERATOR)
  async update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Query("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Body() dto: UpdateUnitDto,
  ): Promise<Unit> {
    return this.unitService.update(id, organizationId, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR)
  async remove(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Query("organizationId", new ParseUUIDPipe()) organizationId: string,
  ): Promise<void> {
    await this.unitService.remove(id, organizationId);
  }
}
