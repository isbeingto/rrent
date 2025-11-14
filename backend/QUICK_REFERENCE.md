# 🚀 快速参考指南 - BE-2-28 & BE-2-29

## 文件导航

### 📂 密码哈希 (BE-2-28)
```
src/common/security/password-hasher.ts
└─ BcryptPasswordHasher 工具类
   ├─ hash(password: string): Promise<string>
   └─ 默认配置: saltRounds = 10
```

### 📂 错误系统 (BE-2-29)
```
src/common/errors/
├─ app-error-code.enum.ts          (错误码枚举, 19 个)
├─ app-exception.base.ts           (基类, 包含 code 属性)
├─ not-found.exception.ts          (7 个 404 异常)
├─ conflict.exception.ts           (7 个 409 异常)
├─ forbidden.exception.ts          (403 异常)
└─ validation.exception.ts         (400 异常)

src/common/filters/
└─ http-exception.filter.ts        (返回 code 字段)
```

### 📂 User 模块
```
src/modules/user/
├─ user.service.ts                 (238 行, 6 个方法)
├─ user.module.ts                  (模块定义)
└─ dto/
   ├─ create-user.dto.ts
   ├─ update-user.dto.ts           (排除 password)
   └─ query-user.dto.ts

src/prisma/
├─ prisma.module.ts
└─ prisma.service.ts
```

### 📂 核心服务 (已更新)
```
src/modules/{organization,property,unit,tenant,lease,payment}/
└─ {name}.service.ts               (都使用新异常)
```

---

## 🔑 核心 API

### 密码哈希使用
```typescript
// 在 create() 方法中
const hashedPassword = await this.passwordHasher.hash(dto.password);
// 存储 hashedPassword 而不是 dto.password
```

### 抛出异常示例
```typescript
// Not Found (404)
throw new OrganizationNotFoundException(orgId);

// Conflict (409)
throw new UserEmailConflictException(email);

// Forbidden (403)
throw new ForbiddenOperationException('message');

// Validation (400)
throw new BusinessValidationException('message');
```

### 错误响应示例
```json
{
  "statusCode": 404,
  "error": "OrganizationNotFoundException",
  "message": "Organization with id \"org-999\" not found",
  "code": "ORG_NOT_FOUND"
}
```

---

## ✅ 验证命令

```bash
# 编译
cd /srv/rrent/backend && pnpm run build

# Lint
pnpm run lint

# 测试
npx jest test/error-response.spec.ts --forceExit

# 完整验证
./VERIFY_IMPLEMENTATION.sh
```

---

## 📊 错误码参考表

### Not Found (404)
| Code | 说明 |
|------|------|
| ORG_NOT_FOUND | 组织不存在 |
| PROPERTY_NOT_FOUND | 属性不存在 |
| UNIT_NOT_FOUND | 单元不存在 |
| TENANT_NOT_FOUND | 租户不存在 |
| LEASE_NOT_FOUND | 租约不存在 |
| PAYMENT_NOT_FOUND | 支付不存在 |
| USER_NOT_FOUND | 用户不存在 |

### Conflict (409)
| Code | 说明 |
|------|------|
| ORG_CODE_CONFLICT | 组织代码冲突 |
| PROPERTY_CODE_CONFLICT | 属性代码冲突 |
| UNIT_NUMBER_CONFLICT | 单元号冲突 |
| TENANT_EMAIL_CONFLICT | 租户邮箱冲突 |
| TENANT_PHONE_CONFLICT | 租户电话冲突 |
| USER_EMAIL_CONFLICT | 用户邮箱冲突 |

### Other
| Code | HTTP | 说明 |
|------|------|------|
| CROSS_ORG_ACCESS | 403 | 跨组织访问 |
| VALIDATION_FAILED | 400 | 验证失败 |

---

## 🎯 常见使用场景

