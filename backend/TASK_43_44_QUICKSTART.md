# TASK 43 & 44 - 快速概览

## 🎯 两个任务的核心目标

| 任务 | 目标 | 关键词 |
|------|------|--------|
| **TASK 43** | CORS 白名单限制 | `CORS_ALLOWED_ORIGINS`, 开发/生产区分, 源验证 |
| **TASK 44** | Rate Limit 防暴力破解 | `@nestjs/throttler`, 登录限流, 429 错误码 |

---

## 📦 快速开始

### 安装依赖
```bash
cd /srv/rrent/backend
pnpm add @nestjs/throttler  # 自动完成
```

### 配置环境变量 (.env)
```env
# CORS 白名单（多个域名逗号分隔）
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Rate Limit（可选，使用默认值）
LOGIN_RATE_LIMIT=5
LOGIN_RATE_TTL=60
```

### 启动服务
```bash
pnpm start:dev    # 开发环境
pnpm start:prod   # 生产环境（需要配置 CORS_ALLOWED_ORIGINS）
```

---

## 🔍 核心代码位置

### TASK 43: CORS
- **实现**: `src/main.ts` (第 33-85 行)
- **原理**: 
  - 开发环境：未配置时使用默认 localhost 列表
  - 生产环境：必须配置，否则启动失败
  - 验证：函数形式的 origin 检查

### TASK 44: Rate Limit
- **模块配置**: `src/app.module.ts` (第 4, 24-32 行)
- **登录限流**: `src/modules/auth/auth.controller.ts` (第 30-32 行)
- **登录实现**: `src/modules/auth/auth.service.ts` (第 67-108 行)
- **错误处理**: `src/common/filters/http-exception.filter.ts` (第 70-74 行)

---

## ✅ 验收测试

### CORS 测试
```bash
# 允许的源
curl -H "Origin: http://localhost:5173" http://localhost:3000/health
# → 200 OK

# 拒绝的源
curl -H "Origin: http://evil.example.com" http://localhost:3000/health
# → CORS error

# 无 Origin 请求
curl http://localhost:3000/health
# → 200 OK (不受限制)
```

### Rate Limit 测试
```bash
# 快速调用 7 次登录
for i in {1..7}; do
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test","organizationCode":"TEST"}'
done

# 预期：前 5 次正常，第 6+ 次返回 429
```

---

## 📋 修改清单

| 文件 | 修改内容 |
|------|---------|
| `src/main.ts` | ✅ CORS 白名单逻辑 |
| `src/app.module.ts` | ✅ ThrottlerModule 配置 |
| `src/modules/auth/auth.controller.ts` | ✅ 登录端点 + @Throttle |
| `src/modules/auth/auth.service.ts` | ✅ login() 方法 |
| `src/modules/auth/auth.module.ts` | ✅ PrismaModule 导入 |
| `src/common/errors/app-error-code.enum.ts` | ✅ AUTH_RATE_LIMITED |
| `src/common/filters/http-exception.filter.ts` | ✅ 429 异常处理 |
| `.env` | ✅ CORS 配置示例 |
| `.env.example` | ✅ 配置说明 |
| `QUICK_REFERENCE.md` | ✅ 用户指南 |

---

## 🚨 常见问题

**Q: 生产环境启动失败，报 CORS 错误**  
A: 检查环境变量 `CORS_ALLOWED_ORIGINS` 是否设置，例如：
```bash
NODE_ENV=production CORS_ALLOWED_ORIGINS=https://app.example.com pnpm start:prod
```

**Q: 前端无法调用后端 API**  
A: 检查前端域名是否在 `CORS_ALLOWED_ORIGINS` 白名单中。修改后需要重启后端服务。

**Q: 登录总是返回 429 错误**  
A: 可能触发了速率限制。等待 60 秒后重新尝试，或联系管理员。

**Q: 如何调整登录限流参数？**  
A: 修改 `auth.controller.ts` 中 `@Throttle` 装饰器的参数，或在 `app.module.ts` 中修改全局限流配置。

---

## 📚 详细文档

- `TASK_43_44_FINAL_REPORT.md` - 完整报告
- `TASK_43_44_IMPLEMENTATION.md` - 实现细节
- `TASK_43_44_VERIFICATION.md` - 验收清单
- `TASK_43_44_CODE_REFERENCE.md` - 代码参考
- `QUICK_REFERENCE.md` - 用户指南

---

## ✨ 特点

✅ **开发友好**: 默认配置适合开发环境  
✅ **生产安全**: 强制要求白名单配置  
✅ **易于扩展**: 支持自定义限流规则  
✅ **标准兼容**: 使用 NestJS 官方库  
✅ **完整文档**: 详细的用户指南和示例  

---

**状态**: ✅ 完成（通过 lint + build 验证）  
**日期**: 2024-11-14
