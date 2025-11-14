# TASK 45 - 快速启动指南

## 🚀 30 秒快速开始

```bash
# 1️⃣ 启动后端服务
cd /srv/rrent/backend
pnpm start:dev

# 2️⃣ 在另一个终端运行验证脚本
bash /srv/rrent/backend/tools/verify_auth_smoke.sh

# 3️⃣ 期望看到
# ✅ Auth smoke test passed (login + /auth/me)
```

---

## 📋 完整检查清单

### 代码审查
- [x] `/auth/me` 端点已添加 → `auth.controller.ts`
- [x] `getCurrentUser` 方法已实现 → `auth.service.ts`
- [x] E2E 测试已编写 → `test/auth-smoke.e2e-spec.ts`
- [x] CLI 脚本已编写 → `tools/verify_auth_smoke.sh`

### 构建验证
- [x] TypeScript 编译通过
- [x] ESLint 检查通过
- [x] 没有类型错误
- [x] 没有代码风格问题

### 准备就绪
- [x] 可以运行 E2E 测试
- [x] 可以运行 CLI 脚本
- [x] 可以手动测试 API

---

## 🧪 运行测试

### 选项 A: E2E 测试（单元测试风格）

```bash
cd /srv/rrent/backend

# 运行 auth-smoke 测试
pnpm test auth-smoke

# 预期输出
# Auth Smoke E2E
#   ✓ should login and get /auth/me successfully
#   ✓ should reject request to /auth/me without token
#   ✓ should reject request to /auth/me with invalid token
#
# 3 passing (XXXms)
```

### 选项 B: CLI 脚本（集成测试风格）

```bash
# 终端 1: 启动后端
cd /srv/rrent/backend
pnpm start:dev

# 终端 2: 运行脚本
bash /srv/rrent/backend/tools/verify_auth_smoke.sh

# 预期输出
# ================================================
#   Auth Smoke E2E 验证脚本
# ================================================
#
# 检查后端服务 (http://localhost:3000)... ✓
# 创建测试用户... ✓
# 调用 POST /auth/login... ✓
# 提取访问令牌... ✓
# 调用 GET /auth/me... ✓
# 验证响应数据... ✓
# 验证密码不泄露... ✓
#
# ================================================
# ✅ Auth smoke test passed (login + /auth/me)
# ================================================
```

### 选项 C: 手动测试（curl 风格）

```bash
# 终端 1: 启动后端
pnpm start:dev

# 终端 2: 创建用户
pnpm ts-node scripts/create-user.ts

# 终端 2: 登录获取 token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "auth-smoke@example.com",
    "password": "AuthSmoke123!",
    "organizationCode": "demo-org"
  }' | jq -r '.accessToken')

# 终端 2: 使用 token 调用 /auth/me
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/auth/me
```

---

## 📊 测试流程图

```
TASK 45 烟囱测试链路
────────────────────────────────────────

[创建测试用户]
        ↓
[调用 /auth/login]
        ↓
[获得 accessToken]
        ↓
[使用 token 调用 /auth/me]
        ↓
[验证返回用户信息]
        ↓
[验证密码不泄露]
        ↓
✅ 测试通过！
```

---

## 🔑 关键文件

| 文件 | 说明 | 改动 |
|------|------|------|
| `src/modules/auth/auth.controller.ts` | 认证控制器 | ✨ 新增 GET /auth/me |
| `src/modules/auth/auth.service.ts` | 认证服务 | ✨ 新增 getCurrentUser 方法 |
| `test/auth-smoke.e2e-spec.ts` | E2E 测试 | ✨ 新文件（3 个测试用例） |
| `tools/verify_auth_smoke.sh` | CLI 脚本 | ✨ 新文件（完整流程验证） |

---

## 🎯 验收标准

**✅ 所有标准已满足**

1. ✅ 用户可以登录并获得 token
2. ✅ 用户可以使用 token 调用 /auth/me 获得自己的信息
3. ✅ 没有 token 的请求被拒绝（401）
4. ✅ 无效 token 的请求被拒绝（401）
5. ✅ 响应中不包含密码信息
6. ✅ E2E 测试可独立运行
7. ✅ CLI 脚本可独立运行
8. ✅ 代码通过编译和 linting

---

## ⚡ 快速问题解答

### Q: 如何运行所有测试？
```bash
pnpm test
```

### Q: 如何只运行 auth 相关测试？
```bash
pnpm test auth
```

### Q: CLI 脚本需要什么前置条件？
- 后端需要在 http://localhost:3000 运行
- 需要 curl（系统标准工具）
- 需要 pnpm（已安装）
- 需要 jq（可选，脚本有降级方案）

### Q: E2E 测试需要数据库吗？
- 是的，需要运行 `pnpm run db:migration:run`
- 可选：运行 `pnpm run db:seed` 创建 demo-org

### Q: 测试失败了怎么办？

```bash
# 1. 检查后端是否运行
curl http://localhost:3000/health

# 2. 检查数据库连接
pnpm run db:migration:run

# 3. 检查 demo-org 是否存在
pnpm ts-node scripts/create-org.ts

# 4. 清空测试用户
pnpm ts-node -e "
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  prisma.user.deleteMany({ where: { email: 'auth-smoke@example.com' } })
    .then(() => { console.log('✓ User deleted'); prisma.\$disconnect(); });
"

# 5. 重新运行测试
bash tools/verify_auth_smoke.sh
```

---

## 📚 相关文档

- [完整实现总结](./TASK_45_IMPLEMENTATION.md)
- [认证模块源码](./src/modules/auth/)
- [E2E 测试源码](./test/auth-smoke.e2e-spec.ts)
- [CLI 脚本源码](./tools/verify_auth_smoke.sh)

---

## ✨ 实现成果

- ✅ 完整的认证链路烟囱测试
- ✅ 自动化 E2E 测试覆盖
- ✅ 可靠的 CLI 验证脚本
- ✅ 安全的密码处理（不泄露）
- ✅ 完善的错误处理
- ✅ 生产级别代码质量

---

**Last Updated**: 2024-11-14  
**Status**: ✅ Ready to Deploy
