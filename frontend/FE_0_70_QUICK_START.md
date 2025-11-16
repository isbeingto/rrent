# FE_0_70_QUICK_START.md - 前端工程初始化快速指南

本文档说明如何快速启动和开发 Rrent 前端工程，该工程基于 **Refine + React + Vite + TypeScript + Ant Design** 搭建。

---

## 快速开始

### 前置需求

- **Node.js**: >= 18.0.0
- **pnpm**: >= 10.0.0（推荐）

### 开发模式启动

```bash
cd frontend

# 安装依赖（首次）
pnpm install

# 启动开发服务器
pnpm dev
# 浏览器打开 http://localhost:5173
```

### 构建生产版本

```bash
cd frontend

# Lint + TypeScript 检查 + 构建
pnpm lint
pnpm type-check
pnpm build

# 预览构建结果
pnpm preview
```

---

## 环境变量配置

### 创建 .env.local

基于 `.env.example` 创建本地配置文件：

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
# API 服务基础 URL
VITE_API_BASE_URL=http://localhost:3000/api

# 应用环境
VITE_APP_ENV=development
```

**注意**: `.env` 和 `.env.*.local` 已被添加到 `.gitignore`，不会被提交到仓库。

### 环境变量说明

| 变量名              | 说明              | 示例值                       |
| ------------------- | ----------------- | ---------------------------- |
| `VITE_API_BASE_URL` | 后端 API 服务地址 | `http://localhost:3000/api`  |
| `VITE_APP_ENV`      | 应用运行环境      | `development` / `production` |

在代码中通过 `import.meta.env.VITE_API_BASE_URL` 访问。

---

## 项目结构

```
frontend/
├── src/
│   ├── main.tsx              # 应用入口
│   ├── App.tsx               # 主应用组件（Refine 配置点）
│   ├── shared/
│   │   └── api/
│   │       └── http.ts       # Axios 实例（Data Provider 占位）
│   ├── components/           # UI 组件
│   │   ├── header/
│   │   └── ...
│   ├── contexts/             # React Context
│   │   └── color-mode/
│   ├── pages/                # 页面组件（后续添加）
│   └── ...
├── public/                   # 静态资源
├── .env.example              # 环境变量模板
├── .gitignore                # Git 忽略规则（含 .env）
├── tsconfig.json             # TypeScript 配置（strict + 路径别名）
├── vite.config.ts            # Vite 构建配置
├── eslint.config.js          # ESLint 规则
└── package.json              # 项目配置与脚本
```

---

## 工程化配置

### TypeScript 严格模式

`tsconfig.json` 已启用 `"strict": true`，确保类型安全：

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### 路径别名

支持以下路径别名，避免相对路径混乱：

```typescript
// 推荐用法
import httpClient from "@shared/api/http";
import { MyComponent } from "@components/my-component";
import { HomePage } from "@pages/home";

// 而不是
import httpClient from "../../shared/api/http";
```

**别名映射** (`tsconfig.json` + `vite.config.ts`)：

| 别名            | 映射路径           |
| --------------- | ------------------ |
| `@/*`           | `src/*`            |
| `@shared/*`     | `src/shared/*`     |
| `@components/*` | `src/components/*` |
| `@pages/*`      | `src/pages/*`      |

### ESLint 与 Prettier

```bash
# Lint 检查（0 warning 容限）
pnpm lint

# 自动修复
pnpm lint:fix

# TypeScript 类型检查
pnpm type-check
```

---

## 初始化选项（已选定）

本项目在 `pnpm create-refine-app@latest` 时选择如下配置：

- **框架**: React + Vite + TypeScript
- **UI 框架**: Ant Design 5.x
- **路由**: React Router v7
- **状态/数据**: @tanstack/react-query（Refine 内置）
- **认证**: 暂无（预留 TODO，后续 FE-0-72 接入）
- **国际化**: 暂无（后续按需添加）
- **包管理器**: pnpm

---

## HTTP 客户端与 Data Provider

### 当前状态

- **HTTP 实例**: `src/shared/api/http.ts` 已创建，导出 Axios 基础实例
  - 自动读取 `VITE_API_BASE_URL` 环境变量
  - 预设 10s 超时、JSON 内容类型等基础配置
  - **仅为占位**，暂无请求拦截器或认证逻辑

### 后续集成（FE-0-71 / FE-0-72）

#### FE-0-71: 替换 Refine Data Provider

将 Refine 的 `@refinedev/simple-rest` 替换为基于 Axios 的自定义 Data Provider：

