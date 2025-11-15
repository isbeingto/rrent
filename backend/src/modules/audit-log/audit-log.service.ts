import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma } from "@prisma/client";
import { AuditLogContext, AuditLogPayload } from "./audit-log.types";

/**
 * 审计日志服务
 * 提供统一的审计日志写入接口
 *
 * 设计原则：
 * 1. 日志写入失败不应中断主业务流程
 * 2. 不记录敏感信息（密码、token 等）
 * 3. 支持灵活的元数据扩展
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 写入审计日志
   *
   * @param context 审计上下文（用户、组织、请求信息）
   * @param payload 审计负载（实体、动作、元数据）
   * @returns Promise<void> 日志写入失败时不抛出异常，只记录警告
   *
   * @example
   * ```typescript
   * await auditLogService.log(
   *   { organizationId: 'org-123', userId: 'user-456', ip: '1.2.3.4' },
   *   { entity: AuditEntity.LEASE, entityId: 'lease-789', action: AuditAction.LEASE_ACTIVATED }
   * );
   * ```
   */
  async log(context: AuditLogContext, payload: AuditLogPayload): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          organizationId: context.organizationId,
          userId: context.userId,
          entity: payload.entity,
          entityId: payload.entityId,
          action: payload.action,
          ip: context.ip,
          userAgent: context.userAgent,
          metadata: (payload.metadata || {}) as Prisma.JsonObject,
        },
      });

      this.logger.debug(
        `Audit log created: ${payload.action} on ${payload.entity}:${payload.entityId}`,
      );
    } catch (error) {
      // 日志写入失败不应影响主业务
      this.logger.warn(
        `Failed to write audit log: ${payload.action} on ${payload.entity}:${payload.entityId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * 批量写入审计日志
   * 用于需要记录多个操作的场景（例如批量创建）
   *
   * @param context 审计上下文
   * @param payloads 审计负载数组
   * @returns Promise<void>
   */
  async logMany(
    context: AuditLogContext,
    payloads: AuditLogPayload[],
  ): Promise<void> {
    if (payloads.length === 0) {
      return;
    }

    try {
      await this.prisma.auditLog.createMany({
        data: payloads.map((payload) => ({
          organizationId: context.organizationId,
          userId: context.userId,
          entity: payload.entity,
          entityId: payload.entityId,
          action: payload.action,
          ip: context.ip,
          userAgent: context.userAgent,
          metadata: (payload.metadata || {}) as Prisma.JsonObject,
        })),
      });

      this.logger.debug(`Audit log batch created: ${payloads.length} records`);
    } catch (error) {
      this.logger.warn(
        `Failed to write batch audit log: ${payloads.length} records`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
