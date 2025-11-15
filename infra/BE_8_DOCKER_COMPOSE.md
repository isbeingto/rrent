# Docker Compose 部署指南

> **Tasks**: BE-8-66 & BE-8-67 | Docker Compose 开发与生产环境  
> **Created**: 2025-11-15  
> **Status**: ✅ 已完成

---

## 📋 概述

本文档提供了 RRent 后端服务的 Docker Compose 编排配置，包括：

- **开发环境** (`docker-compose.dev.yml`) - 本地开发，支持热更新
- **生产环境** (`docker-compose.yml`) - 生产部署，优化性能与安全

两套环境均包含：
- Backend 服务 (NestJS)
- PostgreSQL 数据库

---

## 🚀 快速开始

### 开发环境

#### 1. 准备配置文件

```bash
# 复制环境变量模板
cd infra
cp .env.dev.example .env.dev

# 编辑配置（可选，默认值适用于开发）
vim .env.dev
```

#### 2. 启动服务

```bash
# 启动所有服务（后台运行）
docker compose -f infra/docker-compose.dev.yml up -d

# 查看日志
docker compose -f infra/docker-compose.dev.yml logs -f

# 只查看 backend 日志
docker compose -f infra/docker-compose.dev.yml logs -f rrent-backend-dev
```

#### 3. 验证服务

```bash
# 检查服务状态
docker compose -f infra/docker-compose.dev.yml ps

# 测试健康检查
curl http://localhost:3000/health

# 连接数据库
psql -h localhost -p 5432 -U rrent_user -d rrent_dev
```

#### 4. 停止服务

```bash
# 停止服务（保留数据）
docker compose -f infra/docker-compose.dev.yml down

# 停止并删除数据卷
docker compose -f infra/docker-compose.dev.yml down -v
```

---

### 生产环境

#### 1. 准备配置文件

```bash
cd infra

# 复制生产环境变量模板
cp .env.example .env

# ⚠️  重要：编辑并填写所有敏感信息
vim .env
```

**必须修改的配置项**：
- `POSTGRES_PASSWORD` - 数据库密码（至少 32 字符）
- `JWT_SECRET` - JWT 签名密钥（使用 `openssl rand -base64 64` 生成）
- `CORS_ORIGIN` - 前端域名（如 `https://app.example.com`）
- `SMTP_*` - 邮件服务器配置（如启用邮件通知）

#### 2. 构建镜像

```bash
# 构建 backend 镜像
cd backend
docker build -t rrent-backend:1.0.0 .
cd ..
```

#### 3. 启动服务

```bash
# 启动生产环境
docker compose -f infra/docker-compose.yml up -d

# 查看启动日志
docker compose -f infra/docker-compose.yml logs -f
```

#### 4. 验证部署

```bash
# 检查服务状态
docker compose -f infra/docker-compose.yml ps

# 测试 API
curl http://localhost:3000/health

# 查看资源使用
docker stats
```

#### 5. 生产维护

```bash
# 查看日志（最近 100 行）
docker compose -f infra/docker-compose.yml logs --tail 100 rrent-backend

# 重启服务
docker compose -f infra/docker-compose.yml restart rrent-backend

# 停止服务
docker compose -f infra/docker-compose.yml down
```

---

## 📂 文件结构

```
infra/
├── docker-compose.dev.yml    # 开发环境编排
├── docker-compose.yml         # 生产环境编排
├── .env.dev.example          # 开发环境变量模板
├── .env.example              # 生产环境变量模板
├── .env.dev                  # 开发环境变量（不提交到 Git）
├── .env                      # 生产环境变量（不提交到 Git）
└── logs/                     # 生产日志目录（可选）
```

---

## 🔧 服务配置详解

### 开发环境特性

| 特性 | 说明 |
|------|------|
| **数据库端口** | 暴露 5432 端口，便于本地工具连接 |
| **热更新** | 可挂载源码目录实现热更新（需配置） |
| **日志级别** | `debug`，详细输出便于调试 |
| **数据持久化** | 使用 `rrent-pgdata-dev` 卷（可随时删除） |
| **网络** | `rrent-dev-net` 独立网络 |

### 生产环境特性

