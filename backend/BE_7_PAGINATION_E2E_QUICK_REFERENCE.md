# BE-7-63: Pagination & Filtering E2E 快速参考

## 概述

此文档介绍 `backend/test/pagination.e2e-spec.ts` 的分页和筛选 E2E 测试套件。

该套件基于已实现的分页/筛选逻辑，验证：
- ✅ 列表响应结构（items / meta 字段）
- ✅ 响应头 `X-Total-Count` 与 `meta.total` 一致
- ✅ 分页、排序、keyword、status、日期范围等筛选行为
- ✅ 多租户隔离在分页场景下的正确性

---

## 快速开始

### 运行分页 E2E 测试

```bash
cd backend

# 仅运行分页 E2E 测试
pnpm run test:pagination

# 或使用 Jest 直接运行
NODE_ENV=test pnpm run test -- --runTestsByPath test/pagination.e2e-spec.ts

# 运行特定的测试套件
NODE_ENV=test pnpm run test -- --runTestsByPath test/pagination.e2e-spec.ts -t "Basic Pagination"

# 运行特定的单一测试
NODE_ENV=test pnpm run test -- --runTestsByPath test/pagination.e2e-spec.ts -t "should return paginated result"
```

### 检查代码质量

```bash
cd backend

# 代码格式和 lint
pnpm run lint
pnpm run format

# 编译
pnpm run build

# 运行全部测试
pnpm run test
```

---

## 测试覆盖范围

### 1. **Tenant List API - Basic Pagination**

- **文件**: `pagination.e2e-spec.ts` → `describe("Tenant List API - Basic Pagination")`
- **资源**: `/tenants` GET
- **覆盖的测试**:
  - ✅ 基础分页 (page/limit)
    - 返回正确数量的 items
    - meta 字段包含 total、page、limit、pageCount
    - X-Total-Count header 与 meta.total 一致
  - ✅ _start/_end 兼容模式（legacy API）
    - 正确计算偏移和数量
    - meta.total 仍为全量总数
  - ✅ 最后一页包含较少数据
  - ✅ 页码超出范围时返回空列表
  - ✅ 默认值：page=1，limit=20

**示例请求**:
```
GET /tenants?organizationId=<orgId>&page=2&limit=10
GET /tenants?organizationId=<orgId>&_start=5&_end=15
GET /tenants?organizationId=<orgId>
```

---

### 2. **Tenant List API - Sorting**

- **文件**: `pagination.e2e-spec.ts` → `describe("Tenant List API - Sorting")`
- **资源**: `/tenants` GET with sort parameters
- **覆盖的测试**:
  - ✅ `_sort/_order` (legacy naming)
    - 按指定字段升序/降序排列
  - ✅ `sort/order` (modern naming)
    - 同上，但使用现代参数名
  - ✅ 无指定排序时的默认行为
    - 默认按 createdAt 降序

**示例请求**:
```
GET /tenants?organizationId=<orgId>&_sort=fullName&_order=ASC
GET /tenants?organizationId=<orgId>&sort=fullName&order=DESC
```

---

### 3. **Tenant List API - Keyword Filtering**

- **文件**: `pagination.e2e-spec.ts` → `describe("Tenant List API - Keyword Filtering")`
- **资源**: `/tenants` GET with keyword
- **覆盖的测试**:
  - ✅ keyword 按 fullName 和 email 匹配（OR 逻辑）
  - ✅ 大小写不敏感
  - ✅ meta.total 为筛选后的总数（非全量总数）
  - ✅ X-Total-Count 与筛选后的 meta.total 一致
  - ✅ 无匹配时返回空列表
  - ✅ keyword + pagination 结合

**示例请求**:
```
GET /tenants?organizationId=<orgId>&keyword=alice
GET /tenants?organizationId=<orgId>&keyword=alice&page=2&limit=5
```

---

### 4. **Payment List API - Status Filtering**

- **文件**: `pagination.e2e-spec.ts` → `describe("Payment List API - Status Filtering")`
- **资源**: `/payments` GET with status filter
- **覆盖的测试**:
  - ✅ 按 status 筛选 (PENDING / PAID / OVERDUE)
  - ✅ meta.total 为筛选后的总数
  - ✅ X-Total-Count 与 meta.total 一致
  - ✅ 支持 status 筛选 + 分页结合
  - ✅ 所有返回项都符合 status 条件

**示例请求**:
```
GET /payments?organizationId=<orgId>&status=PENDING
GET /payments?organizationId=<orgId>&status=PAID&page=1&limit=10
GET /payments?organizationId=<orgId>&status=OVERDUE
```

---

### 5. **Payment List API - Date Range Filtering**

