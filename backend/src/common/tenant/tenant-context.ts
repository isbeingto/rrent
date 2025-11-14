import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "async_hooks";

/**
 * 租户上下文存储接口
 */
interface TenantStore {
  organizationId?: string;
}

/**
 * 租户上下文服务
 * 使用 AsyncLocalStorage 在请求级别存储当前组织 ID
 * 用于 Prisma 中间件自动注入 organizationId 条件
 */
@Injectable()
export class TenantContext {
  private readonly storage = new AsyncLocalStorage<TenantStore>();

  /**
   * 在给定 organizationId 的上下文中执行函数
   * 该上下文对所有异步调用都可见
   *
   * @param organizationId 组织 ID
   * @param fn 要执行的函数
   * @returns 函数执行结果
   */
  async runWithTenant<T>(
    organizationId: string | undefined,
    fn: () => Promise<T>,
  ): Promise<T> {
    return this.storage.run({ organizationId }, fn);
  }

  /**
   * 同步版本：在给定 organizationId 的上下文中执行函数
   * 用于非异步场景
   *
   * @param organizationId 组织 ID
   * @param fn 要执行的函数
   * @returns 函数执行结果
   */
  runWithTenantSync<T>(organizationId: string | undefined, fn: () => T): T {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.storage as any).runSync({ organizationId }, fn);
  }

  /**
   * 获取当前上下文中的 organizationId
   * 如果不在 runWithTenant 包裹的上下文中，返回 undefined
   *
   * @returns 当前组织 ID 或 undefined
   */
  getOrganizationId(): string | undefined {
    const store = this.storage.getStore();
    return store?.organizationId;
  }
}
