# Infrastructure Configuration

> Docker Compose 编排配置和部署资源

---

## 📁 目录结构

```
infra/
├── docker-compose.dev.yml       # 开发环境编排
├── docker-compose.yml           # 生产环境编排
├── .env.dev.example            # 开发环境变量模板
├── .env.example                # 生产环境变量模板
├── quick-start-dev.sh          # 快速启动开发环境脚本
├── BE_8_DOCKER_COMPOSE.md      # 完整使用文档
└── README.md                   # 本文件
```

---

## 🚀 快速开始

### 开发环境（一键启动）

```bash
# 在 infra 目录下
./quick-start-dev.sh
```

### 手动启动开发环境

```bash
# 复制环境变量
cp .env.dev.example .env.dev

# 启动服务
docker compose -f docker-compose.dev.yml up -d

# 查看日志
docker compose -f docker-compose.dev.yml logs -f
```

### 生产环境

```bash
# 复制并编辑生产配置
cp .env.example .env
vim .env  # 填写所有敏感信息

# 启动服务
docker compose -f docker-compose.yml up -d
```

---

## 📚 文档

完整的使用说明、故障排查和最佳实践请参考：

**[BE_8_DOCKER_COMPOSE.md](./BE_8_DOCKER_COMPOSE.md)**

---

## 🔧 常用命令

```bash
# 开发环境
docker compose -f docker-compose.dev.yml up -d      # 启动
docker compose -f docker-compose.dev.yml down       # 停止
docker compose -f docker-compose.dev.yml logs -f    # 查看日志
docker compose -f docker-compose.dev.yml ps         # 查看状态

# 生产环境
docker compose -f docker-compose.yml up -d          # 启动
docker compose -f docker-compose.yml down           # 停止
docker compose -f docker-compose.yml logs -f        # 查看日志
docker compose -f docker-compose.yml restart        # 重启
```

---

## 🔐 安全提醒

⚠️ **重要**：
- 不要提交 `.env` 或 `.env.dev` 到版本控制
- 生产环境必须使用强密码和随机密钥
- 定期备份生产数据库
- 保持基础镜像更新

---

## 📞 支持

遇到问题？查看：
1. [BE_8_DOCKER_COMPOSE.md](./BE_8_DOCKER_COMPOSE.md) - 完整文档
2. [Backend Dockerfile 说明](../backend/BE_8_DOCKERFILE_NOTES.md)
3. [项目状态](../backend/PROJECT_STATUS.md)