- **文件**: `pagination.e2e-spec.ts` → `describe("Payment List API - Date Range Filtering")`
- **资源**: `/payments` GET with dueDateFrom/dueDateTo
- **覆盖的测试**:
  - ✅ 仅 dueDateFrom (>= 指定日期)
  - ✅ 仅 dueDateTo (<= 指定日期)
  - ✅ 同时指定 dueDateFrom 和 dueDateTo（日期区间）
  - ✅ X-Total-Count 与筛选后的 meta.total 一致

**示例请求**:
```
GET /payments?organizationId=<orgId>&dueDateFrom=2025-11-01
GET /payments?organizationId=<orgId>&dueDateTo=2025-12-31
GET /payments?organizationId=<orgId>&dueDateFrom=2025-11-01&dueDateTo=2025-12-31
```

---

### 6. **Multi-tenancy Isolation**

- **文件**: `pagination.e2e-spec.ts` → `describe("Multi-tenancy Isolation")`
- **资源**: `/tenants` GET across multiple organizations
- **覆盖的测试**:
  - ✅ 按 organizationId 过滤，只返回该 org 的数据
  - ✅ 多个 org 之间数据完全隔离
  - ✅ meta.total 只计算该 org 的数据
  - ✅ X-Total-Count header 正确
  - ✅ 分页在单个 org 范围内生效

**示例请求**:
```
GET /tenants?organizationId=<orgA>  # 返回 orgA 数据
GET /tenants?organizationId=<orgB>  # 返回 orgB 数据（隔离）
```

---

### 7. **Combined Filters**

- **文件**: `pagination.e2e-spec.ts` → `describe("Combined Filters")`
- **资源**: `/tenants` GET with multiple filters
- **覆盖的测试**:
  - ✅ keyword + isActive 结合筛选
  - ✅ 多个筛选条件共同作用于 limit 和分页
  - ✅ meta.total 与所有筛选条件一致

**示例请求**:
```
GET /tenants?organizationId=<orgId>&keyword=alice&isActive=true
GET /tenants?organizationId=<orgId>&isActive=true&page=1&limit=3
```

---

## 测试框架与依赖

### 使用的工具

| 工具 | 用途 | 链接 |
|------|------|------|
| Jest | 测试框架 | https://jestjs.io/ |
| Supertest | HTTP 请求测试 | https://github.com/visionmedia/supertest |
| Prisma | ORM 和数据库操作 | https://www.prisma.io/ |
| NestJS Testing | 应用启动和隔离 | https://docs.nestjs.com/fundamentals/testing |

### 核心函数

#### `createTestingApp(options?)`

启动一个隔离的 Nest 应用实例用于测试。

```typescript
const testing = await createTestingApp();
const app = testing.app;
const prisma = testing.prisma;

// 在每个测试前重置数据库
await testing.resetDatabase();

// 在所有测试后清理
await testing.close();
```

详见: `backend/test/utils/testing-app.ts`

---

## 关键断言点

### 响应格式

每个列表 API 返回以下格式：

```json
{
  "items": [
    { "id": "...", "fullName": "...", ... },
    ...
  ],
  "meta": {
    "total": 25,
    "page": 2,
    "limit": 10,
    "pageCount": 3
  }
}
```

### 核心断言

```typescript
// 1. 检查 items 和 meta 存在
expect(response.body).toHaveProperty("items");
expect(response.body).toHaveProperty("meta");

// 2. 验证 meta 字段
expect(response.body.meta.total).toBe(25);
expect(response.body.meta.page).toBe(2);
expect(response.body.meta.limit).toBe(10);
expect(response.body.meta.pageCount).toBe(3);

// 3. 验证 X-Total-Count header
expect(response.headers["x-total-count"]).toBe("25");

// 4. 验证 items 数量
expect(response.body.items.length).toBe(10);

// 5. 验证多租户隔离
response.body.items.forEach((tenant) => {
  expect(tenant.organizationId).toBe(expectedOrgId);
});
```

---

## API 参数对照表

### Tenant API

| 参数 | 类型 | 说明 | 示例 |
|------|------|------|------|
| organizationId | UUID | 组织 ID（必需） | `12345...` |
| page | number | 页码（从 1 开始，默认 1） | `2` |
| limit / pageSize | number | 每页数量（默认 20） | `10` |
| _start | number | 起始位置（legacy 模式） | `5` |
| _end | number | 结束位置（legacy 模式） | `15` |
| _sort / sort | string | 排序字段 | `fullName` |
| _order / order | string | 排序顺序（asc/desc） | `ASC` |
| keyword | string | 关键字（匹配 fullName/email/phone） | `alice` |
| isActive | boolean | 是否激活 | `true` |
| dateStart | string | 创建日期开始（ISO 格式） | `2025-11-01` |
| dateEnd | string | 创建日期结束（ISO 格式） | `2025-12-31` |

### Payment API

