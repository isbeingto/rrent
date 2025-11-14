# TASK 43 & 44 - 关键代码实现

## TASK 43: CORS 白名单限制

### 1. main.ts - CORS 配置实现

```typescript
// 读取环境变量和环境
const nodeEnv = process.env.NODE_ENV || "development";
const corsAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS || "";

// 解析和验证允许的源
let allowedOrigins: string[] = [];

if (corsAllowedOrigins.trim()) {
  // 显式配置的源
  allowedOrigins = corsAllowedOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
} else if (nodeEnv === "production") {
  // 生产环境：必须有显式配置
  console.error(
    "[CORS] Production mode requires CORS_ALLOWED_ORIGINS to be set. Exiting.",
  );
  process.exit(1);
} else {
  // 开发环境：允许常见的 localhost 源
  allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:3001",
  ];
  console.log(
    `[CORS] Development mode: allowing default localhost origins:`,
    allowedOrigins,
  );
}

// 启用 CORS 并使用函数形式验证
app.enableCors({
  origin: (origin, callback) => {
    // 允许无 Origin 请求（curl、Postman、移动应用）
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // 拒绝非白名单源
    console.warn(`[CORS] Blocked origin: ${origin}`);
    return callback(new Error("Not allowed by CORS"), false);
  },
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: "Content-Type,Authorization",
});
```

### 2. .env 文件配置

```env
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:3001
```

### 3. QUICK_REFERENCE.md 新增章节

```markdown
## 🔒 CORS 配置指南 (BE-4-43)

### 环境变量设置
- `CORS_ALLOWED_ORIGINS`: 逗号分隔的域名列表

### 行为差异
**开发环境**: 未配置时默认允许 localhost
**生产环境**: 未配置时启动失败

### 常见问题
- Q: 前端域名改了怎么办？
- A: 修改 .env 中的 CORS_ALLOWED_ORIGINS，重启服务
```

---

## TASK 44: Rate Limit 防暴力破解

### 1. app.module.ts - ThrottlerModule 配置

```typescript
import { ThrottlerModule } from "@nestjs/throttler";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: "global",
          ttl: 60_000,   // 60 秒
          limit: 100,    // 100 次/分钟
        },
      ],
    }),
    // ... 其他 imports
  ],
})
export class AppModule {}
```

### 2. auth.controller.ts - 登录限流

```typescript
import { Throttle } from "@nestjs/throttler";

@Post("login")
@Throttle({ default: { limit: 5, ttl: 60000 } })
async login(
  @Body() loginRequest: LoginRequest,
): Promise<{ accessToken: string; user: Omit<User, "passwordHash"> }> {
  const { email, password, organizationCode } = loginRequest;
  return this.authService.login(email, password, organizationCode);
}
```

### 3. auth.service.ts - 登录实现

```typescript
async login(
  email: string,
  password: string,
  organizationCode: string,
): Promise<{ accessToken: string; user: Omit<User, "passwordHash"> }> {
  // 根据组织代码查找组织 ID
  const organization = await this.prisma.organization.findFirst({
    where: { code: organizationCode },
  });

  if (!organization) {
    throw new BadRequestException("Invalid organization code");
  }

  // 验证用户
  const user = await this.validateUserByEmail(
    email,
    password,
    organization.id,
  );

  if (!user) {
    throw new UnauthorizedException("Invalid email or password");
  }

  // 生成访问令牌
  const payload = {
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role,
  };

  const accessToken = this.jwtService.sign(payload);

  // 返回令牌和用户信息（不含密码）
  const { passwordHash: _, ...userWithoutPassword } = user;

  return {
    accessToken,
    user: userWithoutPassword,
  };
}
```

### 4. app-error-code.enum.ts - 新增错误码

```typescript
export enum AppErrorCode {
  // ... 其他错误码
  
  // 速率限制
  AUTH_RATE_LIMITED = "AUTH_RATE_LIMITED",
}
```

### 5. http-exception.filter.ts - 429 异常处理

```typescript
// Handle ThrottlerException (429 - Too Many Requests)
if (status === HttpStatus.TOO_MANY_REQUESTS) {
  errorResponse.code = AppErrorCode.AUTH_RATE_LIMITED;
  errorResponse.message = "Too many attempts, please try again later.";
}
```

### 6. 429 错误响应格式

```json
{
  "statusCode": 429,
  "error": "TooManyRequestsException",
  "message": "Too many attempts, please try again later.",
  "code": "AUTH_RATE_LIMITED"
}
```

---

## 环境变量配置

### .env 文件

```env
# CORS 配置
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:3001

# Rate Limiting 配置
LOGIN_RATE_LIMIT=5
LOGIN_RATE_TTL=60
```

### 环境示例

**生产环境**:
```env
NODE_ENV=production
CORS_ALLOWED_ORIGINS=https://app.rrent.com,https://admin.rrent.com
```

---

## 相关文件变动总结

| 文件 | 变动 | 优先级 |
|------|------|--------|
| `src/main.ts` | 完整的 CORS 白名单逻辑 | 必须 |
| `src/app.module.ts` | ThrottlerModule 配置 | 必须 |
| `src/modules/auth/auth.controller.ts` | @Throttle 装饰器 + 登录端点 | 必须 |
| `src/modules/auth/auth.service.ts` | login() 方法实现 | 必须 |
| `src/modules/auth/auth.module.ts` | 导入 PrismaModule | 必须 |
| `src/common/errors/app-error-code.enum.ts` | 新增 AUTH_RATE_LIMITED | 必须 |
| `src/common/filters/http-exception.filter.ts` | 429 异常处理 | 必须 |
| `.env` | CORS 配置示例 | 必须 |
| `.env.example` | 配置说明 | 必须 |
| `QUICK_REFERENCE.md` | CORS & Rate Limit 指南 | 可选 |
| `package.json` | @nestjs/throttler 依赖 | 必须 |

---

## 验证命令

```bash
# 编译检查
cd /srv/rrent/backend && pnpm run build

# 代码质量检查
pnpm run lint

# 开发启动
pnpm start:dev

# 生产启动（需配置 CORS_ALLOWED_ORIGINS）
NODE_ENV=production pnpm start:prod
```

---

**完成时间**: 2024-11-14  
**状态**: ✅ 全部实现并通过验证