| 特性 | 说明 |
|------|------|
| **数据库端口** | 不暴露到宿主机，仅内部通信（更安全） |
| **资源限制** | CPU/内存限制，防止资源耗尽 |
| **日志级别** | `info`，减少日志量 |
| **数据持久化** | 使用 `rrent-pgdata` 卷（必须备份） |
| **自动重启** | `restart: always` |
| **健康检查** | 自动检测服务状态 |

---

## 🗄️ 数据库管理

### 查看数据卷

```bash
# 列出所有卷
docker volume ls | grep rrent

# 查看开发卷详情
docker volume inspect rrent-pgdata-dev

# 查看生产卷详情
docker volume inspect rrent-pgdata
```

### 数据库迁移

迁移在容器启动时自动执行：

```bash
# 查看迁移日志
docker compose -f infra/docker-compose.yml logs rrent-backend | grep -i migrate
```

手动执行迁移：

```bash
# 开发环境
docker compose -f infra/docker-compose.dev.yml exec rrent-backend-dev npx prisma migrate deploy

# 生产环境
docker compose -f infra/docker-compose.yml exec rrent-backend npx prisma migrate deploy
```

### 数据库备份与恢复

#### 备份

```bash
# 方式 1: 使用 pg_dump（推荐）
docker compose -f infra/docker-compose.yml exec -T rrent-postgres \
  pg_dump -U rrent_prod_user -d rrent_production \
  > backup_$(date +%Y%m%d_%H%M%S).sql

# 方式 2: 备份整个数据卷
docker run --rm \
  -v rrent-pgdata:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/rrent-pgdata-backup-$(date +%Y%m%d).tar.gz -C /data .
```

#### 恢复

```bash
# 方式 1: 从 SQL 文件恢复
docker compose -f infra/docker-compose.yml exec -T rrent-postgres \
  psql -U rrent_prod_user -d rrent_production < backup_20251115.sql

# 方式 2: 恢复数据卷
docker run --rm \
  -v rrent-pgdata:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/rrent-pgdata-backup-20251115.tar.gz -C /data
```

#### 自动备份脚本

创建 `infra/backup.sh`：

```bash
#!/bin/bash
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/rrent-backup-$DATE.sql"

mkdir -p $BACKUP_DIR

docker compose -f infra/docker-compose.yml exec -T rrent-postgres \
  pg_dump -U rrent_prod_user -d rrent_production > "$BACKUP_FILE"

gzip "$BACKUP_FILE"
echo "Backup completed: $BACKUP_FILE.gz"

# 保留最近 30 天的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

设置定时任务（crontab）：

```bash
# 每天凌晨 2 点备份
0 2 * * * cd /path/to/rrent/infra && ./backup.sh >> ./backup.log 2>&1
```

---

## 🔍 故障排查

### 常见问题

#### 1. 服务无法启动

```bash
# 查看详细错误信息
docker compose -f infra/docker-compose.dev.yml logs

# 检查容器状态
docker compose -f infra/docker-compose.dev.yml ps -a
```

#### 2. 数据库连接失败

```bash
# 检查 PostgreSQL 是否就绪
docker compose -f infra/docker-compose.dev.yml exec rrent-postgres pg_isready

# 查看数据库日志
docker compose -f infra/docker-compose.dev.yml logs rrent-postgres

# 测试连接
docker compose -f infra/docker-compose.dev.yml exec rrent-backend-dev \
  npx prisma db pull
```

#### 3. 迁移失败

```bash
# 查看当前迁移状态
docker compose -f infra/docker-compose.dev.yml exec rrent-backend-dev \
  npx prisma migrate status

# 重置数据库（开发环境）
docker compose -f infra/docker-compose.dev.yml exec rrent-backend-dev \
  npx prisma migrate reset
```

#### 4. 端口被占用

```bash
# 查看端口占用
lsof -i :3000
lsof -i :5432

# 修改端口映射（在 .env 中）
APP_PORT=3001
```

#### 5. 容器内存不足

```bash
# 检查资源使用
docker stats

# 调整 docker-compose.yml 中的资源限制
deploy:
  resources:
    limits:
      memory: 2G  # 增加内存限制
```

### 调试技巧

#### 进入容器

```bash
# 进入 backend 容器
docker compose -f infra/docker-compose.dev.yml exec rrent-backend-dev sh

# 进入 PostgreSQL 容器
docker compose -f infra/docker-compose.dev.yml exec rrent-postgres psql -U rrent_user -d rrent_dev
```

#### 查看环境变量

```bash
# 查看 backend 环境变量
docker compose -f infra/docker-compose.dev.yml exec rrent-backend-dev env | sort
```

#### 重新构建镜像

```bash
# 不使用缓存重新构建
docker compose -f infra/docker-compose.dev.yml build --no-cache

