import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from "class-validator";
import { PaginationQueryDto } from "../../../common/pagination";
import { LeaseStatus } from "@prisma/client";

export class QueryLeaseDto extends PaginationQueryDto {
  @IsUUID()
  @IsNotEmpty()
  organizationId!: string;

  @IsUUID()
  @IsOptional()
  propertyId?: string;

  @IsUUID()
  @IsOptional()
  unitId?: string;

  @IsUUID()
  @IsOptional()
  tenantId?: string;

  @IsEnum(LeaseStatus)
  @IsOptional()
  status?: LeaseStatus;
}
