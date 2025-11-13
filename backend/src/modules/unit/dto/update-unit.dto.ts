import { PartialType } from "@nestjs/mapped-types";
import { CreateUnitDto } from "./create-unit.dto";
import {
  IsOptional,
  IsString,
  IsInt,
  IsNumber,
  IsEnum,
  MaxLength,
} from "class-validator";
import { UnitStatus } from "@prisma/client";
import { Type } from "class-transformer";

export class UpdateUnitDto extends PartialType(CreateUnitDto) {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  unitNumber?: string;

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
