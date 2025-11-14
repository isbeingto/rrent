# TASK 41-42 完整实现指南

## 概述

成功实现了基于角色的访问控制 (RBAC) 系统，涵盖：
- ✅ **TASK 41**: 所有 6 个资源控制器的权限守卫集成
- ✅ **TASK 42**: 管理员用户创建命令行脚本

## 架构设计

### 三层安全防御机制

```
┌─────────────────────────────────────────────────────────┐
│                    HTTP Request                         │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────▼────────────┐
          │  Layer 1: JwtAuthGuard  │
          │   (认证 - 验证身份)      │
          │                        │
          │ ✓ 验证 JWT token      │
          │ ✓ 解析 payload        │
          │ ✓ 注入 request.user   │
          └────────────┬───────────┘
                       │
          ┌────────────▼────────────┐
          │   Layer 2: RolesGuard   │
          │  (授权 - 检查权限)      │
          │                        │
          │ ✓ 读取 @Roles()       │
          │ ✓ 获取 request.user   │
          │ ✓ 验证角色匹配        │
          └────────────┬───────────┘
                       │
          ┌────────────▼────────────┐
          │   Layer 3: Handler      │
          │     (业务逻辑)          │
          │                        │
          │ ✓ 处理请求            │
          │ ✓ 返回响应            │
          └────────────────────────┘
```

### 请求流程示例

```typescript
// 1. 客户端发送请求
GET /api/properties
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// 2. JwtAuthGuard 验证
request.user = {
  sub: "user-id",
  email: "user@example.com",
  organizationId: "org-123",
  role: "OPERATOR"
}

// 3. RolesGuard 检查
@Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR, OrgRole.OPERATOR, OrgRole.STAFF)
✓ 用户角色 OPERATOR 在允许列表中 → 通过

// 4. Handler 处理
PropertyController.findAll() → 执行
```

## 权限矩阵完整参考

### Organization (组织管理)
严格的管理员控制，仅 OWNER 及以上可操作。

```
GET/LIST /organizations
├─ OWNER ✓
├─ PROPERTY_MGR ✓
├─ OPERATOR ✗
└─ STAFF ✗

POST /organizations (创建)
├─ OWNER ✓
├─ PROPERTY_MGR ✗
├─ OPERATOR ✗
└─ STAFF ✗

PUT /organizations/:id (更新)
├─ OWNER ✓
├─ PROPERTY_MGR ✗
├─ OPERATOR ✗
└─ STAFF ✗

DELETE /organizations/:id (删除)
├─ OWNER ✓
├─ PROPERTY_MGR ✗
├─ OPERATOR ✗
└─ STAFF ✗
```

### Property, Unit, Tenant, Lease, Payment (通用矩阵)
基于操作类型的渐进式权限控制。

```
GET/LIST (查看)
├─ OWNER ✓        (最高级)
├─ PROPERTY_MGR ✓ (管理员)
├─ OPERATOR ✓     (操作员)
└─ STAFF ✓        (员工)

POST (创建)
├─ OWNER ✓        (最高级)
├─ PROPERTY_MGR ✓ (管理员)
├─ OPERATOR ✓     (操作员)
└─ STAFF ✗        (无权限)

PUT (更新)
├─ OWNER ✓        (最高级)
├─ PROPERTY_MGR ✓ (管理员)
├─ OPERATOR ✓     (操作员)
└─ STAFF ✗        (无权限)

DELETE (删除)
├─ OWNER ✓        (最高级)
├─ PROPERTY_MGR ✓ (管理员)
├─ OPERATOR ✗     (无权限)
└─ STAFF ✗        (无权限)
```

## 核心组件说明

### 1. JwtAuthGuard (认证守卫)
**位置**: `/src/modules/auth/guards/jwt-auth.guard.ts`

**职责**:
- 提取 Authorization header 中的 Bearer token
- 使用 JwtService 验证 token 有效性
- 解析 token payload 并注入到 `request.user`

**实现细节**:
```typescript
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request); // Bearer token
    
    if (!token) {
      throw new UnauthorizedException("No token provided");
    }

    try {
      const payload = this.jwtService.verify(token); // 验证签名和过期时间
      request.user = payload; // 注入解码后的 payload
      return true;
    } catch (error) {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}
```

