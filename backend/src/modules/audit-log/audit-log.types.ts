import { AuditAction, AuditEntity } from "./audit-event.enum";

/**
 * 审计日志上下文
 * 包含执行操作的用户、组织和请求信息
 */
export interface AuditLogContext {
  /** 组织 ID（必填，所有操作都在组织上下文中） */
  organizationId: string;

  /** 用户 ID（可选，某些系统操作可能没有用户上下文） */
  userId?: string;

  /** 客户端 IP 地址 */
  ip?: string;

  /** 用户代理字符串 */
  userAgent?: string;
}

/**
 * 审计日志负载
 * 包含操作的实体、动作和元数据
 */
export interface AuditLogPayload {
  /** 实体类型 */
  entity: AuditEntity;

  /** 实体 ID */
  entityId: string;

  /** 操作动作 */
  action: AuditAction;

  /** 额外元数据（避免存储敏感信息） */
  metadata?: Record<string, unknown>;
}
