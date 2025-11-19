import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma, AuditLog } from "@prisma/client";
import { AuditLogContext, AuditLogPayload } from "./audit-log.types";
import { Paginated } from "../../common/pagination";
import { QueryAuditLogDto } from "./dto/query-audit-log.dto";

/**
 * 审计日志服务
 * 提供统一的审计日志写入和查询接口
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

  /**
   * 查询审计日志列表
   * 支持按组织、实体类型、实体ID过滤，以及分页和排序
   *
   * @param listQuery 通用列表查询参数（分页、排序）
   * @param filters 审计日志特定的过滤条件
   * @returns Promise<Paginated<AuditLog>>
   */
  async findMany(
    listQuery: {
      page?: number;
      limit?: number;
      sort?: string;
      order?: "asc" | "desc";
    },
    filters: QueryAuditLogDto,
  ): Promise<Paginated<AuditLog>> {
    const page = listQuery.page ?? 1;
    const limit = listQuery.limit ?? 20;
    const skip = (page - 1) * limit;
    const sort = listQuery.sort ?? "createdAt";
    const order = listQuery.order ?? "desc";

    // 构建 where 条件
    const where: Prisma.AuditLogWhereInput = {};

    if (filters.organizationId) {
      where.organizationId = filters.organizationId;
    }

    if (filters.entity) {
      where.entity = filters.entity;
    }

    if (filters.entityId) {
      where.entityId = filters.entityId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    // 并行查询总数和数据
    const [total, items] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sort]: order },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
      }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    };
  }
}
