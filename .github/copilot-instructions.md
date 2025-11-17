# GitHub Copilot / AI 代理使用说明（rrent）

本项目是 **R-RENT 公寓租赁 SaaS** 的单仓库，包含：
- `backend/`：NestJS + Prisma + PostgreSQL 多租户 API
- `frontend/`：Refine + React Router + Ant Design 管理后台

以下约定用于指导 AI 代理在本仓库中高效、安全地工作。

---

## 1. 架构总览与关键目录

- **Backend（NestJS）**
  - 入口与配置：`backend/src/main.ts`, `backend/src/app.module.ts`, `backend/prisma/schema.prisma`
  - 业务模块：`backend/src/modules/*`（`auth`, `organization`, `property`, `unit`, `tenant`, `lease`, `payment`, `user` 等）
  - 通用能力：`backend/src/common/*`（装饰器、守卫、过滤器、多租户上下文等）
  - Prisma 集成：`backend/src/prisma/prisma.service.ts`, `backend/prisma/*`
  - 调度任务：`backend/src/scheduler/*`
  - 测试：`backend/test/*`（单元 + E2E），基础说明见 `BE_7_TEST_BASE_QUICK_REFERENCE.md`

- **Frontend（Refine）**
  - 入口：`frontend/src/main.tsx`, `frontend/src/App.tsx`
  - 自定义 Data Provider：`frontend/src/providers/dataProvider.ts`（说明见 `FE_1_77_DATA_PROVIDER.md`）
  - 路由与页面：`frontend/src/app/*`, `frontend/src/components/*`
  - 配置：`frontend/vite.config.ts`, `frontend/tsconfig.json`, `frontend/FE_0_74_API_ENV.md`

AI 代理在分析或修改代码前，应优先查阅：
- `backend/README.md`（后端整体说明 + 常用命令）
- `frontend/README.MD` + `frontend/FE_*` 文档（前端基座与任务说明）

---

## 2. 运行、构建与测试工作流

**后端常用命令（在 `backend/` 目录）**：
- 依赖安装：`pnpm install`
- 开发启动：`pnpm run start:dev`
- 构建：`pnpm run build`
- 单元 / E2E 测试：`pnpm test`
- 覆盖率：`pnpm run test:cov`（基线见 `BE_7_COVERAGE_BASELINE.md`）
- 专项测试：
  - 分页 E2E：`pnpm run test:pagination`（参考 `BE_7_PAGINATION_E2E_QUICK_REFERENCE.md`）
  - 认证烟囱：`pnpm run test:auth-smoke`
- Prisma：`pnpm prisma migrate dev`, `pnpm prisma generate`, `pnpm prisma studio`
- Docker 验证：`./verify-docker.sh`

**前端常用命令（在 `frontend/` 目录）**：
- 开发启动：`pnpm run dev`（或脚本 `./start-dev.sh`）
- 构建：`pnpm run build`
- 单元测试：`pnpm test`
- Data Provider 专项测试：`pnpm run test:data-provider`（见 `FE_1_77_DATA_PROVIDER.md`）

在编写或修改代码后，AI 代理应：
- 对后端改动：优先运行相关 Jest 测试文件，必要时运行 `pnpm test` 或 `pnpm run test:pagination`。
- 对前端 `dataProvider` / 逻辑改动：运行 `pnpm run test:data-provider` 或相关测试脚本。

---

## 3. 后端设计约定与模式

1. **模块化 + DDD-ish 分层**
   - 每个业务域在 `backend/src/modules/<domain>` 下包含 `*.controller.ts`, `*.service.ts`, `dto/` 等。
   - 新增业务功能时，优先在现有模块内扩展；必要时按此结构创建新模块。

2. **多租户与 Prisma 扩展**
   - 多租户上下文通过 `backend/src/common/tenant/tenant-context.ts` 和 `backend/src/prisma/tenant-middleware.ts` 注入。
   - 所有数据库访问应通过注入的 `PrismaService`，不要直接实例化 `PrismaClient`。
   - 测试中复用 `TestingApp.prisma`（见 `BE_7_TEST_BASE_QUICK_REFERENCE.md`），避免创建额外 Prisma 客户端。