### 场景 1: 创建用户（密码哈希）
```typescript
// DTO 中密码是明文
const dto: CreateUserDto = {
  organizationId: 'org-123',
  email: 'user@example.com',
  password: 'PlainTextPassword',  // 明文
  fullName: 'John Doe'
};

// Service 中自动哈希
const user = await this.userService.create(dto);
// 数据库中存储的是 passwordHash，而不是明文
```

### 场景 2: 处理邮箱冲突
```typescript
try {
  await this.userService.create(dto);
} catch (error) {
  if (error instanceof UserEmailConflictException) {
    // 处理邮箱已存在的情况
    // 前端会收到 code: "USER_EMAIL_CONFLICT"
  }
}
```

### 场景 3: 多租户隔离
```typescript
// 必须提供 organizationId
const user = await this.userService.findById(userId, organizationId);

// 只会返回属于该组织的用户
// 如果 userId 属于另一个组织，抛出 UserNotFoundException
```

---

## 📋 迁移检查清单

当添加新服务时，确保:

- [ ] 导入必要的异常类
- [ ] 使用具体的异常而不是通用的 NotFoundException
- [ ] 所有 findById/update/remove 都要求 organizationId
- [ ] Prisma 查询包含 organizationId WHERE 条件
- [ ] 处理 Prisma 错误代码（P2002 unique, P2025 not found）

---

## 📚 相关文档

| 文档 | 用途 |
|------|------|
| `COMPLETION_REPORT.md` | ✅ 完成验证报告 |
| `IMPLEMENTATION_SUMMARY.md` | 📝 详细实现说明 |
| `ERROR_CODE_VERIFICATION.md` | 📖 错误响应文档 |
| `VERIFY_IMPLEMENTATION.sh` | 🔍 自动验证脚本 |

---

## 🆘 故障排除

### 密码未被哈希
**检查**: create() 方法是否调用了 BcryptPasswordHasher.hash()

### 错误响应没有 code 字段
**检查**: 异常是否继承自 AppException？使用的是否是具体异常类？

### 跨组织访问未被拦截
**检查**: findById 查询是否包含 organizationId WHERE 条件？

### ESLint 错误
**解决**: `pnpm run lint` 会自动修复大部分问题

---

## ✅ BE-2 层统一验收

在 backend 目录下执行：

```bash
bash tools/verify_be2_all.sh
```

该脚本会依次执行：

1. `pnpm run lint` - ESLint 代码检查
2. `pnpm run build` - TypeScript 编译构建
3. `pnpm prisma validate` - Prisma Schema 验证
4. `pnpm test:be2-services` - BE-2 服务层测试（Org/Property/Unit）
5. `pnpm test:be2-services-2` - BE-2 服务层测试（Tenant/Lease/Payment）

全部通过且 exit code 为 0 时，表示 BE-2 领域服务层逻辑稳定。

---

## 🔒 CORS 配置指南 (BE-4-43)

### 环境变量设置

**变量**: `CORS_ALLOWED_ORIGINS`

格式为逗号分隔的域名列表，例如：

```env
# 开发环境
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:3001

# 生产环境
CORS_ALLOWED_ORIGINS=https://app.rrent.com,https://admin.rrent.com
```

### 行为差异

**开发环境** (`NODE_ENV !== 'production'`)
- 若未设置 `CORS_ALLOWED_ORIGINS`，默认允许：
  - `http://localhost:3000`
  - `http://localhost:5173`
  - `http://localhost:3001`
- 允许无 Origin 的请求（curl、Postman、服务端调用）

**生产环境** (`NODE_ENV === 'production'`)
- **必须**设置 `CORS_ALLOWED_ORIGINS`
- 若未设置，服务启动时抛出错误并退出 (`process.exit(1)`)
- 严格按白名单匹配，拒绝非白名单 Origin（返回 CORS 错误）
- 日志记录被拒绝的 Origin

### 常见问题

