# RRent Backend

> NestJS + TypeScript + Prisma + PostgreSQL

高性能的房屋租赁管理系统后端 API 服务。

---

## 🚀 快速开始

### 开发环境

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm run start:dev

# 运行测试
pnpm test

# 生成测试覆盖率报告
pnpm run test:cov
```

### Docker 部署

```bash
# 构建镜像
docker build -t rrent-backend:dev .

# 运行容器
docker run --rm -p 3000:3000 \
  --env-file .env.docker \
  rrent-backend:dev
```

详细的 Docker 使用说明请参考 [BE_8_DOCKERFILE_NOTES.md](./BE_8_DOCKERFILE_NOTES.md)

---

## 📁 项目结构

```
backend/
├── src/
│   ├── modules/          # 业务模块
│   │   ├── auth/         # 认证授权
│   │   ├── organization/ # 组织管理
│   │   ├── property/     # 物业管理
│   │   ├── tenant/       # 租户管理
│   │   ├── lease/        # 租约管理
│   │   └── payment/      # 支付管理
│   ├── common/           # 通用工具
│   │   ├── decorators/   # 装饰器
│   │   ├── guards/       # 守卫
│   │   ├── filters/      # 过滤器
│   │   └── interceptors/ # 拦截器
│   ├── prisma/           # Prisma 服务
│   └── main.ts           # 应用入口
├── prisma/
│   ├── schema.prisma     # 数据库模型
│   └── migrations/       # 数据库迁移
├── test/                 # 测试文件
├── Dockerfile            # Docker 多阶段构建
├── .dockerignore         # Docker 忽略文件
└── package.json
```

---

## 🧪 测试

### 单元测试

```bash
# 运行所有单元测试
pnpm test

# 运行特定测试文件
pnpm test user.service.spec.ts

# 监听模式
pnpm test --watch
```

### E2E 测试

```bash
# 认证流程测试
pnpm run test:auth-smoke

# 业务流程测试
pnpm run test:payment-flow

# 分页测试
pnpm run test:pagination
```

### 测试覆盖率

```bash
# 生成覆盖率报告
pnpm run test:cov

# 查看 HTML 报告
open coverage/lcov-report/index.html
```

当前覆盖率基线：详见 [BE_7_COVERAGE_BASELINE.md](./BE_7_COVERAGE_BASELINE.md)

---

## 🔧 技术栈

- **框架**: NestJS 10.x
- **语言**: TypeScript 5.x
- **数据库**: PostgreSQL 14+
- **ORM**: Prisma 6.x
- **认证**: JWT + Passport
- **包管理**: pnpm
- **测试**: Jest + Supertest
- **运行时**: Node.js 20

---

## 📚 文档索引

### 核心文档
- [项目状态](./PROJECT_STATUS.md) - 整体进度和里程碑
- [Docker 部署指南](./BE_8_DOCKERFILE_NOTES.md) - 容器化部署完整说明

### 开发指南
- [测试基座快速参考](./BE_7_TEST_BASE_QUICK_REFERENCE.md)
- [分页功能 E2E 参考](./BE_7_PAGINATION_E2E_QUICK_REFERENCE.md)
- [验收测试报告](./BE_ACC_02_ACCEPTANCE_REPORT.md)

### 覆盖率报告
- [覆盖率基线](./BE_7_COVERAGE_BASELINE.md)
- [覆盖率阈值](./BE_7_COVERAGE_THRESHOLD.md)

---

## 🔐 环境变量

主要环境变量（完整列表见 `.env.docker.example`）：

| 变量 | 说明 | 示例 |
|------|------|------|
| `NODE_ENV` | 运行环境 | `development` / `production` |
| `DATABASE_URL` | 数据库连接 | `postgresql://user:pass@localhost:5432/rrent` |
| `JWT_SECRET` | JWT 密钥 | `your-secret-key` |
| `PORT` | 服务端口 | `3000` |

---

## 🛠️ 常用命令

```bash
# 数据库相关
pnpm prisma migrate dev      # 创建并应用迁移
pnpm prisma generate          # 生成 Prisma Client
pnpm prisma studio            # 打开数据库管理界面

# 代码质量
pnpm run lint                 # 代码检查
pnpm run format               # 代码格式化

# 构建
pnpm run build                # 编译到 dist/
pnpm run start:prod           # 启动生产版本

# Docker
docker build -t rrent-backend:dev .          # 构建镜像
./verify-docker.sh                           # 验证 Docker 配置
```

---

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

---

## 📄 License

MIT

---

## 📧 联系方式

- 项目仓库: [github.com/isbeingto/rrent](https://github.com/isbeingto/rrent)
- 问题反馈: [Issues](https://github.com/isbeingto/rrent/issues)

---

**Last Updated**: 2025-11-15
