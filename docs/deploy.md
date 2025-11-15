# RRent 云平台部署指南

> **Tasks**: BE-8-68 & BE-8-69 | 云平台部署与健康检查  
> **Created**: 2025-11-15  
> **Status**: ✅ 已完成

---

## 📋 目录

- [健康检查端点](#健康检查端点)
- [Render.com 部署](#rendercom-部署)
- [Fly.io 部署](#flyio-部署)
- [环境变量配置](#环境变量配置)
- [数据库配置](#数据库配置)
- [故障排查](#故障排查)

---

## 🏥 健康检查端点

RRent 后端提供三个健康检查端点，用于监控和负载均衡：

### 1. 基础健康检查

```http
GET /health
```

**用途**: 快速检查服务是否运行  
**响应时间**: < 10ms  
**检查内容**: 无外部依赖

**响应示例**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-15T14:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0"
}
```

### 2. 就绪探针 (Readiness Probe)

```http
GET /health/ready
```

**用途**: 检查服务是否准备好接收流量  
**响应时间**: < 500ms  
**检查内容**: 数据库连接

**成功响应** (200):
```json
{
  "status": "ok",
  "timestamp": "2025-11-15T14:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0",
  "database": {
    "connected": true,
    "responseTime": 15
  },
  "checks": {
    "database": true
  }
}
```

**失败响应** (503):
```json
{
  "status": "error",
  "timestamp": "2025-11-15T14:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "database": {
    "connected": false
  },
  "checks": {
    "database": false
  },
  "message": "Service not ready - database connection failed"
}
```

### 3. 存活探针 (Liveness Probe)

```http
GET /health/live
```

**用途**: 检查服务是否存活（用于自动重启）  
**响应时间**: < 10ms  
**检查内容**: 无外部依赖

**响应示例**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-15T14:00:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

---

## 🚀 Render.com 部署

### 特点

- ✅ 免费套餐（750 小时/月）
- ✅ 自动 HTTPS
- ✅ 一键部署
- ✅ 自动扩展
- ✅ 内置 PostgreSQL

### 部署步骤

#### 1. 准备工作

```bash
# 确保代码已推送到 GitHub
git add .
git commit -m "Add Render deployment config"
git push origin main
```

#### 2. 创建 Render 账号

访问 [render.com](https://render.com) 并注册账号（可使用 GitHub 登录）

#### 3. 使用 Blueprint 部署

**方式 A: 通过 Render Dashboard**

1. 登录 Render Dashboard
2. 点击 **"New +"** → **"Blueprint"**
3. 连接你的 GitHub 仓库
4. Render 会自动检测 `render.yaml` 文件
5. 点击 **"Apply"** 开始部署

**方式 B: 通过 GitHub 集成**

1. 在 Render Dashboard 点击 **"New Web Service"**
2. 选择你的 GitHub 仓库
3. 配置如下：
   - **Name**: `rrent-backend`
   - **Runtime**: `Docker`
   - **Region**: `Oregon (US West)` 或就近区域
   - **Branch**: `main`
   - **Dockerfile Path**: `./backend/Dockerfile`
   - **Docker Build Context**: `./backend`

#### 4. 配置环境变量

在 Render Dashboard 的 **Environment** 标签页添加：

| 变量名 | 值 | 说明 |
|--------|---|------|
| `NODE_ENV` | `production` | 运行环境 |
| `DATABASE_URL` | *自动生成* | 数据库连接（来自 PostgreSQL 服务） |
| `JWT_SECRET` | *生成随机值* | JWT 签名密钥 |
| `CORS_ORIGIN` | `https://your-frontend.com` | 前端域名 |
| `PORT` | `3000` | 应用端口 |

**生成安全密钥**:
```bash
# 本地生成后复制到 Render
openssl rand -base64 64
```

#### 5. 创建 PostgreSQL 数据库

1. 在 Render Dashboard 点击 **"New +"** → **"PostgreSQL"**
2. 配置：
   - **Name**: `rrent-postgres`
   - **Database**: `rrent_production`
   - **User**: `rrent_user`
   - **Region**: *与 Web Service 相同*
3. 创建后，复制 **Internal Database URL**
4. 在 Web Service 的环境变量中设置 `DATABASE_URL`

#### 6. 验证部署

```bash
# 检查健康状态
curl https://your-app.onrender.com/health/ready

# 测试 API
curl https://your-app.onrender.com/api/health
```

### Render 配置文件

完整配置见项目根目录的 `render.yaml`。

### 自动部署

Render 会自动检测 `main` 分支的推送并重新部署：

```bash
git push origin main  # 自动触发部署
```

### 查看日志

在 Render Dashboard → 选择服务 → **Logs** 标签页

---

## ✈️ Fly.io 部署

### 特点

- ✅ 全球边缘部署
- ✅ 免费套餐（3 个虚拟机）
- ✅ 低延迟（离用户更近）
- ✅ 自动 HTTPS
- ✅ 内置负载均衡

### 部署步骤

#### 1. 安装 Fly CLI

**macOS / Linux**:
```bash
curl -L https://fly.io/install.sh | sh
```

**Windows (PowerShell)**:
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

**验证安装**:
```bash
fly version
```

#### 2. 登录 Fly.io

```bash
fly auth login
```

这会打开浏览器完成认证。

#### 3. 创建应用

```bash
# 在项目根目录
fly apps create rrent-backend --org personal
```

#### 4. 创建 PostgreSQL 数据库

```bash
# 创建数据库（免费套餐）
fly postgres create \
  --name rrent-postgres \
  --region sin \
  --initial-cluster-size 1 \
  --vm-size shared-cpu-1x \
  --volume-size 1

# 连接数据库到应用
fly postgres attach rrent-postgres --app rrent-backend
```

这会自动设置 `DATABASE_URL` 环境变量。

#### 5. 配置密钥

```bash
# 生成并设置 JWT 密钥
fly secrets set JWT_SECRET=$(openssl rand -base64 64) --app rrent-backend

# 设置 CORS（根据你的前端域名）
fly secrets set CORS_ORIGIN=https://your-frontend.com --app rrent-backend

# 查看所有密钥
fly secrets list --app rrent-backend
```

#### 6. 部署应用

```bash
# 首次部署
fly deploy

# 后续部署
fly deploy --strategy rolling
```

部署过程：
1. 构建 Docker 镜像
2. 上传到 Fly.io Registry
3. 运行数据库迁移（`release_command`）
4. 滚动更新实例

#### 7. 验证部署

```bash
# 查看应用状态
fly status

# 查看日志
fly logs

# 打开应用
fly open

# 测试健康检查
curl https://rrent-backend.fly.dev/health/ready
```

### Fly.io 配置文件

完整配置见项目根目录的 `fly.toml`。

### 扩容

```bash
# 查看当前配置
fly scale show

# 增加实例数量
fly scale count 2

# 增加内存
fly scale memory 512

# 垂直扩展（更大的虚拟机）
fly scale vm shared-cpu-2x
```

### 区域部署

```bash
# 查看可用区域
fly regions list

# 添加新区域
fly regions add nrt  # Tokyo
fly regions add hkg  # Hong Kong

# 查看当前区域
fly regions list --app rrent-backend
```

### 查看日志

```bash
# 实时日志
fly logs --app rrent-backend

# 特定实例日志
fly logs --instance <instance-id>
```

---

## 🔧 环境变量配置

### 必需变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `NODE_ENV` | 运行环境 | `production` |
| `DATABASE_URL` | PostgreSQL 连接 | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | JWT 签名密钥 | `openssl rand -base64 64` |
| `PORT` | 应用端口 | `3000` |

### 推荐变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `JWT_EXPIRES_IN` | JWT 过期时间 | `7d` |
| `CORS_ORIGIN` | CORS 白名单 | `*` |
| `LOG_LEVEL` | 日志级别 | `info` |
| `THROTTLE_TTL` | 限流时间窗口 | `60` |
| `THROTTLE_LIMIT` | 限流请求数 | `100` |

### 安全生成密钥

```bash
# JWT Secret (至少 64 字节)
openssl rand -base64 64

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

---

## 🗄️ 数据库配置

### Render PostgreSQL

**连接信息**（在 Render Dashboard 获取）：
- **Internal URL**: 用于应用连接（推荐）
- **External URL**: 用于外部工具连接

**特点**：
- 自动备份
- 高可用性
- 自动扩展

### Fly.io PostgreSQL

**连接方式**：
```bash
# 查看连接信息
fly postgres connect --app rrent-postgres

# 通过代理连接
fly proxy 5432 --app rrent-postgres
psql postgres://localhost:5432/rrent_production
```

**备份**：
```bash
# 创建快照
fly volumes snapshots create <volume-id>

# 列出快照
fly volumes snapshots list <volume-id>
```

### 数据库迁移

两个平台都会在部署时自动运行迁移：

**Render**: 在 `render.yaml` 中配置（已包含）  
**Fly.io**: 在 `fly.toml` 中配置的 `release_command`

手动运行迁移：

```bash
# Render
render exec -- npx prisma migrate deploy

# Fly.io
fly ssh console --app rrent-backend
npx prisma migrate deploy
```

---

## 🔍 故障排查

### 常见问题

#### 1. 健康检查失败

**症状**: 部署失败，日志显示 "Health check timeout"

**解决方案**:
```bash
# 检查健康检查端点
curl https://your-app.com/health/ready

# 查看日志
# Render: Dashboard → Logs
# Fly.io: fly logs
```

**可能原因**:
- 数据库连接失败
- 启动时间过长
- 端口配置错误

#### 2. 数据库连接错误

**症状**: `ECONNREFUSED` 或 `Connection timeout`

**解决方案**:
```bash
# 验证 DATABASE_URL
# Render: Dashboard → Environment
# Fly.io: fly secrets list

# 测试连接
fly ssh console --app rrent-backend
npx prisma db pull
```

#### 3. 迁移失败

**症状**: 部署卡在迁移步骤

**解决方案**:
```bash
# 查看迁移状态
fly ssh console --app rrent-backend
npx prisma migrate status

# 强制重置（⚠️ 仅开发环境）
npx prisma migrate reset
```

#### 4. 内存不足

**症状**: 容器频繁重启，OOM 错误

**解决方案**:
```bash
# Fly.io: 增加内存
fly scale memory 512

# Render: 升级到付费套餐
```

#### 5. CORS 错误

**症状**: 浏览器报 CORS 错误

**解决方案**:
```bash
# 设置正确的 CORS_ORIGIN
fly secrets set CORS_ORIGIN=https://your-frontend.com
```

### 调试技巧

#### Render

```bash
# SSH 进入容器
render ssh

# 查看环境变量
render exec -- env
```

#### Fly.io

```bash
# SSH 进入容器
fly ssh console --app rrent-backend

# 查看环境变量
fly ssh console --app rrent-backend -C env

# 执行一次性命令
fly ssh console --app rrent-backend -C "npx prisma migrate status"
```

---

## 📊 性能优化

### Render

1. **启用 CDN**: 在 Dashboard 中启用
2. **调整健康检查间隔**: 修改 `render.yaml`
3. **使用区域缓存**: 付费功能

### Fly.io

1. **多区域部署**: `fly regions add`
2. **增加实例数**: `fly scale count 2`
3. **启用自动扩展**: 修改 `fly.toml`

```toml
[autoscaling]
  min_count = 1
  max_count = 3
```

---

## 💰 成本估算

### Render 免费套餐

- ✅ 750 小时/月 Web Service
- ✅ 90 天数据保留的 PostgreSQL
- ❌ 闲置后自动休眠（首次请求慢）

### Fly.io 免费套餐

- ✅ 3 个共享 CPU 虚拟机
- ✅ 160GB 出站流量/月
- ✅ 3GB 持久化存储
- ❌ 单区域部署

---

## 🚀 生产建议

### 部署前检查清单

- [ ] 设置强随机 JWT_SECRET
- [ ] 配置正确的 CORS_ORIGIN
- [ ] 启用数据库自动备份
- [ ] 配置日志聚合服务
- [ ] 设置错误监控（Sentry）
- [ ] 配置自定义域名和 SSL
- [ ] 设置告警通知
- [ ] 测试健康检查端点
- [ ] 验证数据库迁移
- [ ] 进行负载测试

### 监控

**Render**:
- 内置指标监控
- 日志搜索
- 告警通知

**Fly.io**:
- Prometheus metrics
- Grafana 集成
- Sentry 集成

---

## 📚 相关文档

- [Backend Docker 说明](../backend/BE_8_DOCKERFILE_NOTES.md)
- [Docker Compose 部署](../infra/BE_8_DOCKER_COMPOSE.md)
- [健康检查 API 文档](../backend/src/health/)

---

## ✅ 验收标准

### BE-8-68: 云平台部署

- [x] `render.yaml` 配置文件已创建
- [x] `fly.toml` 配置文件已创建
- [x] 部署文档完整（两个平台）
- [x] 环境变量清单完整
- [x] 故障排查指南完整

### BE-8-69: 健康检查

- [x] `/health` - 基础健康检查
- [x] `/health/ready` - 就绪探针（含数据库检查）
- [x] `/health/live` - 存活探针
- [x] 健康检查服务实现
- [x] Dockerfile 健康检查更新

---

**Status**: ✅ **已完成** | **Last Updated**: 2025-11-15