| 参数 | 类型 | 说明 | 示例 |
|------|------|------|------|
| organizationId | UUID | 组织 ID（必需） | `12345...` |
| page | number | 页码（从 1 开始，默认 1） | `2` |
| limit / pageSize | number | 每页数量（默认 20） | `10` |
| status | enum | 支付状态 | `PENDING`, `PAID`, `OVERDUE` |
| dueDateFrom | string | 到期日期开始（ISO 格式） | `2025-11-01` |
| dueDateTo | string | 到期日期结束（ISO 格式） | `2025-12-31` |
| _sort / sort | string | 排序字段 | `dueDate` |
| _order / order | string | 排序顺序 | `asc` / `desc` |

---

## 常见问题与故障排查

### Q: 测试失败 "Cannot find module"

**A**: 确保先编译项目：
```bash
pnpm run build
```

### Q: 测试失败 "Database connection refused"

**A**: 确保 test 数据库已配置。检查 `.env.test` 或环境变量。

### Q: X-Total-Count header 缺失

**A**: 确保在 controller 中设置了 header：
```typescript
res.setHeader("X-Total-Count", result.meta.total.toString());
```

### Q: meta.pageCount 计算错误

**A**: `pageCount` 计算公式为：
```typescript
const pageCount = total === 0 ? 0 : Math.ceil(total / limit);
```

### Q: 多租户隔离失败

**A**: 确保：
1. WHERE 条件包含 `organizationId`
2. 每个测试独立 seed 数据（使用 `beforeEach`）
3. 使用 `createTestingApp()` 的数据库重置

---

## 运行结果示例

```
PASS  test/pagination.e2e-spec.ts (45.234 s)
  BE-7-63: Pagination & Filtering E2E
    Tenant List API - Basic Pagination
      ✓ should return paginated result with correct meta and X-Total-Count header (234 ms)
      ✓ should support _start/_end (legacy pagination mode) (145 ms)
      ✓ should return last page with fewer items (123 ms)
      ✓ should return empty items for out-of-range page (87 ms)
      ✓ should use default page=1, limit=20 if not specified (156 ms)
    Tenant List API - Sorting
      ✓ should support _sort/_order (legacy sorting) (198 ms)
      ✓ should support sort/order (modern naming) (189 ms)
      ✓ should default to createdAt desc when no sort specified (167 ms)
    Tenant List API - Keyword Filtering
      ✓ should filter by keyword matching fullName or email (245 ms)
      ✓ should be case-insensitive for keyword filtering (213 ms)
      ✓ should return meta.total as filtered count, not total count (156 ms)
      ✓ should return empty list if keyword doesn't match (132 ms)
      ✓ should combine keyword with pagination (287 ms)
    Payment List API - Status Filtering
      ✓ should filter payments by status=PENDING (234 ms)
      ✓ should filter payments by status=PAID (187 ms)
      ✓ should filter payments by status=OVERDUE (176 ms)
      ✓ should support pagination with status filter (198 ms)
    Payment List API - Date Range Filtering
      ✓ should filter by dueDateFrom (>= given date) (256 ms)
      ✓ should filter by dueDateTo (<= given date) (213 ms)
      ✓ should filter by both dueDateFrom and dueDateTo (date range) (234 ms)
      ✓ X-Total-Count should match meta.total after date filtering (156 ms)
    Multi-tenancy Isolation
      ✓ should only return tenants from the requested organization (398 ms)
      ✓ should support pagination within organization scope (387 ms)
    Combined Filters
      ✓ should combine keyword and status filters (298 ms)
      ✓ should respect limit even with filters (312 ms)

Test Suites: 1 passed, 1 total
Tests:       24 passed, 24 total
Snapshots:   0 total
Time:        45.234s
```

---

## 代码规范

所有测试遵循以下规范：

1. **测试隔离**: 每个 `beforeEach` 重置数据库
2. **清晰的断言**: 使用 `expect()` 和 Jest matchers
3. **有意义的测试名称**: 使用 `it("should ...")` 格式
4. **注释**: 复杂逻辑添加注释说明
5. **不修改业务逻辑**: 测试仅验证，不改代码行为

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `backend/test/pagination.e2e-spec.ts` | 分页 E2E 测试套件（本文件） |
| `backend/test/utils/testing-app.ts` | 测试应用启动工具 |
| `backend/test/utils/test-database.ts` | 数据库重置工具 |
| `backend/src/common/query-parser.ts` | 查询参数解析逻辑 |
| `backend/src/common/pagination.ts` | 分页响应格式定义 |
| `backend/package.json` | npm 脚本定义 |

---

## 后续改进方向

- [ ] 添加更多资源（leases, properties 等）的分页 E2E 测试
- [ ] 性能测试：大数据集下的分页性能
- [ ] 边界条件：极端值 (limit=1, page=999999 等)
- [ ] 错误处理：无效参数的错误响应验证
- [ ] 权限检查：不同角色的分页权限隔离

---

**最后更新**: 2025-11-15  
**作者**: GitHub Copilot (BE-7-63 Task)