3. **分页 / 筛选 / 排序约定**
   - 列表接口返回统一结构：
     ```json
     { "items": [...], "meta": { "total": number, "page": number, "limit": number, "pageCount": number } }
     ```
   - 同时设置 `X-Total-Count` 响应头，使前端兼容。
   - Query 参数支持：`page`, `limit`（或 `_start`, `_end` 兼容模式）、`sort`/`order` 与 `_sort`/`_order`、`keyword`、业务相关过滤字段（如 `status`, `dueDateFrom`, `dueDateTo`）。
   - 任何新列表接口必须与 `BE_7_PAGINATION_E2E_QUICK_REFERENCE.md` 中的约定保持一致，并补充/扩展对应测试。

4. **测试基座与覆盖率要求**
   - E2E / 集成测试使用 `backend/test/utils/testing-app.ts` 提供的 `createTestingApp()`。
   - `.env.test` 配置见 `backend/.env.test.example`，测试默认使用隔离数据库。
   - 新增或修改服务逻辑时，应在对应 `*.spec.ts` 或 E2E 测试中覆盖主要分支路径，优先提升 `branch` 和 `function` 覆盖率（参考 `BE_7_COVERAGE_BASELINE.md`）。

5. **错误处理与异常约定**
   - 统一使用 `backend/src/common/errors/*` 中定义的异常类及 HTTP 异常过滤器，而非随意抛出原生错误。
   - 新增错误类型时，应更新 `ERROR_CODE_VERIFICATION.md` 中的约定（如存在）并补充测试。

---

## 4. 前端 Refine 集成约定

1. **自定义 Data Provider**
   - 统一通过 `frontend/src/providers/dataProvider.ts` 调用后端 API，禁止在页面中直接使用裸 `fetch/axios` 访问业务资源。
   - `getList` 必须遵守 `FE_1_77_DATA_PROVIDER.md` 描述的映射：
     - 请求：Refine 的 `pagination.pageNumber/pageSize`、`sorters[0]` 等 → 后端 `page/pageSize/sort/order`。
     - 响应：后端 `{ items, meta.total }` 或 `X-Total-Count` → Refine `{ data, total }`。
   - 新资源默认路径为 `/api/<resourceName>`（如 `tenants` → `/api/tenants`）。

2. **路由与资源命名**
   - Refine 中的 `resource` 名称应与后端 REST 资源路径一致（`organizations`, `properties`, `units`, `tenants`, `leases`, `payments`）。
   - 新增页面时，优先在 `App.tsx` 中以 Refine 的 `resources` 配置注册。

3. **错误处理与用户提示**
   - Data Provider 会将后端错误的 `code` / `message` 保留在 Error 对象中；页面层可根据 `code` 做细粒度处理，但不应篡改后端语义。

---

## 5. 环境变量与本地运行

- 后端环境变量示例见 `backend/.env.example`, `.env.docker.example`。
- 前端通过 `VITE_API_BASE_URL` 指定后端地址（默认 `http://localhost:3000`）。
- AI 代理在修改依赖环境（新增变量、改变默认 URL 等）时，必须：
  - 同步更新相关 `*.example` 文件和文档（如 `FE_0_74_API_ENV.md`、`backend/README.md`）。

---

## 6. 对 AI 代理的具体指引

- 在修改任何模块前，先查阅对应 `BE_*` / `FE_*` 文档，保持实现风格与现有任务一致。
- 添加新后端接口时：
  - 放在相关模块 `controller` + `service` 中，复用现有 DTO / 验证模式。
  - 保持返回结构与分页/多租户约定对齐，并更新/新增 Jest 测试。
- 添加新前端功能时：
  - 通过 Refine 的 hooks（`useList`, `useOne`, `useCreate` 等）调用 `dataProvider`。
  - 避免引入与现有技术栈不一致的大型新依赖，除非任务明确要求。
- 任何涉及数据流的改动，应同时考虑：后端 API 契约 → Data Provider 映射 → 页面组件使用链路，避免只改其中一端。

如有不确定的约定（特别是测试/覆盖率或 API 契约），优先在相关 `BE_*` / `FE_*` 文档和现有实现中查找类似模式，再进行扩展。
