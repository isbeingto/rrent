import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { PaginationQueryDto } from "../../../common/pagination";

export class QueryTenantDto extends PaginationQueryDto {
  @IsUUID()
  @IsNotEmpty()
  organizationId!: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  keyword?: string;
}
