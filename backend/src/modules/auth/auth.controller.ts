import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { User } from "@prisma/client";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

interface LoginRequest {
  email: string;
  password: string;
  organizationCode: string;
}

interface JwtPayload {
  userId: string;
  organizationId: string;
  role: string;
}

/**
 * 认证控制器
 * 提供认证相关路由：登录、令牌刷新等
 */
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("health")
  getAuthHealth() {
    return { status: "ok" };
  }

  /**
   * 用户登录
   * 速率限制：每 60 秒最多 5 次尝试
   * 可通过环境变量 LOGIN_RATE_LIMIT 和 LOGIN_RATE_TTL 配置
   */
  @Post("login")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(
    @Body() loginRequest: LoginRequest,
  ): Promise<{ accessToken: string; user: Omit<User, "passwordHash"> }> {
    const { email, password, organizationCode } = loginRequest;
    return this.authService.login(email, password, organizationCode);
  }

  /**
   * 获取当前登录用户信息
   * 需要提供有效的 JWT token
   * @param request HTTP 请求对象，包含 user 信息
   * @returns 当前用户的完整信息
   */
  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(
    @Request() request: { user: JwtPayload },
  ): Promise<Omit<User, "passwordHash">> {
    const userId = request.user.userId;
    const organizationId = request.user.organizationId;
    return this.authService.getCurrentUser(userId, organizationId);
  }
}