```typescript
// 示例（伪代码）
import { Refine } from "@refinedev/core";
import { httpClient } from "@shared/api/http";

const customDataProvider = {
  getList: async (resource, params) => {
    const response = await httpClient.get(`/${resource}`, { params });
    return { data: response.data.items, total: response.data.total };
  },
  // ... 其他方法
};

export default function App() {
  return (
    <Refine dataProvider={customDataProvider}>
      {/* ... */}
    </Refine>
  );
}
```

#### FE-0-72: 认证与令牌拦截

在 `http.ts` 中添加请求/响应拦截器：

```typescript
// 示例（伪代码）
httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 重定向到登录页
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

---

## Refine 布局与资源注册

### 布局（Layout）

Refine 支持 `@refinedev/antd` 提供的 `ThemedLayout`（当前示例不使用，后续可按需集成）：

```typescript
// App.tsx 或路由内使用
import { ThemedLayout } from "@refinedev/antd";

<Refine ...>
  <Routes>
    <Route element={<ThemedLayout><Outlet /></ThemedLayout>}>
      <Route path="/posts" element={<PostsList />} />
      <Route path="/posts/:id" element={<PostsShow />} />
    </Route>
  </Routes>
</Refine>
```

### 资源注册（Resource）

在 `App.tsx` 中声明资源（如 organizations、properties、units 等）：

```typescript
// 占位示例
<Refine dataProvider={...}>
  <Routes>
    {/* 后续通过 createRoutesForResources 或手动声明 */}
  </Routes>
</Refine>

// 或使用 Refine 的资源声明 API（@refinedev/core）
<Refine
  resources={[
    { name: "organizations" },
    { name: "properties" },
    { name: "units" },
    // ...
  ]}
  ...
>
```

当前 `App.tsx` 中已添加 TODO 注释标记布局与资源注册位置。

---

## 常见问题 (FAQ)

### Q1: 如何添加新页面？

1. 在 `src/pages/` 创建页面组件（如 `OrganizationsList.tsx`）
2. 在 `App.tsx` 的路由中注册
3. 若需要 Refine 的资源功能，在 `resources` 配置中声明

### Q2: 如何配置不同环境的 API URL？

创建对应的 `.env` 文件：

- `.env.local` - 本地开发
- `.env.staging.local` - Staging 环境
- `.env.production.local` - 生产环境

在构建时指定：

```bash
VITE_APP_ENV=staging pnpm build
```

### Q3: 如何在组件中使用 Axios？

```typescript
import httpClient from "@shared/api/http";

export async function fetchOrganizations() {
  const response = await httpClient.get("/organizations");
  return response.data;
}
```

### Q4: ESLint 报 warning，如何处理？

```bash
# 查看具体问题
pnpm lint

# 自动修复（若可自动修复）
pnpm lint:fix

# 若需调整规则，编辑 eslint.config.js
```

---

## CORS 与联调

### 开发时 CORS 配置

前端运行在 `http://localhost:5173`，后端 API 运行在 `http://localhost:3000`。

确保后端 CORS 白名单包含：

```
http://localhost:5173
```

（详见后端 TASK 43 的 CORS 配置）

### 使用 Vite 反向代理（可选）

若不想修改后端 CORS，可在 `vite.config.ts` 中配置代理：

```typescript
export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
  },
});
```

然后 `.env.local` 改为：

```env
VITE_API_BASE_URL=http://localhost:5173/api
```

---

## 部署与发布

### Docker 构建

项目包含 `Dockerfile`，可用于容器化部署：

```bash
docker build -t rrent-frontend:latest .
docker run -p 3100:80 rrent-frontend:latest
```

### 环境变量与构建时注入

Vite 的环境变量在**构建时**被硬编码到产物中。若需在运行时动态配置，需额外处理（如 `public/config.json` 或服务端渲染）。

---

## 后续迭代计划

| 任务    | 说明                                                         |
| ------- | ------------------------------------------------------------ |
| FE-0-71 | 替换 Refine Data Provider 为 Axios 实现，实现真正的 API 对接 |
| FE-0-72 | 接入认证系统（登录、JWT 令牌、拦截器）                       |
| FE-0-73 | 资源模块骨架（organizations/properties/units 等列表页）      |
| FE-1-\* | 具体功能页面开发（CRUD、表单、筛选等）                       |

---

## 参考资源

- [Refine 官方文档](https://refine.dev/docs/)
- [Ant Design 组件库](https://ant.design/components/overview/)
- [React Router v7 文档](https://reactrouter.com/)
- [Vite 文档](https://vitejs.dev/)
- [TypeScript 严格模式](https://www.typescriptlang.org/tsconfig#strict)
- [Axios 文档](https://axios-http.com/)

---

## 支持与反馈

如有问题或建议，请联系开发团队或提交 Issue。

---

**最后更新**: 2025-11-16  
**维护者**: Rrent 开发团队
