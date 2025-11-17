/**
 * Auth Storage 工具
 * 
 * 集中管理认证状态的本地持久化存储
 * 使用 localStorage 保存 token 和用户信息
 */

const AUTH_STORAGE_KEY = "rrent_auth";

export interface AuthPayload {
  token: string;
  organizationId: string;
  user: {
    id: string;
    email: string;
    fullName?: string;
    role?: string;
    roles?: string[];
  };
}

/**
 * 保存认证信息到 localStorage
 */
export function saveAuth(payload: AuthPayload): void {
  try {
    const serialized = JSON.stringify(payload);
    localStorage.setItem(AUTH_STORAGE_KEY, serialized);
  } catch (error) {
    console.error("[Auth Storage] Failed to save auth data:", error);
  }
}

/**
 * 从 localStorage 加载认证信息
 * @returns 认证信息对象，如果不存在或损坏则返回 null
 */
export function loadAuth(): AuthPayload | null {
  try {
    const serialized = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!serialized) {
      return null;
    }
    const parsed = JSON.parse(serialized) as AuthPayload;
    // 简单验证必需字段
    if (!parsed.token || !parsed.organizationId || !parsed.user?.id) {
      console.warn("[Auth Storage] Invalid auth data structure, clearing...");
      clearAuth();
      return null;
    }
    return parsed;
  } catch (error) {
    console.error("[Auth Storage] Failed to load auth data:", error);
    // 损坏的数据需要清理
    clearAuth();
    return null;
  }
}

/**
 * 清除本地认证信息
 */
export function clearAuth(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    console.error("[Auth Storage] Failed to clear auth data:", error);
  }
}
