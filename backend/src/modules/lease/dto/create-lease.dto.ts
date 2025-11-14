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
import { BillCycle, LeaseStatus } from "@prisma/client";

export class CreateLeaseDto {
  @IsUUID()
  @IsNotEmpty()
  organizationId!: string;

  @IsUUID()
  @IsNotEmpty()
  propertyId!: string;

  @IsUUID()
  @IsNotEmpty()
  unitId!: string;

  @IsUUID()
  @IsNotEmpty()
  tenantId!: string;

  @IsEnum(LeaseStatus)
  @IsOptional()
  status?: LeaseStatus;

  @IsEnum(BillCycle)
  @IsNotEmpty()
  billCycle!: BillCycle;

  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @Min(0)
  rentAmount!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  depositAmount?: number;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  currency?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
