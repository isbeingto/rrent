# RRent Frontend

> Next.js 15 + TypeScript + Tailwind CSS

高性能房屋租赁管理系统的前端应用。

## 🚀 快速开始

### 开发环境

```bash
# 安装依赖
pnpm install

# 复制环境变量
cp .env.example .env.local

# 启动开发服务器
pnpm run dev
```

访问 [http://localhost:3100](http://localhost:3100)

### 构建

```bash
# 生产构建
pnpm run build

# 启动生产服务器
pnpm run start
```

## 📁 项目结构

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页
│   └── globals.css        # 全局样式
├── components/            # React 组件
│   └── HealthCheck.tsx    # 健康检查组件
├── lib/                   # 工具库
│   └── api.ts             # API 客户端
├── public/                # 静态资源
│   └── favicon.svg        # 网站图标
├── next.config.js         # Next.js 配置
├── tsconfig.json          # TypeScript 配置
├── tailwind.config.js     # Tailwind 配置
├── postcss.config.js      # PostCSS 配置
├── eslint.config.mjs      # ESLint 配置
├── env.d.ts               # 环境变量类型
└── package.json           # 项目依赖
```

## 🔧 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript 5
- **样式**: Tailwind CSS 3
- **包管理**: pnpm
- **代码检查**: ESLint + Prettier

## 📚 文档

- [Next.js 文档](https://nextjs.org/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [TypeScript 文档](https://www.typescriptlang.org/docs)

## 🔗 环境变量

参考 `.env.example` 文件配置环境变量：

- `NEXT_PUBLIC_APP_NAME` - 应用名称
- `NEXT_PUBLIC_APP_VERSION` - 应用版本
- `NEXT_PUBLIC_API_URL` - 后端 API 地址

## 🛠️ 开发命令

```bash
pnpm run dev          # 开发服务器
pnpm run build        # 生产构建
pnpm run start        # 生产服务器
pnpm run lint         # 代码检查
pnpm run type-check   # 类型检查
pnpm run format       # 代码格式化
```

## 📝 License

MIT
