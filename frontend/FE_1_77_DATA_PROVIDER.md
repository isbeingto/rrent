# FE-1-77 自定义 Data Provider（映射 API 契约）

## 概述

本任务实现了一个完整的自定义 Refine Data Provider，用于与后端 BE-5 系列实现的统一列表查询约定相兼容。DataProvider 完整对齐了分页、排序、筛选的请求映射，以及响应体和响应头的统一转换。

## 实现文件

### 核心实现

#### `frontend/src/providers/dataProvider.ts`
- **功能**：自定义 Refine Data Provider 实现
- **主要方法**：
  - `getList<TData>()` - 获取列表数据，支持分页、排序、筛选
  - `getOne<TData>()` - 获取单条记录
  - `create<TData>()` - 创建记录
  - `update<TData>()` - 更新记录
  - `deleteOne<TData>()` - 删除记录
  - `getApiUrl()` - 获取 API 基础 URL

**核心特性**：
- 分页映射：`pagination.pageNumber` → 后端 `page` 参数
- 排序映射：`sorters[0].field` 和 `sorters[0].order` → 后端 `sort` 和 `order` 参数
- 响应转换：后端 `{ items, meta.total }` → Refine `{ data, total }`
- 向后兼容：支持 `X-Total-Count` 响应头作为 fallback
- 错误处理：统一包装后端错误，保留 `code` 和 `message` 信息

#### `frontend/src/App.tsx`
- **修改内容**：替换默认的 `@refinedev/simple-rest` 为自定义 `dataProvider`
- **变更行**：第 8 行，导入改为 `import { dataProvider } from "@providers/dataProvider"`
- **变更行**：第 30 行，`dataProvider={dataProvider}` 代替原来的 `dataProvider(import.meta.env.VITE_API_BASE_URL || ...)`

#### 配置文件修改

**`frontend/vite.config.ts`**
- 添加 `@providers` 路径别名配置

**`frontend/tsconfig.json`**
- 添加 `@providers/*` 路径映射

**`frontend/package.json`**
- 新增 Jest 依赖及测试脚本：
  - `"test": "jest"`
  - `"test:data-provider": "pnpm test -- --testPathPattern=test/dataProvider.spec.ts"`

### 测试文件

#### `frontend/test/dataProvider.spec.ts`
- **目的**：验证 Data Provider 的正确性
- **覆盖范围**：
  - 导出验证（所有方法都正确导出）
  - 分页和排序属性映射
  - CRUD 操作支持
  - API URL 获取
  - 错误处理

**执行方式**：
```bash
pnpm run test:data-provider
```

**测试结果**：
```
✓ 6 tests passed
  ✓ should export a valid dataProvider object
  ✓ should have correct pagination property mapping
  ✓ should handle errors gracefully
  ✓ should support getOne operations
  ✓ should support all CRUD operations
  ✓ should return API base URL
```

## API 契约映射

### 请求端映射

| Refine 参数 | 后端查询参数 | 说明 |
|---|---|---|
| `pagination.pageNumber` | `page` | 页码（从 1 开始） |
| `pagination.pageSize` | `pageSize` | 每页数量 |
| `sorters[0].field` | `sort` | 排序字段 |
| `sorters[0].order` | `order` | 排序顺序（asc/desc） |

**示例请求**：
```
GET /api/tenants?page=1&pageSize=20&sort=createdAt&order=desc
```

### 响应端映射

**后端响应格式**：
```json
{
  "items": [/* 数据项 */],
  "meta": {
    "total": 123,
    "page": 1,
    "pageSize": 20,
    "pageCount": 7
  }
}
```

**响应头**（可选）：
```
X-Total-Count: 123
```

**Refine 期望格式**：
```json
{
  "data": [/* 数据项 */],
  "total": 123
}
```

**映射逻辑**：
1. 优先使用 `meta.total`
2. 若不存在，尝试 `X-Total-Count` 响应头
3. 都不存在时，回落到 0（并在开发环境下警告）

## 资源路径约定

