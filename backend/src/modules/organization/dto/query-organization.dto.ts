import { IsDateString, IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "../../../common/pagination";

export class QueryOrganizationDto extends PaginationQueryDto {
  @IsString()
  @IsOptional()
  keyword?: string;

  @IsDateString()
  @IsOptional()
  dateStart?: string;

  @IsDateString()
  @IsOptional()
  dateEnd?: string;
}
