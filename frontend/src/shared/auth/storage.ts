/**
 * Auth Storage 工具
 * 
 * 集中管理认证状态的本地持久化存储
 * 使用 localStorage 保存 token 和用户信息
 */

const AUTH_STORAGE_KEY = "rrent_auth";

/**
 * 组织信息结构
 */
export interface OrganizationInfo {
  id: string;
  name: string;
  code?: string;
}

export interface AuthPayload {
  token: string;
  organizationId: string;
  organizationCode?: string;
  user: {
    id: string;
    email: string;
    fullName?: string;
    role?: string;
    roles?: string[];
    organizations?: OrganizationInfo[];
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

/**
 * 切换当前组织
 * @param organizationId 新的组织 ID
 * @param organizationCode 新的组织代码（可选）
 */
export function switchOrganization(organizationId: string, organizationCode?: string): void {
  try {
    const auth = loadAuth();
    if (!auth) {
      console.warn("[Auth Storage] Cannot switch organization: no auth data found");
      return;
    }

    // 验证该组织是否在用户的组织列表中
    if (auth.user.organizations && auth.user.organizations.length > 0) {
      const targetOrg = auth.user.organizations.find(org => org.id === organizationId);
      if (!targetOrg) {
        console.warn(`[Auth Storage] Organization ${organizationId} not found in user's organizations`);
        return;
      }
    }

    // 更新当前组织
    auth.organizationId = organizationId;
    if (organizationCode) {
      auth.organizationCode = organizationCode;
    }

    saveAuth(auth);
    console.log(`[Auth Storage] Switched to organization: ${organizationId}`);
  } catch (error) {
    console.error("[Auth Storage] Failed to switch organization:", error);
  }
}

