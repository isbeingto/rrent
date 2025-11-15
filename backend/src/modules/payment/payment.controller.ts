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
import { PaymentService } from "./payment.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { UpdatePaymentDto } from "./dto/update-payment.dto";
import { QueryPaymentDto } from "./dto/query-payment.dto";
import { MarkPaymentPaidDto } from "./dto/mark-payment-paid.dto";
import { Paginated } from "../../common/pagination";
import { Payment } from "@prisma/client";
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

@Controller("payments")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR, OrgRole.OPERATOR, OrgRole.STAFF)
  async findAll(
    @Query() query: QueryPaymentDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Paginated<Payment>> {
    const listQuery = parseListQuery(
      query as unknown as Record<string, unknown>,
    );
    const result = await this.paymentService.findMany(listQuery, query);
    res.setHeader("X-Total-Count", result.meta.total.toString());
    return result;
  }

  @Get(":id")
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR, OrgRole.OPERATOR, OrgRole.STAFF)
  async findOne(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Query("organizationId", new ParseUUIDPipe()) organizationId: string,
  ): Promise<Payment> {
    return this.paymentService.findById(id, organizationId);
  }

  @Post()
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR, OrgRole.OPERATOR)
  async create(@Body() dto: CreatePaymentDto): Promise<Payment> {
    return this.paymentService.create(dto);
  }

  @Put(":id")
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR, OrgRole.OPERATOR)
  async update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Query("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Body() dto: UpdatePaymentDto,
  ): Promise<Payment> {
    return this.paymentService.update(id, organizationId, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR)
  async remove(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Query("organizationId", new ParseUUIDPipe()) organizationId: string,
  ): Promise<void> {
    await this.paymentService.remove(id, organizationId);
  }

  /**
   * 标记支付单为已支付
   *
   * 将支付单从 PENDING/OVERDUE 状态标记为 PAID，并自动回写 paidAt
   *
   * @param id 支付单 ID（Path param）
   * @param request 包含用户信息的请求对象
   * @param dto 包含可选的 paidAt 时间
   * @returns 更新后的支付单
   * @throws PaymentNotFoundException 支付单不存在或跨组织访问
   * @throws PaymentInvalidStatusForMarkPaidException 支付单状态不允许标记已支付
   */
  @Post(":id/mark-paid")
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR, OrgRole.OPERATOR)
  async markPaid(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Request() request: { user: JwtPayload },
    @Body() dto: MarkPaymentPaidDto = {},
  ): Promise<Payment> {
    const organizationId = request.user.organizationId;
    return this.paymentService.markPaid(id, organizationId, dto);
  }
}
