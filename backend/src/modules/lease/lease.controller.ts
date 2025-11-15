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
  Request,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Response } from "express";
import { LeaseService } from "./lease.service";
import { CreateLeaseDto } from "./dto/create-lease.dto";
import { UpdateLeaseDto } from "./dto/update-lease.dto";
import { QueryLeaseDto } from "./dto/query-lease.dto";
import { ActivateLeaseDto } from "./dto/activate-lease.dto";
import { ActivateLeaseResult } from "./dto/activate-lease-result.dto";
import { Paginated } from "../../common/pagination";
import { Lease } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { OrgRole } from "@prisma/client";
import { parseListQuery } from "../../common/query-parser";

interface JwtPayload {
  userId: string;
  organizationId: string;
  role: string;
}

@Controller("leases")
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaseController {
  constructor(private readonly leaseService: LeaseService) {}

  @Get()
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR, OrgRole.OPERATOR, OrgRole.STAFF)
  async findAll(
    @Query() query: QueryLeaseDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Paginated<Lease>> {
    const listQuery = parseListQuery(
      query as unknown as Record<string, unknown>,
    );
    const result = await this.leaseService.findMany(listQuery, query);
    res.setHeader("X-Total-Count", result.meta.total.toString());
    return result;
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

  /**
   * 激活租约
   *
   * 将指定租约从「待激活」状态切换为 ACTIVE，同步更新对应房源 Unit.status=OCCUPIED，
   * 并按租约配置批量生成账单 Payment（租金 + 押金）。
   *
   * @param id 租约 ID（Path param）
   * @param request 包含用户信息的请求对象
   * @param body 激活配置（可选：generateDepositPayment）
   * @returns 激活结果：租约、房源、生成的账单
   * @throws 租约已激活、状态非法、房源不空闲等异常
   */
  @Post(":id/activate")
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR, OrgRole.OPERATOR)
  async activate(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Request() request: { user: JwtPayload },
    @Body() body: ActivateLeaseDto = {},
  ): Promise<ActivateLeaseResult> {
    const organizationId = request.user.organizationId;
    return this.leaseService.activateLease(organizationId, id, {
      generateDepositPayment: body.generateDepositPayment ?? true,
    });
  }
}
