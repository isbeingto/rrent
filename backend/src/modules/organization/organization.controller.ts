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
  Res,
  UseGuards,
} from "@nestjs/common";
import { Response } from "express";
import { OrganizationService } from "./organization.service";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { QueryOrganizationDto } from "./dto/query-organization.dto";
import { Organization } from "@prisma/client";
import { Paginated } from "../../common/pagination";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { OrgRole } from "@prisma/client";
import { parseListQuery } from "../../common/query-parser";

@Controller("organizations")
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get()
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR)
  async findAll(
    @Query() query: QueryOrganizationDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Paginated<Organization>> {
    const listQuery = parseListQuery(
      query as unknown as Record<string, unknown>,
    );
    const result = await this.organizationService.findMany(listQuery, query);
    res.setHeader('X-Total-Count', result.meta.total.toString());
    return result;
  }

  @Get(":id")
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR)
  async findOne(
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<Organization> {
    return this.organizationService.findById(id);
  }

  @Post()
  @Roles(OrgRole.OWNER)
  async create(@Body() dto: CreateOrganizationDto): Promise<Organization> {
    return this.organizationService.create(dto);
  }

  @Put(":id")
  @Roles(OrgRole.OWNER)
  async update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateOrganizationDto,
  ): Promise<Organization> {
    return this.organizationService.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(OrgRole.OWNER)
  async remove(@Param("id", new ParseUUIDPipe()) id: string): Promise<void> {
    await this.organizationService.remove(id);
  }
}