**错误处理**:
- `No token provided` - 缺少 Authorization header 或格式错误
- `Invalid or expired token` - Token 签名无效或已过期

### 2. RolesGuard (授权守卫)
**位置**: `/src/common/guards/roles.guard.ts`

**职责**:
- 读取处理器上的 `@Roles()` 装饰器
- 从 `request.user` 获取用户角色
- 验证用户角色是否在允许列表中

**依赖**:
- `Reflector` - 读取元数据
- `request.user` - 由 JwtAuthGuard 提供

**实现流程**:
```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. 读取 @Roles() 元数据
    const requiredRoles = this.reflector.get<OrgRole[]>(
      ROLES_KEY,
      context.getHandler(),
    );
    
    if (!requiredRoles) {
      return true; // 无 @Roles 装饰器 → 允许
    }

    // 2. 获取当前用户
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 3. 验证角色
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException("Insufficient permissions");
    }

    return true;
  }
}
```

### 3. @Roles 装饰器
**位置**: `/src/common/decorators/roles.decorator.ts`

**用法**:
```typescript
@Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR)
async findAll() { ... }
```

**原理**: 使用 `SetMetadata` 将角色数组存储在方法元数据中，供 RolesGuard 读取。

## 实现细节

### 控制器级别应用守卫

```typescript
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";

@Controller("properties")
@UseGuards(JwtAuthGuard, RolesGuard) // ← 在类级别应用
export class PropertyController {
  @Get()
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR, OrgRole.OPERATOR, OrgRole.STAFF)
  async findAll() { ... }

  @Post()
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR, OrgRole.OPERATOR)
  async create() { ... }

  @Delete(":id")
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR)
  async remove() { ... }
}
```

### 分析角色继承

由于不同操作需要不同权限，我们使用显式列表而不是继承：

```typescript
// ❌ 不推荐: 难以维护
@Roles(OrgRole.OWNER)

// ✅ 推荐: 明确列出所有允许的角色
@Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR, OrgRole.OPERATOR)
```

**优势**:
- 明确的权限声明
- 易于审计和维护
- 避免意外的权限继承

## TASK 42: 用户创建脚本

### 脚本位置
`/backend/scripts/create-user.ts`

### 完整使用示例

#### 1. 创建管理员用户（指定密码）
```bash
npx ts-node scripts/create-user.ts \
  --email admin@company.com \
  --role OWNER \
  --org-code ORG001 \
  --password AdminPass123! \
  --full-name "Admin User"
```

#### 2. 创建操作员用户（自动生成密码）
```bash
npx ts-node scripts/create-user.ts \
  --email operator@company.com \
  --role OPERATOR \
  --org-code ORG001
```

#### 3. 批量创建用户（脚本）
```bash
#!/bin/bash

# create-users.sh
users=(
  "admin1:OWNER:ORG001"
  "operator1:OPERATOR:ORG001"
  "staff1:STAFF:ORG001"
  "operator2:OPERATOR:ORG002"
)

for user in "${users[@]}"; do
  IFS=':' read -r email role org <<< "$user"
  npx ts-node scripts/create-user.ts \
    --email "${email}@company.com" \
    --role "$role" \
    --org-code "$org"
done
```

### 脚本工作流

```
输入参数
  ├─ --email (必需)
  ├─ --role (必需)
  ├─ --org-code (必需)
  ├─ --password (可选)
  └─ --full-name (可选)
         │
         ▼
参数验证
  ├─ 检查必需字段
  ├─ 验证角色有效性
  └─ 生成密码（如需）
         │
         ▼
数据库查询
  ├─ 通过 code 查找组织
  ├─ 检查邮箱唯一性
  └─ 验证用户不存在
         │
         ▼
用户创建
  ├─ 密码 bcrypt 哈希
  ├─ 调用 UserService.create()
  └─ 返回用户信息（不含密码）
         │
         ▼
成功输出
  ├─ 打印用户信息
  ├─ 显示临时密码
  └─ 安全提示
```

### 错误处理矩阵

