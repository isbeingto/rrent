import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";
import { BillType, PaymentMethod, PaymentStatus } from "@prisma/client";

export class CreatePaymentDto {
  @IsUUID()
  @IsNotEmpty()
  organizationId!: string;

  @IsUUID()
  @IsNotEmpty()
  leaseId!: string;

  @IsEnum(BillType)
  @IsNotEmpty()
  type!: BillType;

  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @IsEnum(PaymentMethod)
  @IsOptional()
  method?: PaymentMethod;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  currency?: string;

  @IsDateString()
  @IsNotEmpty()
  dueDate!: string;

  @IsDateString()
  @IsOptional()
  paidAt?: string;

  @IsString()
  @IsOptional()
  externalRef?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
