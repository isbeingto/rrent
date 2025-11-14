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
import { PaymentService } from "./payment.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { UpdatePaymentDto } from "./dto/update-payment.dto";
import { QueryPaymentDto } from "./dto/query-payment.dto";
import { Paginated } from "../../common/pagination";
import { Payment } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { OrgRole } from "@prisma/client";

@Controller("payments")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR, OrgRole.OPERATOR, OrgRole.STAFF)
  async findAll(@Query() query: QueryPaymentDto): Promise<Paginated<Payment>> {
    return this.paymentService.findMany(query);
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
}
