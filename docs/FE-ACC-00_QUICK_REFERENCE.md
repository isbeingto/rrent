# FE-ACC-00 快速参考手册

> 前端基座快速上手指南

---

## 🚀 快速启动

### 前置要求
```bash
# 检查版本
node --version  # ≥ 20.0.0
pnpm --version  # ≥ 10.0.0
```

### 安装依赖
```bash
cd /srv/rrent/frontend
pnpm install
```

### 启动开发服务器
```bash
pnpm run dev
# 或指定端口
pnpm run dev --port 3100
```

访问: `http://localhost:3100`

---

## 📝 可用脚本

| 命令 | 用途 | 说明 |
|------|------|------|
| `pnpm run dev` | 开发服务器 | 默认端口 3000 |
| `pnpm run build` | 生产构建 | 生成 `.next/` |
| `pnpm start` | 生产服务器 | 需先执行 build |
| `pnpm run lint` | Lint 检查 | ESLint 9 |
| `pnpm run type-check` | 类型检查 | TypeScript |

---

## ⚙️ 环境变量配置

### 1. 创建 `.env.local`
```bash
cp .env.example .env.local
```

### 2. 配置后端 API
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. 环境变量规则
- ✅ `NEXT_PUBLIC_*` → 浏览器可访问
- ❌ 无前缀 → 仅服务端可访问

---

## 🔌 API 调用示例

### 使用 API 客户端
```typescript
import { apiClient } from '@/lib/api-client';

// GET 请求
const data = await apiClient.get('/health');

// POST 请求
const result = await apiClient.post('/auth/login', {
  email: 'user@example.com',
  password: 'password',
});
```

### API 代理
```javascript
// 前端请求
fetch('/api/health')

// 自动代理到
http://localhost:3000/health
```

---

## 🎨 Tailwind CSS 使用

### 自定义颜色
```tsx
<div className="bg-primary-500 text-primary-50">
  使用自定义主色
</div>
```

### 色板
- `primary-50` 到 `primary-950`
- 默认蓝色系，可在 `tailwind.config.js` 修改

---

## 📁 项目结构

```
frontend/
├── app/                # Next.js App Router
│   ├── layout.tsx     # 根布局
│   ├── page.tsx       # 首页
│   └── globals.css    # 全局样式
├── components/        # React 组件
│   └── ui/           # UI 组件库
├── lib/              # 工具函数
│   └── api-client.ts # API 客户端
├── public/           # 静态资源
├── package.json      # 项目配置
├── next.config.js    # Next.js 配置
├── tsconfig.json     # TypeScript 配置
└── .env.local        # 本地环境变量
```

---

## 🔧 常见问题

### 问题 1: 端口被占用
```bash
# 错误: Error: listen EADDRINUSE: address already in use :::3000

# 解决方案 1: 指定其他端口
pnpm run dev --port 3100

# 解决方案 2: 杀死占用进程
lsof -ti:3000 | xargs kill -9
```

### 问题 2: 类型错误
```bash
# 清理并重新生成类型
rm -rf .next
pnpm run type-check
```

### 问题 3: 依赖冲突
```bash
# 清理并重新安装
rm -rf node_modules .next
pnpm install
```

### 问题 4: 环境变量不生效
```bash
# 1. 确保文件名正确: .env.local
# 2. 变量名必须以 NEXT_PUBLIC_ 开头（浏览器访问）
# 3. 重启开发服务器
```

### 问题 5: ESLint 错误
```bash
# 运行 Lint 修复
pnpm run lint --fix

# 如果是配置问题，检查 eslint.config.mjs
```

---

## 🧪 测试配置

### 类型检查
```bash
pnpm run type-check
```

### Lint 检查
```bash
pnpm run lint
```

### 构建测试
```bash
pnpm run build
```

---

## 📦 新增依赖

### UI 库示例
```bash
pnpm add lucide-react class-variance-authority clsx tailwind-merge
```

### 状态管理
```bash
pnpm add zustand
```

### 表单处理
```bash
pnpm add react-hook-form zod
```

---

## 🔒 安全配置

### 环境变量
- ❌ 不要提交 `.env.local`
- ✅ 提交 `.env.example` 作为模板
- ❌ 敏感信息不要使用 `NEXT_PUBLIC_` 前缀

### API 密钥
```bash
# .env.local (不提交)
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key

# ❌ 错误: 这会暴露给浏览器
NEXT_PUBLIC_JWT_SECRET=your-secret-key
```

---

## 🚢 部署

### 构建生产版本
```bash
pnpm run build
```

### 运行生产服务器
```bash
pnpm start
```

### Docker 部署
```bash
# Dockerfile 示例
FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build
EXPOSE 3000
CMD ["pnpm", "start"]
```

---

## 📚 参考资源

### 官方文档
- [Next.js 15 文档](https://nextjs.org/docs)
- [React 19 文档](https://react.dev)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [TypeScript 文档](https://www.typescriptlang.org/docs)

### 项目相关
- 实施报告: `FE-ACC-00_IMPLEMENTATION.md`
- 验收摘要: `FE-ACC-00_SUMMARY.md`
- 后端 API: `http://localhost:3000/health`

---

## 🛠️ 开发工作流

### 1. 创建新页面
```bash
# 创建文件
touch app/about/page.tsx

# 编辑内容
export default function AboutPage() {
  return <div>About Page</div>;
}

# 访问 http://localhost:3000/about
```

### 2. 创建新组件
```bash
# 创建文件
touch components/ui/card.tsx

# 使用组件
import { Card } from '@/components/ui/card';
```

### 3. 调用 API
```typescript
// app/users/page.tsx
import { apiClient } from '@/lib/api-client';

export default async function UsersPage() {
  const users = await apiClient.get('/users');
  return <div>{JSON.stringify(users)}</div>;
}
```

---

## ⚡ 性能优化

### 图片优化
```tsx
import Image from 'next/image';

<Image 
  src="/logo.png" 
  alt="Logo" 
  width={200} 
  height={100}
  priority
/>
```

### 代码分割
```tsx
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('@/components/heavy'), {
  loading: () => <p>Loading...</p>,
  ssr: false
});
```

### 缓存策略
```tsx
// 静态生成
export const revalidate = 3600; // 1小时

// 动态渲染
export const dynamic = 'force-dynamic';
```

---

## 🎓 最佳实践

### 1. 组件组织
```
components/
├── ui/          # 通用 UI 组件
├── layout/      # 布局组件
├── forms/       # 表单组件
└── features/    # 业务组件
```

### 2. 命名规范
- 组件: `PascalCase.tsx`
- 工具函数: `camelCase.ts`
- 常量: `UPPER_SNAKE_CASE.ts`

### 3. 类型定义
```typescript
// types/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
}
```

### 4. 错误处理
```typescript
try {
  const data = await apiClient.get('/users');
} catch (error) {
  console.error('Failed to fetch users:', error);
}
```

---

**文档版本**: 1.0.0  
**最后更新**: 2025-11-15  
**维护者**: RRent Team