| 错误条件 | 错误信息 | HTTP 状态 |
|---------|---------|----------|
| 缺少必需参数 | "缺少必需参数。用法: ..." | 退出码 1 |
| 无效的角色 | "无效的角色: XXX" | 退出码 1 |
| 组织不存在 | "找不到组织代码: ORG001" | 退出码 1 |
| 邮箱已使用 | "邮箱已被使用" | 退出码 1 |
| 数据库错误 | "创建用户时出错: ..." | 退出码 1 |

## JWT Token 处理

### Token 结构 (由 AuthService.generateAccessToken 生成)

```typescript
// AuthService.generateAccessToken() 返回格式
{
  access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  expires_in: 3600  // 秒为单位
}
```

### Token Payload (由 JwtService.sign 编码)

```typescript
{
  sub: "user-id-uuid",
  email: "user@example.com",
  organizationId: "org-id-uuid",
  role: "OPERATOR",
  iat: 1234567890,
  exp: 1234571490
}
```

### 在客户端使用 Token

```javascript
// 1. 登录获取 token
const response = await fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    organizationCode: 'ORG001'
  })
});
const { access_token } = await response.json();

// 2. 在后续请求中使用 token
const data = await fetch('/api/properties', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});
```

## 验证清单

- ✅ 编译成功 (`npm run build`)
- ✅ Linting 通过 (`npm run lint`)
- ✅ BE-2 服务测试通过 (41/41 测试)
- ✅ JWT 认证守卫实现完成
- ✅ 角色授权守卫实现完成
- ✅ 所有 6 个控制器已保护
- ✅ 用户创建脚本已实现

## 文件清单

### 核心实现
- `/src/modules/auth/guards/jwt-auth.guard.ts` - JWT 认证守卫
- `/src/common/guards/roles.guard.ts` - 角色授权守卫 (已存在)
- `/src/common/decorators/roles.decorator.ts` - @Roles 装饰器 (已存在)

### 更新的控制器 (6 个)
- `/src/modules/organization/organization.controller.ts`
- `/src/modules/property/property.controller.ts`
- `/src/modules/unit/unit.controller.ts`
- `/src/modules/tenant/tenant.controller.ts`
- `/src/modules/lease/lease.controller.ts`
- `/src/modules/payment/payment.controller.ts`

### 脚本
- `/scripts/create-user.ts` - 用户创建命令行工具

## 后续集成建议

### 1. 测试端点权限
```bash
# 获取有效的 JWT token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "organizationCode": "ORG001"
  }'

# 使用 token 访问受保护的端点
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/properties
```

### 2. 测试权限拒绝
```bash
# 使用 STAFF 角色尝试删除（应返回 403 Forbidden）
curl -X DELETE http://localhost:3000/api/properties/prop-123 \
  -H "Authorization: Bearer <staff-token>"
```

### 3. 集成前端
```typescript
// 前端拦截器示例
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## 安全建议

1. **环境变量管理**
   - 在 `.env` 中设置 `JWT_SECRET` (足够长，建议 32+ 字符)
   - 不要在代码中硬编码密钥

2. **密码管理**
   - 脚本生成的密码应该在首次登录时强制修改
   - 支持密码重置流程

3. **Token 过期**
   - 设置合理的 TTL (Time To Live)
   - 实现 refresh token 机制用于长期会话

4. **审计日志**
   - 记录权限拒绝事件
   - 监控异常的访问模式

## 故障排查

### 问题: "No token provided"
```
原因: Authorization header 缺失或格式错误
解决: 确保请求中包含 "Authorization: Bearer <token>"
```

### 问题: "Invalid or expired token"
```
原因: Token 签名无效或已过期
解决: 重新获取新的 token (调用 /auth/login)
```

### 问题: "Insufficient permissions"
```
原因: 用户角色不在 @Roles() 列表中
解决: 更新用户角色或修改端点权限声明
```

## 总结

TASK 41-42 的实现提供了：
1. **完整的认证链路** - 从 JWT 验证到请求注入
2. **灵活的授权机制** - 基于角色的细粒度控制
3. **易于使用的用户管理工具** - CLI 脚本快速创建用户
4. **清晰的权限层级** - OWNER > PROPERTY_MGR > OPERATOR > STAFF

所有代码均已通过编译、Linting 和现有单元测试验证。
