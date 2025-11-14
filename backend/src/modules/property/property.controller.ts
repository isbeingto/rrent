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
import { PropertyService } from "./property.service";
import { CreatePropertyDto } from "./dto/create-property.dto";
import { UpdatePropertyDto } from "./dto/update-property.dto";
import { QueryPropertyDto } from "./dto/query-property.dto";
import { Property } from "@prisma/client";
import { Paginated } from "../../common/pagination";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { OrgRole } from "@prisma/client";

@Controller("properties")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Get()
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR, OrgRole.OPERATOR, OrgRole.STAFF)
  async findAll(
    @Query() query: QueryPropertyDto,
  ): Promise<Paginated<Property>> {
    return this.propertyService.findMany(query);
  }

  @Get(":id")
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR, OrgRole.OPERATOR, OrgRole.STAFF)
  async findOne(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Query("organizationId", new ParseUUIDPipe()) organizationId: string,
  ): Promise<Property> {
    return this.propertyService.findById(id, organizationId);
  }

  @Post()
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR, OrgRole.OPERATOR)
  async create(@Body() dto: CreatePropertyDto): Promise<Property> {
    return this.propertyService.create(dto);
  }

  @Put(":id")
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR, OrgRole.OPERATOR)
  async update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Query("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Body() dto: UpdatePropertyDto,
  ): Promise<Property> {
    return this.propertyService.update(id, organizationId, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR)
  async remove(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Query("organizationId", new ParseUUIDPipe()) organizationId: string,
  ): Promise<void> {
    await this.propertyService.remove(id, organizationId);
  }
}
