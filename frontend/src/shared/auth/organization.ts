/**
 * Organization Helper Functions
 * 
 * FE-4-103: 统一的组织信息获取和管理工具
 * 用于替代代码中所有硬编码的 organizationId
 */

import { loadAuth, type OrganizationInfo } from "./storage";

/**
 * 获取当前组织 ID
 * @returns 当前组织 ID，如果未登录返回 null
 */
export function getCurrentOrganizationId(): string | null {
  const auth = loadAuth();
  return auth?.organizationId || null;
}

/**
 * 获取当前组织代码
 * @returns 当前组织代码，如果未设置返回 null
 */
export function getCurrentOrganizationCode(): string | null {
  const auth = loadAuth();
  return auth?.organizationCode || null;
}

/**
 * 获取当前组织完整信息
 * @returns 当前组织信息对象，如果未登录返回 null
 */
export function getCurrentOrganization(): OrganizationInfo | null {
  const auth = loadAuth();
  if (!auth) return null;

  // 如果用户有组织列表，尝试从列表中找到当前组织
  if (auth.user.organizations && auth.user.organizations.length > 0) {
    const currentOrg = auth.user.organizations.find(
      org => org.id === auth.organizationId
    );
    if (currentOrg) {
      return currentOrg;
    }
  }

  // 回退：使用 auth 中的顶级字段
  return {
    id: auth.organizationId,
    code: auth.organizationCode,
    name: auth.organizationCode || auth.organizationId, // 没有 name 时用 code 或 id
  };
}

/**
 * 获取用户的所有组织列表
 * @returns 组织列表数组，如果未登录或没有组织返回空数组
 */
export function getUserOrganizations(): OrganizationInfo[] {
  const auth = loadAuth();
  return auth?.user?.organizations || [];
}

/**
 * 检查用户是否有多个组织
 * @returns 如果用户有多个组织返回 true
 */
export function hasMultipleOrganizations(): boolean {
  const orgs = getUserOrganizations();
  return orgs.length > 1;
}
