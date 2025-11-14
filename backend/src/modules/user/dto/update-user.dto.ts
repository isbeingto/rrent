import {
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsUUID,
  IsEmail,
  MaxLength,
} from "class-validator";
import { OrgRole } from "@prisma/client";

/**
 * UpdateUserDto: 用于更新用户信息
 * 注意：不允许通过此 DTO 更新密码，改密码应通过专门的 API 处理
 * 不继承 CreateUserDto 以显式排除 password 字段
 */
export class UpdateUserDto {
  @IsUUID()
  @IsOptional()
  organizationId?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  fullName?: string;

  @IsEnum(OrgRole)
  @IsOptional()
  role?: OrgRole;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
