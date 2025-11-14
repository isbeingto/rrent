import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsEmail,
  IsEnum,
  IsBoolean,
  MinLength,
  MaxLength,
} from "class-validator";
import { OrgRole } from "@prisma/client";

export class CreateUserDto {
  @IsUUID()
  @IsNotEmpty()
  organizationId!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(100)
  password!: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  fullName?: string;

  @IsEnum(OrgRole)
  @IsNotEmpty()
  role!: OrgRole;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
