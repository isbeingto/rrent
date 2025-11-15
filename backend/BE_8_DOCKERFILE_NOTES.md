# Backend Docker 镜像构建与部署说明

> **Task**: BE-8-65 | Backend Dockerfile（多阶段构建）  
> **Created**: 2025-11-15  
> **Status**: ✅ 已完成

---

## 📋 概述

为 RRent 后端服务创建了生产级的多阶段 Docker 镜像，使用 Node.js 20 + pnpm + Prisma 技术栈。

### 镜像架构

采用 **4 阶段构建**策略：

1. **base** - 基础环境（Node.js 20 + pnpm + OpenSSL）
2. **deps** - 依赖安装（使用锁文件保证可复现性）
3. **build** - 应用编译（TypeScript → JavaScript）
4. **runtime** - 生产运行（仅包含必需文件，最小化体积）

### 技术特性

- ✅ 基于 `node:20-slim`（避免 Alpine + Prisma 兼容性问题）
- ✅ 使用 `corepack` 启用 pnpm
- ✅ 分层缓存优化（依赖变化时不重新构建源码）
- ✅ 非 root 用户运行（安全性）
- ✅ 内置健康检查
- ✅ 生产依赖剪枝（减少镜像体积）

---

## 🚀 快速开始

### 1. 构建镜像

```bash
cd /srv/rrent/backend

# 构建开发镜像
docker build -t rrent-backend:dev .

# 构建生产镜像（带版本标签）
docker build -t rrent-backend:1.0.0 .
```

### 2. 本地运行容器

#### 基础运行（需要环境变量）

```bash
docker run --rm -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://user:password@host:5432/rrent" \
  -e JWT_SECRET="your-secret-key" \
  rrent-backend:dev
```

#### 使用 .env 文件（推荐）

```bash
# 创建 .env.docker 文件包含所需环境变量
docker run --rm -p 3000:3000 \
  --env-file .env.docker \
  rrent-backend:dev
```

#### 后台运行

```bash
docker run -d \
  --name rrent-backend \
  -p 3000:3000 \
  --env-file .env.docker \
  --restart unless-stopped \
  rrent-backend:dev
```

### 3. 健康检查

```bash
# 检查应用是否正常运行
curl http://localhost:3000/health

# 或者使用 healthz 端点（根据实际路由调整）
curl http://localhost:3000/api/healthz
```

### 4. 查看日志

```bash
# 实时日志
docker logs -f rrent-backend

# 最近 100 行日志
docker logs --tail 100 rrent-backend
```

### 5. 停止容器

```bash
docker stop rrent-backend
docker rm rrent-backend
```

---

## 🔧 环境变量配置

### 必需变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `production` |
| `DATABASE_URL` | PostgreSQL 连接字符串 | `postgresql://user:pass@localhost:5432/rrent` |
| `JWT_SECRET` | JWT 签名密钥 | `your-super-secret-key-change-in-production` |
| `JWT_EXPIRES_IN` | JWT 过期时间 | `7d` |

### 可选变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PORT` | 应用监听端口 | `3000` |
| `THROTTLE_TTL` | 限流时间窗口（秒） | `60` |
| `THROTTLE_LIMIT` | 限流请求次数 | `100` |
| `CORS_ORIGIN` | CORS 允许源 | `*` |

### 示例 .env.docker 文件

```env
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://rrent_user:your_password@postgres:5432/rrent_db

# Authentication
JWT_SECRET=change-this-to-a-secure-random-string-in-production
JWT_EXPIRES_IN=7d

# Security
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# CORS
CORS_ORIGIN=https://your-frontend-domain.com
```

---

## 📊 镜像信息

### 查看镜像大小

```bash
docker images rrent-backend:dev

# 输出示例：
# REPOSITORY       TAG    IMAGE ID       CREATED         SIZE
# rrent-backend    dev    abc123def456   2 minutes ago   ~400-600MB
```

### 预期镜像大小

- **多阶段构建后**: 约 400-600 MB
- **单阶段构建**: 约 800-1200 MB（包含所有 dev 依赖）

> 💡 **优化说明**: 通过多阶段构建，我们仅在 runtime 镜像中保留生产依赖和编译产物，有效减少了镜像体积。

### 镜像层分析

