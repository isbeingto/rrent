/**
 * Refine Auth Provider
 * 
 * 实现 Refine 的认证接口，对接后端 Auth API
 * - login: 调用 POST /auth/login
 * - logout: 清除本地状态
 * - check: 检查本地登录状态
 * - getPermissions: 返回用户角色/权限
 */

import type { AuthProvider } from "@refinedev/core";
import { AxiosError } from "axios";
import httpClient from "@shared/api/http";
import {
  saveAuth,
  loadAuth,
  clearAuth,
  type AuthPayload,
} from "@shared/auth/storage";

interface LoginParams {
  email: string;
  password: string;
  organizationCode: string;
}

interface BackendLoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    fullName?: string;
    role?: string;
    organizationId: string;
    organizationCode?: string;
    organizations?: Array<{
      id: string;
      name: string;
      code?: string;
    }>;
    [key: string]: unknown;
  };
}

interface ErrorResponse {
  code?: string;
  message?: string;
}

/**
 * 登录实现
 */
async function login(params: LoginParams) {
  try {
    const response = await httpClient.post<BackendLoginResponse>(
      "/auth/login",
      {
        email: params.email,
        password: params.password,
        organizationCode: params.organizationCode,
      }
    );

    const { accessToken, user } = response.data;

    // 构建存储的 payload
    const authPayload: AuthPayload = {
      token: accessToken,
      organizationId: user.organizationId,
      organizationCode: user.organizationCode,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        roles: user.role ? [user.role] : [],
        organizations: user.organizations, // FE-4-103: 保存组织列表（如果后端提供）
      },
    };

    // 保存到本地存储
    saveAuth(authPayload);

    return {
      success: true,
      redirectTo: "/",
    };
  } catch (error) {
    console.error("[Auth Provider] Login failed:", error);

    // 处理错误响应
    if (error instanceof AxiosError && error.response) {
      const errorData = error.response.data as ErrorResponse;
      return {
        success: false,
        error: {
          name: errorData.code || "LoginError",
          message: errorData.message || "登录失败，请检查您的凭据",
        },
      };
    }

    return {
      success: false,
      error: {
        name: "NetworkError",
        message: "网络错误，请稍后重试",
      },
    };
  }
}

/**
 * 登出实现
 */
async function logout() {
  // 可选：调用后端 /auth/logout（如果存在）
  // 当前后端暂无此端点，仅清理本地状态
  clearAuth();

  return {
    success: true,
    redirectTo: "/login",
  };
}

/**
 * 检查认证状态
 */
async function check() {
  const auth = loadAuth();

  if (auth && auth.token) {
    return {
      authenticated: true,
    };
  }

  return {
    authenticated: false,
    redirectTo: "/login",
    logout: true,
  };
}

/**
 * 获取用户权限/角色
 */
async function getPermissions() {
  const auth = loadAuth();

  if (!auth) {
    return null;
  }

  // 返回角色数组
  return auth.user.roles || (auth.user.role ? [auth.user.role] : null);
}

/**
 * 获取用户身份信息（可选）
 */
async function getIdentity() {
  const auth = loadAuth();

  if (!auth) {
    return null;
  }

  return {
    id: auth.user.id,
    email: auth.user.email,
    name: auth.user.fullName || auth.user.email,
    avatar: undefined, // 可以在后续任务中添加
  };
}

/**
 * 错误处理（可选）
 * 当 API 调用返回 401 时自动登出
 */
async function onError(error: unknown) {
  if (error instanceof AxiosError) {
    if (error.response?.status === 401) {
      clearAuth();
      return {
        logout: true,
        redirectTo: "/login",
      };
    }
  }

  return {};
}

export const authProvider: AuthProvider = {
  login,
  logout,
  check,
  getPermissions,
  getIdentity,
  onError,
};
