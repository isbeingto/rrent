import {
  DataProvider,
  GetListParams,
  GetListResponse,
  GetOneParams,
  GetOneResponse,
  CreateParams,
  CreateResponse,
  UpdateParams,
  UpdateResponse,
  DeleteOneParams,
  DeleteOneResponse,
  BaseRecord,
} from "@refinedev/core";
import { AxiosError } from "axios";
import httpClient from "@shared/api/http";
import { getCurrentOrganizationId } from "@shared/auth/organization";

/**
 * 自定义 Refine Data Provider
 * 
 * 完整对齐后端分页/排序/筛选契约：
 * - 请求侧：Refine pagination/sorters/filters → 后端 page/pageSize/sort/order
 * - 响应侧：后端 { items, meta } → Refine { data, total }
 */

interface BackendListResponse {
  items: BaseRecord[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    pageCount: number;
  };
}

interface ErrorResponse {
  code?: string;
  message?: string;
}

/**
 * 构建资源路径
 * 资源名称（如 "organizations"）→ API 路径（如 "/api/organizations"）
 */
function buildResourcePath(resource: string): string {
  // 移除尾部斜杠，以防止重复
  const normalized = resource.endsWith("/") ? resource.slice(0, -1) : resource;
  // 确保路径以 / 开头
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

/**
 * 处理错误，提取后端的 code 和 message
 */
function handleError(error: unknown): Error {
  const axiosError = error as AxiosError<ErrorResponse>;
  const message =
    axiosError?.response?.data?.message ||
    axiosError?.message ||
    "Request failed";

  const err = new Error(message);
  if (axiosError?.response?.data?.code) {
    (err as { code?: string }).code = axiosError.response.data.code;
  }
  return err;
}


/**
 * 获取列表数据
 */
async function getList<TData extends BaseRecord = BaseRecord>(
  params: GetListParams
): Promise<GetListResponse<TData>> {
  try {
    const { resource, pagination, sorters, filters } = params;
    const url = buildResourcePath(resource);

    const queryParams: Record<string, unknown> = {};

    // FE-2-90: 修正 organizationId 处理
    // 根据后端实际契约（backend/test/pagination.e2e-spec.ts），
    // 大部分资源的 getList 需要 organizationId 作为 query 参数
    // 例外：organizations 资源不需要
    // FE-4-103: 使用统一的 getCurrentOrganizationId() helper
    const organizationId = getCurrentOrganizationId();
    if (organizationId && resource !== 'organizations') {
      queryParams.organizationId = organizationId;
    }

    // 分页映射
    // Refine pagination: currentPage (从 1 开始) 和 pageSize
    // 后端期望: page 和 limit
    if (pagination) {
      queryParams.page = (pagination as { currentPage?: number; pageSize?: number }).currentPage ?? 1;
      queryParams.limit = (pagination as { currentPage?: number; pageSize?: number }).pageSize ?? 20;
    } else {
      queryParams.page = 1;
      queryParams.limit = 20;
    }

    // 排序映射（只支持第一个 sorter）
    if (sorters && sorters.length > 0) {
      const sorter = sorters[0];
      queryParams.sort = sorter.field;
      queryParams.order = sorter.order;
    }

    // FE-3-96: 过滤器映射
    // 将 Refine 的 filters 转换为后端 query 参数
    if (filters && filters.length > 0) {
      filters.forEach((filter) => {
        // 只处理简单的 CrudFilter 类型（ConditionalFilter 和 LogicalFilter 暂不支持）
        if ('field' in filter && 'operator' in filter && 'value' in filter) {
          const { field, operator, value } = filter;
          
          // 根据操作符映射到后端参数
          if (operator === 'eq' || operator === 'contains') {
            // 简单相等过滤：直接作为 query 参数
            queryParams[field] = value;
          }
          // 其他操作符（ne, gt, gte, lt, lte, in, nin, between 等）暂不支持
          // 如需扩展，可在此处添加对应的映射逻辑
        }
      });
    }

    const response = await httpClient.get<BackendListResponse>(url, {
      params: queryParams,
    });

    const { data, headers } = response;

    // 优先使用 meta.total，否则尝试 X-Total-Count 头，都没有时回落到 0
    let total = 0;
    if (data.meta?.total !== undefined) {
      total = data.meta.total;
    } else {
      const headerTotal = headers["x-total-count"];
      if (headerTotal) {
        total = Number(headerTotal);
      }
    }

    // 开发环境下如果没有 total 则警告
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const isDev = (globalThis as any).import?.meta?.env?.DEV === true;
    
    if (
      isDev &&
      total === 0 &&
      (!data.items || data.items.length === 0)
    ) {
      console.warn(
        `[DataProvider] No total count found for resource: ${resource}. Check meta.total or X-Total-Count header.`
      );
    }

    return {
      data: (data.items || []) as TData[],
      total,
    };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * 获取单条记录
 */
async function getOne<TData extends BaseRecord = BaseRecord>(
  params: GetOneParams
): Promise<GetOneResponse<TData>> {
  try {
    const { resource, id } = params;
    let url = `${buildResourcePath(resource)}/${id}`;
    
    // 为非 organizations 资源添加 organizationId 查询参数
    // FE-4-103: 使用统一的 getCurrentOrganizationId() helper
    const organizationId = getCurrentOrganizationId();
    if (organizationId && resource !== 'organizations') {
      url += `?organizationId=${organizationId}`;
    }
    
    const response = await httpClient.get<TData>(url);
    return {
      data: response.data,
    };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * 创建记录
 * 
 * 根据后端 API 契约：
 * - Tenants: organizationId 在 body 中（CreateTenantDto 要求）
 * - Units: organizationId 作为 query 参数（controller @Query 要求）
 * - Properties: organizationId 在 body 中（CreatePropertyDto 要求）
 * - Leases: organizationId 在 body 中（CreateLeaseDto 要求）- FE-2-91
 * - Organizations: 不需要 organizationId
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function create<TData extends BaseRecord = BaseRecord, TVariables = any>(
  params: CreateParams<TVariables>
): Promise<CreateResponse<TData>> {
  try {
    const { resource, variables } = params;
    let url = buildResourcePath(resource);
    
    // FE-4-103: 使用统一的 getCurrentOrganizationId() helper
    const organizationId = getCurrentOrganizationId();
    
    if (organizationId && resource !== 'organizations') {
      if (resource === 'tenants' || resource === 'properties' || resource === 'leases') {
        // Tenants, Properties, Leases: organizationId 注入到 body 中
        (variables as Record<string, unknown>).organizationId = organizationId;
      } else if (resource === 'units') {
        // Units: organizationId 作为 query 参数
        url += `?organizationId=${organizationId}`;
      }
      // 其他资源根据需要扩展
    }
    
    const response = await httpClient.post<TData>(url, variables);
    return {
      data: response.data,
    };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * 更新记录
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function update<TData extends BaseRecord = BaseRecord, TVariables = any>(
  params: UpdateParams<TVariables>
): Promise<UpdateResponse<TData>> {
  try {
    const { resource, id, variables } = params;
    let url = `${buildResourcePath(resource)}/${id}`;
    
    // 为非 organizations 资源添加 organizationId 查询参数
    // FE-4-103: 使用统一的 getCurrentOrganizationId() helper
    const organizationId = getCurrentOrganizationId();
    if (organizationId && resource !== 'organizations') {
      url += `?organizationId=${organizationId}`;
    }
    
    const response = await httpClient.put<TData>(url, variables);
    return {
      data: response.data,
    };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * 删除记录
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function deleteOne<TData extends BaseRecord = BaseRecord, TVariables = any>(
  params: DeleteOneParams<TVariables>
): Promise<DeleteOneResponse<TData>> {
  try {
    const { resource, id } = params;
    let url = `${buildResourcePath(resource)}/${id}`;
    
    // 为非 organizations 资源添加 organizationId 查询参数
    // FE-4-103: 使用统一的 getCurrentOrganizationId() helper
    const organizationId = getCurrentOrganizationId();
    if (organizationId && resource !== 'organizations') {
      url += `?organizationId=${organizationId}`;
    }
    
    const response = await httpClient.delete<TData>(url);
    return {
      data: response.data || ({} as TData),
    };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * 自定义 Data Provider
 */
export const dataProvider: DataProvider = {
  getList,
  getOne,
  create,
  update,
  deleteOne,
  getApiUrl: () => {
    return httpClient.defaults.baseURL || "";
  },
  // 其他方法暂不实现
  getMany: async () => {
    throw new Error("getMany not implemented yet");
  },
  createMany: async () => {
    throw new Error("createMany not implemented yet");
  },
  updateMany: async () => {
    throw new Error("updateMany not implemented yet");
  },
  deleteMany: async () => {
    throw new Error("deleteMany not implemented yet");
  },
  custom: async () => {
    throw new Error("custom not implemented yet");
  },
};

export default dataProvider;
