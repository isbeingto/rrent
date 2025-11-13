import {
  IsOptional,
  IsString,
  IsUUID,
  IsEnum,
  IsNotEmpty,
} from "class-validator";
import { PaginationQueryDto } from "../../../common/pagination";
import { UnitStatus } from "@prisma/client";

export class QueryUnitDto extends PaginationQueryDto {
  @IsUUID()
  @IsNotEmpty()
  organizationId!: string;

  @IsUUID()
  @IsOptional()
  propertyId?: string;

  @IsEnum(UnitStatus)
  @IsOptional()
  status?: UnitStatus;

  @IsString()
  @IsOptional()
  keyword?: string;
}