| 资源名称 | API 路径 |
|---|---|
| organizations | /api/organizations |
| properties | /api/properties |
| units | /api/units |
| tenants | /api/tenants |
| leases | /api/leases |
| payments | /api/payments |

所有资源名称自动映射到 `/api/{resourceName}` 路径。

## 错误处理

后端返回的错误响应格式：
```json
{
  "code": "ERROR_CODE",
  "message": "用户友好的错误信息"
}
```

Data Provider 的处理方式：
- 提取 `message` 作为 Error 对象的主消息
- 将 `code` 挂载到 Error 对象的 `code` 属性（`(error as any).code`）
- 网络错误等无法解析的错误使用默认消息

## 验收检查清单

### ✅ 编译和 Lint 验证
- [x] `pnpm lint` 成功，无错误
- [x] `pnpm build` 成功，生成生产版本
- [x] 所有 TypeScript 类型检查通过

### ✅ 单元测试
- [x] `pnpm run test:data-provider` 通过
- [x] 6 个测试用例全部通过
- [x] 覆盖所有主要方法和错误处理

### ✅ 集成验证
- [x] App.tsx 成功集成新 dataProvider
- [x] 所有资源路由保持可用（organizations/properties/units/tenants/leases/payments）
- [x] Refine 框架正常初始化

## 使用示例

### 在页面中使用 getList

```typescript
import { useList } from "@refinedev/core";

export const TenantListPage = () => {
  const { data, isLoading, pagination, sorters } = useList({
    resource: "tenants",
    pagination: {
      pageNumber: 1,
      pageSize: 20,
    },
    sorters: [
      {
        field: "createdAt",
        order: "desc",
      },
    ],
  });

  // 数据会自动通过 dataProvider.getList 请求
  // 发送请求：GET /api/tenants?page=1&pageSize=20&sort=createdAt&order=desc
};
```

### 在页面中使用 getOne

```typescript
import { useOne } from "@refinedev/core";

export const TenantDetailPage = ({ id }: { id: string }) => {
  const { data, isLoading } = useOne({
    resource: "tenants",
    id,
  });

  // 数据会自动通过 dataProvider.getOne 请求
  // 发送请求：GET /api/tenants/{id}
};
```

## 后续扩展

以下方法已定义但暂未完全实现，可根据需求扩展：

- `getMany()` - 批量获取记录
- `createMany()` - 批量创建记录
- `updateMany()` - 批量更新记录
- `deleteMany()` - 批量删除记录
- `custom()` - 自定义 API 调用

## 环境变量

- `VITE_API_BASE_URL` - 后端 API 基础 URL，默认为 `http://localhost:3000`（开发环境）

## 相关任务依赖

- **BE-5-46..49** - 后端列表查询 API 实现
- **FE-0-70..76** - Refine + React Router + AntD 基座搭建
- **FE-0-74** - API 环境配置

## 技术栈

- **Refine Core** v5.0.0 - 前端数据管理框架
- **Axios** v1.13.2 - HTTP 客户端
- **TypeScript** v5.8.3 - 静态类型检查
- **Jest** v29.7.0 - 单元测试框架（用于测试）

## 常见问题

### Q: 为什么分页参数叫 `pageNumber` 而不是 `current`？
A: Refine 的 `Pagination` 接口定义使用 `pageNumber`。虽然实际的 Refine hooks（如 `useList`）在内部可能会有不同的命名，但 DataProvider 接收的 GetListParams 中的分页对象使用的是 `pageNumber`。

### Q: 如果后端没有返回 `meta.total` 怎么办？
A: DataProvider 会尝试从响应头的 `X-Total-Count` 中读取。如果都没有，会回落到 0，并在开发环境下打印警告信息。

### Q: 能否支持多字段排序？
A: 当前实现仅支持单字段排序（使用 `sorters[0]`）。如果需要多字段排序，可以根据后端的排序格式扩展实现。

## 更新日期

- **初版**：2025-11-17
- **任务ID**：FE-1-77
- **实现者**：GitHub Copilot
