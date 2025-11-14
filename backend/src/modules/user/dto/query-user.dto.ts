import {
  IsOptional,
  IsString,
  IsUUID,
  IsEnum,
  IsBoolean,
  IsNotEmpty,
} from "class-validator";
import { OrgRole } from "@prisma/client";
import { PaginationQueryDto } from "../../../common/pagination";

export class QueryUserDto extends PaginationQueryDto {
  @IsUUID()
  @IsNotEmpty()
  organizationId!: string;

  @IsString()
  @IsOptional()
  keyword?: string; // fullName / email 模糊搜索

  @IsEnum(OrgRole)
  @IsOptional()
  role?: OrgRole;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
