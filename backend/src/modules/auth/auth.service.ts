import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "../user/user.service";
import { BcryptPasswordHasher } from "../../common/security/password-hasher";
import { User, OrgRole } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogService } from "../audit-log/audit-log.service";
import { AuditAction, AuditEntity } from "../audit-log/audit-event.enum";

/**
 * 认证服务
 * 处理核心认证逻辑，与 Passport 策略解耦
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly passwordHasher: BcryptPasswordHasher,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * 根据邮箱和密码验证用户
   * 用于 LocalStrategy
   * @param email 用户邮箱
   * @param password 明文密码
   * @param organizationId 组织 ID
   * @returns 用户信息或 null
   */
  async validateUserByEmail(
    email: string,
    password: string,
    organizationId: string,
  ): Promise<User | null> {
    // 查找用户（包含 passwordHash，用于验证）
    const user = await this.userService.findByEmail(email, organizationId);

    if (!user) {
      return null;
    }

    // 检查用户是否活跃
    if (!user.isActive) {
      return null;
    }

    // 验证密码
    const isPasswordValid = await this.passwordHasher.compare(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * 登录流程：验证用户身份并生成访问令牌
   * @param email 用户邮箱
   * @param password 明文密码
   * @param organizationCode 组织代码
   * @param ip 客户端 IP 地址
   * @param userAgent 用户代理字符串
   * @returns 访问令牌和用户信息
   */
  async login(
    email: string,
    password: string,
    organizationCode: string,
    ip?: string,
    userAgent?: string,
  ): Promise<{ accessToken: string; user: Omit<User, "passwordHash"> }> {
    // 根据组织代码查找组织 ID
    const organization = await this.prisma.organization.findFirst({
      where: {
        code: organizationCode,
      },
    });

    if (!organization) {
      throw new BadRequestException("Invalid organization code");
    }

    // 验证用户
    const user = await this.validateUserByEmail(
      email,
      password,
      organization.id,
    );

    if (!user) {
      // 记录登录失败审计日志
      await this.auditLogService.log(
        {
          organizationId: organization.id,
          ip,
          userAgent,
        },
        {
          entity: AuditEntity.USER,
          entityId: email, // 使用 email 作为标识，因为此时还没有 userId
          action: AuditAction.LOGIN_FAILED,
          metadata: { email, reason: "Invalid credentials" },
        },
      );
      throw new UnauthorizedException("Invalid email or password");
    }

    // 生成访问令牌
    const payload = {
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // 记录登录成功审计日志
    await this.auditLogService.log(
      {
        organizationId: user.organizationId,
        userId: user.id,
        ip,
        userAgent,
      },
      {
        entity: AuditEntity.USER,
        entityId: user.id,
        action: AuditAction.LOGIN,
        metadata: { email: user.email },
      },
    );

    // 返回令牌和用户信息（不包含密码哈希）
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      accessToken,
      user: userWithoutPassword,
    };
  }

  /**
   * 生成访问令牌
   * @param payload JWT 载荷
   * @returns 包含 accessToken 的对象
   */
  async generateAccessToken(payload: {
    userId: string;
    organizationId: string;
    role: OrgRole;
  }): Promise<{ accessToken: string }> {
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken };
  }

  /**
   * 获取当前用户信息
   * @param userId 用户 ID
   * @param organizationId 组织 ID
   * @returns 用户信息（不包含密码哈希）
   */
  async getCurrentUser(
    userId: string,
    organizationId: string,
  ): Promise<Omit<User, "passwordHash">> {
    return this.userService.findById(userId, organizationId);
  }
}
