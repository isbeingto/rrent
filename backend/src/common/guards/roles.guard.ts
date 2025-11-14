import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { OrgRole } from "@prisma/client";
import { ROLES_KEY } from "../decorators/roles.decorator";

/**
 * 角色权限守卫
 * 检查当前用户的角色是否满足 Controller/Handler 声明的 @Roles() 要求
 *
 * 使用方式：
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(OrgRole.OWNER)
 * findOne() { ... }
 *
 * 注意：
 * - 本守卫应与 JwtAuthGuard 组合使用
 * - JwtAuthGuard 需要将用户信息写入 request.user
 * - request.user 必须包含 role 字段
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 获取 Handler 和 Class 级别的角色元数据
    const requiredRoles = this.reflector.getAllAndOverride<OrgRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 如未声明 @Roles 或角色列表为空，则不进行角色检查，直接通过
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 从 request 中获取用户信息（由 JwtAuthGuard 写入）
    const request = context.switchToHttp().getRequest();
    const user = request.user as { role?: OrgRole } | undefined;

    // 如果用户不存在或无角色，拒绝访问
    if (!user || !user.role) {
      throw new ForbiddenException("Access denied: no user role");
    }

    // 检查用户角色是否满足声明的任一角色要求
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied: insufficient role. Required: ${requiredRoles.join(", ")}`,
      );
    }

    return true;
  }
}
