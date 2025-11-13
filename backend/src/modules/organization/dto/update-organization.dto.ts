import { PartialType } from "@nestjs/mapped-types";
import { CreateOrganizationDto } from "./create-organization.dto";
import { IsString, IsOptional, MaxLength } from "class-validator";

export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  timezone?: string;
}