# 强制重新创建容器
docker compose -f infra/docker-compose.dev.yml up -d --force-recreate
```

---

## 🔒 安全最佳实践

### 生产环境清单

- [ ] 修改所有默认密码
- [ ] 使用强随机字符串作为 JWT_SECRET（至少 64 字节）
- [ ] 配置正确的 CORS_ORIGIN（不使用 `*`）
- [ ] 启用 SSL/TLS（通过 Nginx 反向代理）
- [ ] 限制数据库端口仅容器内部访问
- [ ] 设置防火墙规则
- [ ] 定期更新基础镜像
- [ ] 实施日志监控和告警
- [ ] 配置自动备份策略
- [ ] 使用 secrets 管理敏感信息（Docker Swarm/Kubernetes）

### 文件权限

```bash
# 保护环境变量文件
chmod 600 infra/.env
chmod 600 infra/.env.dev

# 确保备份目录权限
chmod 700 infra/backups
```

### 更新镜像

```bash
# 拉取最新的 PostgreSQL 镜像
docker pull postgres:16-alpine

# 重新构建 backend 镜像
cd backend
docker build -t rrent-backend:1.0.1 .

# 更新服务
docker compose -f infra/docker-compose.yml up -d
```

---

## 📊 监控与日志

### 日志管理

```bash
# 实时查看所有日志
docker compose -f infra/docker-compose.yml logs -f

# 查看特定服务日志
docker compose -f infra/docker-compose.yml logs -f rrent-backend

# 导出日志到文件
docker compose -f infra/docker-compose.yml logs --no-color > logs/app-$(date +%Y%m%d).log
```

### 资源监控

```bash
# 实时监控资源使用
docker stats

# 查看磁盘使用
docker system df

# 清理未使用的资源
docker system prune -a
```

### 健康检查

```bash
# 手动触发健康检查
docker compose -f infra/docker-compose.yml exec rrent-backend \
  node -e "require('http').get('http://localhost:3000/health', (r) => console.log(r.statusCode))"
```

---

## 🚢 部署到生产服务器

### 1. 服务器准备

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 安装 Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# 验证安装
docker --version
docker compose version
```

### 2. 部署流程

```bash
# 克隆代码
git clone https://github.com/your-org/rrent.git
cd rrent

# 准备配置
cd infra
cp .env.example .env
vim .env  # 填写生产配置

# 构建镜像
cd ../backend
docker build -t rrent-backend:1.0.0 .

# 启动服务
cd ../infra
docker compose -f docker-compose.yml up -d

# 验证
docker compose -f docker-compose.yml ps
curl http://localhost:3000/health
```

### 3. 配置反向代理（Nginx）

创建 `/etc/nginx/sites-available/rrent`：

```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/rrent /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. 配置 SSL（Let's Encrypt）

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.example.com
```

---

## 📚 相关文档

- [Backend Dockerfile 说明](../backend/BE_8_DOCKERFILE_NOTES.md)
- [项目总体状态](../backend/PROJECT_STATUS.md)
- [数据库 Schema](../backend/prisma/schema.prisma)

---

## ✅ 验收检查清单

### 开发环境 (BE-8-66)

- [x] `docker-compose.dev.yml` 已创建
- [x] `.env.dev.example` 模板已创建
- [x] PostgreSQL 容器正常启动
- [x] Backend 容器正常启动
- [x] 数据库迁移自动执行
- [x] 健康检查端点可访问
- [x] 数据持久化到 `rrent-pgdata-dev` 卷
- [x] 可通过 psql 连接数据库

### 生产环境 (BE-8-67)

- [x] `docker-compose.yml` 已创建
- [x] `.env.example` 完整模板已创建
- [x] 资源限制已配置
- [x] 安全加固（非 root 用户）
- [x] 数据库端口不暴露到宿主机
- [x] 自动重启策略已设置
- [x] 健康检查已配置
- [x] 备份恢复文档已提供
- [x] .gitignore 已更新

---

## 📝 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2025-11-15 | 初始版本，开发和生产环境配置完成 |

---

**Note**: 本文档随项目演进持续更新。生产部署前请仔细阅读安全章节。
