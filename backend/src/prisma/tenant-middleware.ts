import { TenantContext } from "../common/tenant/tenant-context";

/**
 * org-scoped 数据库模型列表
 * 这些模型的所有查询都应该自动包含 organizationId 过滤条件
 */
const ORG_SCOPED_MODELS = new Set([
  "Property",
  "Unit",
  "Tenant",
  "Lease",
  "Payment",
  "User",
  "AuditLog",
]);

/**
 * 需要处理 where 条件的数据库操作
 */
const ACTIONS_WITH_WHERE = new Set<string>([
  "findMany",
  "findFirst",
  "findUnique",
  "updateMany",
  "deleteMany",
  "update",
  "delete",
  "upsert",
  "count",
  "aggregate",
]);

/**
 * 创建租户中间件工厂函数
 * 该中间件自动为 org-scoped 模型的查询条件中注入 organizationId 限制
 *
 * 工作原理：
 * 1. 读取当前请求上下文中的 organizationId（来自 TenantContext）
 * 2. 如果不存在 orgId 上下文，直接执行原始查询（保持原有行为）
 * 3. 如果操作目标是 org-scoped 模型且包含 where 条件，自动注入 organizationId
 * 4. 若服务层已经指定了 organizationId，中间件不会覆盖（保留现有值）
 *
 * 注意：
 * - Organization 模型永远不注入 organizationId（它本身是租户根）
 * - create/createMany 暂不处理，由服务层显式校验
 * - 中间件与现有服务层 org 校验叠加，提供额外防护层
 *
 * @param tenantContext 租户上下文服务
 * @returns Prisma 中间件函数
 */
export function createTenantExtension(tenantContext: TenantContext) {
  return {
    query: {
      $allModels: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        $allOperations: async (params: {
          model?: string;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          args?: Record<string, any>;
          action?: string;
          operation?: string;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          query: (args: Record<string, any>) => Promise<any>;
        }) => {
          const orgId = tenantContext.getOrganizationId();
          if (!orgId) {
            return params.query(params.args ?? {});
          }

          if (!ORG_SCOPED_MODELS.has(params.model ?? "")) {
            return params.query(params.args ?? {});
          }

          const action = params.operation ?? params.action;
          if (!action || !ACTIONS_WITH_WHERE.has(action)) {
            return params.query(params.args ?? {});
          }

          const args = {
            ...params.args,
          };
          const existingWhere = args.where ?? {};
          args.where = {
            ...existingWhere,
            organizationId: existingWhere.organizationId ?? orgId,
          };

          return params.query(args);
        },
      },
    },
  };
}