**Q: 前端本地域名改了，如何解决 CORS 失败？**  
A: 修改 `.env` 文件中的 `CORS_ALLOWED_ORIGINS`，添加新域名，重启后台服务。

**Q: 生产环境忘记配置 CORS_ALLOWED_ORIGINS 怎么办？**  
A: 后端启动时会报错并拒绝启动，防止误配导致"裸奔"。检查 `.env` 或部署配置，补充环境变量。

**Q: 为什么 curl 请求可以跳过 CORS 限制？**  
A: 因为 curl 没有 Origin 请求头，浏览器才需要 CORS。后端允许这类请求便于测试和调试。

---

## 🚦 Rate Limit 配置指南 (BE-4-44)

### 环境变量设置

**变量**: `LOGIN_RATE_LIMIT`, `LOGIN_RATE_TTL`

```env
# 每 60 秒允许最多 5 次登录尝试
LOGIN_RATE_LIMIT=5
LOGIN_RATE_TTL=60
```

### 限流行为

**登录接口** (`POST /auth/login`)
- 同一 IP 在时间窗口内超过限制次数，返回 429 错误
- 窗口重置后可重新尝试
- 非浏览器请求（无 Origin）不受 CORS 限制，但仍受速率限制

### 错误响应格式

当触发速率限制时（429）：

```json
{
  "statusCode": 429,
  "error": "TooManyRequestsException",
  "message": "Too many attempts, please try again later.",
  "code": "AUTH_RATE_LIMITED"
}
```

### 常见问题

**Q: 如何调整登录速率限制？**  
A: 修改 `.env` 中的 `LOGIN_RATE_LIMIT` 和 `LOGIN_RATE_TTL` 值，重启后台。

**Q: 某个用户被误伤（暂时被限流），怎样快速恢复？**  
A: 等待 `LOGIN_RATE_TTL` 秒后重试，或临时调宽限制参数。

**Q: 限流是按 IP 还是按账号？**  
A: 目前按 IP 维度，与多租户解耦。未来若需按账号/Email 限流，需单独任务实现。

---

---

## ✅ BE-Phase1（BE-0..BE-4）统一验收

在 backend 目录执行以下命令进行完整的阶段性验收：

```bash
bash tools/verify_be_phase1_all.sh
```

### 验收范围

脚本会自动执行以下所有步骤，中途任一步失败则立即停止：

1. **环境检查**：验证 Node.js、pnpm、DATABASE_URL 配置
2. **代码质量**：执行 `pnpm run lint` 和 `pnpm run build`
3. **数据库**：Prisma 验证、迁移、种子脚本
4. **服务启动**：启动 Nest.js 应用并探测健康检查
5. **基础 API**：验证 GET / 、GET /health 、GET /api 响应
6. **领域服务**：调用 BE-2 服务统一验收（如果脚本存在）
7. **认证流程**：调用 BE-4 Auth 烟囱验证（如果脚本存在）
8. **业务接口**：使用 JWT Token 调用 GET /organizations，验证认证和授权

### 预期输出

成功时终端会显示：

```text
╔════════════════════════════════════════════════════════════════╗
║  ✅ BE-Phase1 (BE-0..BE-4) 验收通过                            ║
╚════════════════════════════════════════════════════════════════╝
```

脚本退出码为 0。

### 失败诊断

若任一步失败，脚本会：
- 打印清晰的错误信息和失败步骤名称
- 显示退出码非 0
- 自动清理后台服务进程

常见失败原因：
- 数据库连接问题：检查 `DATABASE_URL` 和 PostgreSQL 是否运行
- 编译或 Lint 错误：查看具体报错信息并修复代码
- 服务启动失败：检查 `/tmp/be_phase1_server.log` 日志文件
- JWT 验证失败：确保 `/auth/login` 和 `/auth/me` 端点正确实现

### 脚本位置

```
backend/tools/verify_be_phase1_all.sh
```

---

**更新日期**: 2024-11-14  
**版本**: 1.1

```

````

```
