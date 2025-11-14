import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from "class-validator";
import { PaginationQueryDto } from "../../../common/pagination";
import { PaymentStatus } from "@prisma/client";

export class QueryPaymentDto extends PaginationQueryDto {
  @IsUUID()
  @IsNotEmpty()
  organizationId!: string;

  @IsUUID()
  @IsOptional()
  leaseId?: string;

  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @IsDateString()
  @IsOptional()
  dueDateFrom?: string;

  @IsDateString()
  @IsOptional()
  dueDateTo?: string;
}
