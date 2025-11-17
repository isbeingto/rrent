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
import { loadAuth } from "@shared/auth/storage";

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
    const { resource, pagination, sorters } = params;
    const url = buildResourcePath(resource);

    const queryParams: Record<string, unknown> = {};

    // 注入 organizationId（后端要求所有列表查询必须包含）
    const auth = loadAuth();
    if (auth?.organizationId) {
      queryParams.organizationId = auth.organizationId;
    }

    // 分页映射
    // Refine pagination: pageNumber (从 1 开始) 和 pageSize
    // 后端期望: page 和 limit
    if (pagination) {
      queryParams.page = (pagination as { pageNumber?: number; pageSize?: number }).pageNumber ?? 1;
      queryParams.limit = (pagination as { pageNumber?: number; pageSize?: number }).pageSize ?? 20;
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
    const url = `${buildResourcePath(resource)}/${id}`;
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
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function create<TData extends BaseRecord = BaseRecord, TVariables = any>(
  params: CreateParams<TVariables>
): Promise<CreateResponse<TData>> {
  try {
    const { resource, values } = params as CreateParams<TVariables> & {
      values: Record<string, unknown>;
    };
    const url = buildResourcePath(resource);
    const response = await httpClient.post<TData>(url, values);
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
    const { resource, id, values } = params as UpdateParams<TVariables> & {
      values: Record<string, unknown>;
    };
    const url = `${buildResourcePath(resource)}/${id}`;
    const response = await httpClient.put<TData>(url, values);
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
    const url = `${buildResourcePath(resource)}/${id}`;
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
