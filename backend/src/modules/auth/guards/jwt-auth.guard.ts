import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

/**
 * JWT 认证守卫
 * 验证请求中的 JWT token，并将解码的用户信息写入 request.user
 *
 * 使用方式：
 * @UseGuards(JwtAuthGuard)
 * getProfile() { ... }
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException("No token provided");
    }

    try {
      const payload = this.jwtService.verify(token);
      // 将 JWT payload 写入 request.user，供后续 Guard / Interceptor 使用
      request.user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }

  /**
   * 从 Authorization header 中提取 Bearer token
   * 格式：Authorization: Bearer <token>
   *
   * @param request HTTP 请求对象
   * @returns token 或 null
   */
  private extractToken(request: Record<string, unknown>): string | null {
    const authHeader = request.headers as Record<string, unknown>;
    const authorization = authHeader?.authorization as string;
    if (!authorization) {
      return null;
    }

    const parts = authorization.split(" ");
    if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
      return null;
    }

    return parts[1];
  }
}