```bash
# 查看镜像层详情
docker history rrent-backend:dev

# 使用 dive 工具分析镜像（需要安装 dive）
dive rrent-backend:dev
```

---

## 🔍 故障排查

### 常见问题

#### 1. Prisma 客户端错误

**错误信息**: `@prisma/client did not initialize yet`

**解决方案**:
- 确保在 `deps` 阶段执行了 `pnpm prisma generate`
- 检查 `prisma/schema.prisma` 是否正确复制到镜像中

#### 2. OpenSSL 相关错误

**错误信息**: `libssl.so.3: cannot open shared object file`

**解决方案**:
- Dockerfile 已在 base 和 runtime 阶段安装 OpenSSL
- 如果仍有问题，检查 Prisma 版本与 Node.js 版本兼容性

#### 3. pnpm 命令未找到

**错误信息**: `pnpm: command not found`

**解决方案**:
- 确保在所有需要 pnpm 的阶段都执行了 `corepack enable`
- 检查是否使用了正确的基础镜像（node:20-slim）

#### 4. 端口冲突

**错误信息**: `bind: address already in use`

**解决方案**:
```bash
# 检查端口占用
lsof -i :3000

# 使用不同端口
docker run -p 3001:3000 rrent-backend:dev
```

### 调试技巧

#### 进入运行中的容器

```bash
docker exec -it rrent-backend sh
```

#### 查看构建阶段输出

```bash
# 显示详细构建日志
docker build --progress=plain -t rrent-backend:dev .

# 不使用缓存重新构建
docker build --no-cache -t rrent-backend:dev .
```

#### 测试特定阶段

```bash
# 只构建到 build 阶段
docker build --target build -t rrent-backend:build .

# 运行 build 阶段镜像检查文件
docker run --rm -it rrent-backend:build sh
```

---

## 🏗️ 与 Docker Compose 集成

### 基础 docker-compose.yml 示例

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    image: rrent-backend:dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://rrent_user:rrent_pass@postgres:5432/rrent_db
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health')"]
      interval: 30s
      timeout: 3s
      retries: 3
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=rrent_user
      - POSTGRES_PASSWORD=rrent_pass
      - POSTGRES_DB=rrent_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U rrent_user"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### 使用 Docker Compose 运行

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f backend

# 停止所有服务
docker-compose down

# 停止并删除所有数据
docker-compose down -v
```

---

## 🚢 生产部署建议

### 1. 数据库迁移

在容器启动前执行迁移：

```bash
# 方式 1: 在宿主机执行
docker run --rm \
  --env-file .env.production \
  rrent-backend:1.0.0 \
  npx prisma migrate deploy

# 方式 2: 在 Dockerfile 中添加启动脚本
# 创建 docker-entrypoint.sh
```

### 2. 健康检查端点

确保应用实现了健康检查端点：

```typescript
// src/health/health.controller.ts
@Get('health')
async check() {
  return { status: 'ok', timestamp: new Date().toISOString() };
}
```

### 3. 日志管理

- 使用 JSON 格式日志（便于集中日志系统解析）
- 配置日志级别（生产环境使用 `info` 或 `warn`）
- 考虑使用 ELK、Loki 等日志聚合工具

### 4. 资源限制

```bash
docker run \
  --memory="512m" \
  --cpus="1.0" \
  rrent-backend:1.0.0
```

### 5. 安全加固

- ✅ 已使用非 root 用户（nodejs）
- ✅ 最小化镜像内容
- 🔲 定期更新基础镜像
- 🔲 使用镜像扫描工具（Trivy、Snyk）
- 🔲 不在镜像中硬编码密钥

---

## 📚 参考资料

- [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [Prisma in Docker](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-docker)
- [pnpm in Docker](https://pnpm.io/docker)

---

## ✅ 验收检查清单

- [x] Dockerfile 使用多阶段构建（base/deps/build/runtime）
- [x] 基于 node:20-slim 镜像
- [x] 使用 pnpm 包管理器（通过 corepack）
- [x] 包含 Prisma 客户端生成
- [x] 生产依赖剪枝
- [x] 非 root 用户运行
- [x] 内置健康检查
- [x] .dockerignore 优化构建上下文
- [x] 完整的使用文档

---

## 📝 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2025-11-15 | 初始版本，多阶段构建实现 |

---

**Note**: 本文档将随着项目演进持续更新。如有问题或改进建议，请联系后端团队。
