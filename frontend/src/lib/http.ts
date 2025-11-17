/**
 * HTTP 客户端 - Axios 拦截器集成
 * 
 * FE-1-80: 统一的 HTTP 客户端，集成：
 * 1. JWT 自动注入（Authorization header）
 * 2. 组织信息注入（X-Organization-Id header）
 * 3. 统一错误处理（对齐后端错误格式）
 * 4. 开发模式调试日志
 * 
 * Dependencies: FE-1-77 (dataProvider), FE-1-78 (authProvider), FE-1-79 (accessControl)
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "@shared/config/env";
import { loadAuth } from "@shared/auth/storage";

/**
 * 后端错误响应结构
 */
interface BackendErrorResponse {
  code?: string;
  message?: string;
  details?: unknown;
  statusCode?: number;
}

/**
 * 增强的错误对象（挂载结构化错误信息）
 */
interface EnhancedAxiosError extends AxiosError {
  __handled?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * HTTP 客户端实例
 */
const httpClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * 请求拦截器：自动注入 JWT Token 和组织信息
 * 
 * FE-1-80: 从 auth storage 读取 token 和 organizationId，注入到请求头
 */
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      const auth = loadAuth();
      
      if (auth) {
        // 1. 注入 JWT Token
        if (auth.token) {
          config.headers.Authorization = `Bearer ${auth.token}`;
        }

        // 2. 注入组织信息
        if (auth.organizationId) {
          config.headers["X-Organization-Id"] = auth.organizationId;
        }

        // 3. 开发模式调试日志（不打印完整 token）
        if (process.env.NODE_ENV !== "production") {
          console.log("[HTTP][request]", {
            url: config.url,
            method: config.method?.toUpperCase(),
            hasToken: !!auth.token,
            orgId: auth.organizationId,
            role: auth.user?.role || auth.user?.roles?.[0],
          });
        }
      }
    } catch (error) {
      console.error("[HTTP] Failed to inject auth headers:", error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 响应拦截器：统一错误处理
 * 
 * FE-1-80: 对齐后端错误格式，处理 401/403 特殊情况，输出调试日志
 */
httpClient.interceptors.response.use(
  // 成功响应：直接返回
  (response) => response,
  
  // 错误响应：统一处理
  (error: AxiosError) => {
    const enhancedError = error as EnhancedAxiosError;

    // 1. 有 response 的情况（后端返回错误）
    if (error.response) {
      const response = error.response;
      const data = response.data as BackendErrorResponse | undefined;

      // 提取错误信息
      const code = data?.code || "UNKNOWN_ERROR";
      const message = data?.message || "请求失败，请稍后重试";
      const details = data?.details;

      // 挂载结构化错误信息
      enhancedError.__handled = {
        code,
        message,
        details,
      };

      // 开发模式错误日志
      if (process.env.NODE_ENV !== "production") {
        console.error("[HTTP][error]", {
          url: error.config?.url,
          method: error.config?.method?.toUpperCase(),
          status: response.status,
          code,
          message,
        });
      }

      // 2. 特殊错误处理
      switch (response.status) {
        case 401:
          // 未认证：清除本地状态，跳转登录
          if (process.env.NODE_ENV !== "production") {
            console.warn("[HTTP] 401 Unauthorized - redirecting to login");
          }
          // 清除 auth 并跳转由 authProvider.onError 处理
          // 这里只是记录日志，实际跳转由 Refine 的 authProvider 触发
          break;

        case 403:
          // 无权限：保留当前路由，弹出错误提示
          if (process.env.NODE_ENV !== "production") {
            console.warn("[HTTP] 403 Forbidden - insufficient permissions");
          }
          break;

        default:
          // 其他错误：已挂载 __handled，由上层处理
          break;
      }
    } else {
      // 2. 无 response 的情况（网络错误、超时等）
      const message = error.code === "ECONNABORTED" 
        ? "请求超时，请检查网络连接" 
        : "网络异常，请检查连接";

      enhancedError.__handled = {
        code: error.code || "NETWORK_ERROR",
        message,
      };

      if (process.env.NODE_ENV !== "production") {
        console.error("[HTTP][network-error]", {
          code: error.code,
          message,
        });
      }
    }

    return Promise.reject(enhancedError);
  }
);

/**
 * 应用启动时输出当前配置信息
 */
if (process.env.NODE_ENV !== "production") {
  console.log("[HTTP] Initialized with baseURL:", API_BASE_URL);
  
  // 显示当前登录信息（如果存在）
  const auth = loadAuth();
  if (auth) {
    console.log("[AUTH][current]", {
      role: auth.user?.role || auth.user?.roles?.[0],
      orgId: auth.organizationId,
      userId: auth.user?.id,
      email: auth.user?.email,
    });
  }
}

export default httpClient;
