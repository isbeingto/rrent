import { IsOptional, IsString, IsUUID } from "class-validator";

/**
 * 审计日志查询 DTO
 * 支持按实体类型和实体 ID 过滤
 */
export class QueryAuditLogDto {
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsString()
  entity?: string;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsString()
  order?: "asc" | "desc";

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;

  @IsOptional()
  pageSize?: number;
}
