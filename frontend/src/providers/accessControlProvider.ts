/**
 * Access Control Provider
 * 
 * 基于用户 role 实现 RBAC（Role-Based Access Control）
 * 支持的角色：
 * - admin: 全权限
 * - operator: 有限的组织管理权限，可管理其他资源
 * - viewer: 只读权限
 * 
 * FE-1-79: 初始实现，为 FE-4 菜单/按钮权限控制提供基础
 */

import type { AccessControlProvider, CanParams } from "@refinedev/core";
import { loadAuth } from "@shared/auth/storage";

// 支持的角色类型
type UserRole = "ADMIN" | "OWNER" | "OPERATOR" | "VIEWER" | "STAFF";

// 支持的资源类型
type Resource = 
  | "organizations" 
  | "properties" 
  | "units" 
  | "tenants" 
  | "leases" 
  | "payments";

// 支持的操作类型
type Action = "list" | "show" | "create" | "edit" | "delete";

/**
 * 从 auth storage 获取当前用户角色
 */
function getCurrentUserRole(): UserRole | null {
  const auth = loadAuth();
  if (!auth || !auth.user) {
    return null;
  }

  // 支持 role 或 roles[0]
  const role = auth.user.role || auth.user.roles?.[0];
  if (!role) {
    return null;
  }

  // 标准化角色名称（转为大写）
  return role.toUpperCase() as UserRole;
}

/**
 * 检查给定角色对资源和操作的权限
 */
function checkPermission(
  role: UserRole | null,
  resource: string,
  action: string
): { can: boolean; reason?: string } {
  // 未登录或角色未知
  if (!role) {
    return {
      can: false,
      reason: "未登录或角色未知",
    };
  }

  // ADMIN/OWNER 拥有所有权限
  if (role === "ADMIN" || role === "OWNER") {
    return { can: true };
  }

  // VIEWER 只能 list 和 show
  if (role === "VIEWER") {
    if (action === "list" || action === "show") {
      return { can: true };
    }
    return {
      can: false,
      reason: "viewer 仅支持只读访问",
    };
  }

  // OPERATOR 权限
  if (role === "OPERATOR" || role === "STAFF") {
    // organizations 特殊限制
    if (resource === "organizations") {
      if (action === "list" || action === "show") {
        return { can: true };
      }
      return {
        can: false,
        reason: "operator 不能修改组织",
      };
    }

    // 其他资源
    if (action === "delete") {
      // TODO(FE-4): 根据实际业务需求精细化 delete 权限
      // 当前统一允许，后续可针对特定资源限制
      return { can: true };
    }

    // list, show, create, edit 均允许
    if (["list", "show", "create", "edit"].includes(action)) {
      return { can: true };
    }
  }

  // 未知角色或操作
  return {
    can: false,
    reason: "未知资源或操作",
  };
}

/**
 * Access Control Provider 实现
 */
export const accessControlProvider: AccessControlProvider = {
  can: async ({ resource, action }: CanParams) => {
    // 开发环境调试日志
    // 使用 process.env 以兼容 Jest 测试环境
    if (process.env.NODE_ENV !== "production") {
      const role = getCurrentUserRole();
      console.log("[ACCESS]", { role, resource, action });
    }

    // 如果 resource 或 action 未定义，拒绝访问
    if (!resource || !action) {
      return {
        can: false,
        reason: "资源或操作未定义",
      };
    }

    const role = getCurrentUserRole();
    const result = checkPermission(role, resource, action);

    return result;
  },
};

/**
 * 导出辅助函数供测试使用
 */
export { getCurrentUserRole, checkPermission };
export type { UserRole, Resource, Action };
