import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  IsNumber,
  IsEnum,
  MaxLength,
} from "class-validator";
import { UnitStatus } from "@prisma/client";
import { Type } from "class-transformer";

export class CreateUnitDto {
  @IsUUID()
  @IsNotEmpty()
  propertyId!: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  unitNumber!: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  floor?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  bedrooms?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  bathrooms?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  areaSqm?: number;

  @IsEnum(UnitStatus)
  @IsOptional()
  status?: UnitStatus;
}
