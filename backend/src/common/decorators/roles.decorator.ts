import { SetMetadata } from "@nestjs/common";
import { OrgRole } from "@prisma/client";

/**
 * 角色元数据键
 * 用于在 RolesGuard 中从 Reflector 获取声明的角色列表
 */
export const ROLES_KEY = "roles";

/**
 * 角色权限装饰器
 * 声明 Controller/Handler 所需的至少一个角色
 *
 * 用法示例：
 * @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR)
 * findAll() { ... }
 *
 * @param roles 允许的角色列表（满足其一即可）
 */
export const Roles = (...roles: OrgRole[]) => SetMetadata(ROLES_KEY, roles);
