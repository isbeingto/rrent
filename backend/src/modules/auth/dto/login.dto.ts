import { IsEmail, IsString, MinLength, IsOptional } from "class-validator";

/**
 * 登录请求 DTO
 * 用于用户身份验证
 */
export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  organizationCode?: string;
}
