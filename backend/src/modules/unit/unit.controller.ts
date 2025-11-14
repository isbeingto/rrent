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
import { UnitService } from "./unit.service";
import { QueryUnitDto } from "./dto/query-unit.dto";
import { CreateUnitDto } from "./dto/create-unit.dto";
import { UpdateUnitDto } from "./dto/update-unit.dto";
import { Unit } from "@prisma/client";
import { Paginated } from "../../common/pagination";

@Controller("units")
export class UnitController {
  constructor(private readonly unitService: UnitService) {}

  @Get()
  async findAll(@Query() query: QueryUnitDto): Promise<Paginated<Unit>> {
    return this.unitService.findMany(query);
  }

  @Get(":id")
  async findOne(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Query("organizationId", new ParseUUIDPipe()) organizationId: string,
  ): Promise<Unit> {
    return this.unitService.findById(id, organizationId);
  }

  @Post()
  async create(
    @Query("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Body() dto: CreateUnitDto,
  ): Promise<Unit> {
    return this.unitService.create(dto, organizationId);
  }

  @Put(":id")
  async update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Query("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Body() dto: UpdateUnitDto,
  ): Promise<Unit> {
    return this.unitService.update(id, organizationId, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Query("organizationId", new ParseUUIDPipe()) organizationId: string,
  ): Promise<void> {
    await this.unitService.remove(id, organizationId);
  }
}
