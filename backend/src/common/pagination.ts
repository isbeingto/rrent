import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

/**
 * 通用分页查询 DTO
 * 用于所有列表型 API 的请求参数
 */
export class PaginationQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;
}

/**
 * 分页元数据
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}

/**
 * 通用分页响应结构
 * 所有列表型 API 返回此格式
 */
export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

/**
 * 创建分页响应
 * @param items - 当前页数据
 * @param total - 总数
 * @param page - 当前页号（从 1 开始）
 * @param limit - 每页数量
 * @returns 标准分页响应格式
 */
export function createPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): Paginated<T> {
  const pageCount = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    items,
    meta: {
      total,
      page,
      limit,
      pageCount,
    },
  };
}
