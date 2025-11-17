# FE-1-79: Access Control Provider 实现报告

**任务**: 实现基于用户 role 的 AccessControl Provider  
**状态**: ✅ 已完成  
**完成时间**: 2025-11-17

---

## 📋 任务概述

基于 FE-1-78 完成的 Auth Provider，实现 Refine 的 `accessControlProvider`，为未来的 FE-4 菜单/按钮权限控制提供基础设施。

### 核心需求

1. 支持基于用户角色的访问控制（RBAC）
2. 角色：ADMIN/OWNER（全权限）、OPERATOR/STAFF（受限）、VIEWER（只读）
3. 资源：organizations, properties, units, tenants, leases, payments
4. 操作：list, show, create, edit, delete
5. 开发环境输出 `[ACCESS]` 调试日志

---

## 🎯 实现细节

### 1. AccessControlProvider 实现

**文件**: `/frontend/src/providers/accessControlProvider.ts`

#### 权限矩阵

| 角色 | list | show | create | edit | delete | 特殊限制 |
|------|------|------|--------|------|--------|----------|
| **ADMIN/OWNER** | ✅ | ✅ | ✅ | ✅ | ✅ | 无限制 |
| **OPERATOR/STAFF** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ 不能修改 organizations |
| **VIEWER** | ✅ | ✅ | ❌ | ❌ | ❌ | 仅只读 |
| **未登录** | ❌ | ❌ | ❌ | ❌ | ❌ | 全部拒绝 |

#### 核心函数

```typescript
// 1. 从 auth storage 获取当前用户角色
function getCurrentUserRole(): UserRole | null {
  const auth = loadAuth();
  if (!auth || !auth.user) return null;
  
  // 支持 role 或 roles[0]，标准化为大写
  const role = auth.user.role || auth.user.roles?.[0];
  return role ? (role.toUpperCase() as UserRole) : null;
}

// 2. 核心权限检查逻辑
function checkPermission(
  role: UserRole | null,
  resource: string,
  action: string
): { can: boolean; reason?: string } {
  // 未登录 -> 拒绝
  if (!role) {
    return { can: false, reason: "未登录或角色未知" };
  }

  // ADMIN/OWNER -> 全部允许
  if (role === "ADMIN" || role === "OWNER") {
    return { can: true };
  }

  // VIEWER -> 仅 list/show
  if (role === "VIEWER") {
    if (action === "list" || action === "show") {
      return { can: true };
    }
    return { can: false, reason: "viewer 仅支持只读访问" };
  }

  // OPERATOR/STAFF -> organizations 只读，其他资源全权限
  if (role === "OPERATOR" || role === "STAFF") {
    if (resource === "organizations") {
      if (action === "list" || action === "show") {
        return { can: true };
      }
      return { can: false, reason: "operator 不能修改组织" };
    }
    // 其他资源全部允许
    return { can: true };
  }

  return { can: false, reason: "未知资源或操作" };
}

// 3. Refine AccessControlProvider 接口实现
export const accessControlProvider: AccessControlProvider = {
  can: async ({ resource, action }: CanParams) => {
    // 开发环境调试日志
    if (process.env.NODE_ENV !== "production") {
      const role = getCurrentUserRole();
      console.log("[ACCESS]", { role, resource, action });
    }

    // 验证参数
    if (!resource || !action) {
      return { can: false, reason: "资源或操作未定义" };
    }

    const role = getCurrentUserRole();
    return checkPermission(role, resource, action);
  },
};
```

### 2. App.tsx 集成

**文件**: `/frontend/src/App.tsx`

```tsx
import { accessControlProvider } from "@providers/accessControlProvider";

<Refine
  dataProvider={dataProvider}
  authProvider={authProvider}
  accessControlProvider={accessControlProvider}  // ← 新增
  notificationProvider={useNotificationProvider}
  routerProvider={routerProvider}
  resources={[...]}
/>
```

### 3. 与 Auth Provider 集成

```typescript
// authProvider.getPermissions() 返回 string[]
const permissions = await authProvider.getPermissions();
// 示例: ["admin"] 或 ["viewer"]

// accessControlProvider 读取 loadAuth().user.role
const role = getCurrentUserRole(); // "ADMIN" | "VIEWER" | ...
```

**数据流**:
1. 登录成功 → `authProvider.login()` 保存 auth 到 localStorage
2. 页面/组件渲染 → Refine 调用 `accessControlProvider.can()`
3. `can()` 从 localStorage 读取当前用户 role → `checkPermission()` 判断
4. 返回 `{ can: true/false, reason?: string }`

---

## 🧪 测试覆盖

### 单元测试

**文件**: `/frontend/test/accessControlProvider.spec.ts`

**测试套件**:
- ✅ `getCurrentUserRole()` - 4 个测试
  - 未登录返回 null
  - 从 `user.role` 读取
  - 从 `user.roles[0]` 读取
  - 角色名称标准化为大写

- ✅ `checkPermission()` - 7 个测试
  - 未登录用户拒绝所有请求（30 组合）
  - ADMIN/OWNER 全权限（60 组合）
  - VIEWER 仅 list/show（36 组合）
  - OPERATOR 限制 organizations 修改（3 拒绝，2 允许）
  - OPERATOR 其他资源全权限（25 组合）
  - STAFF 与 OPERATOR 等效

- ✅ `accessControlProvider.can()` - 6 个测试
  - admin 正确权限返回
  - viewer 拒绝 delete
  - operator 拒绝修改 organizations
  - operator 允许创建 properties
  - 未登录拒绝所有
  - 开发模式日志输出

**覆盖率**: **19/19 测试通过**

```bash
$ pnpm test -- accessControlProvider.spec.ts

PASS test/accessControlProvider.spec.ts (5.944 s)
  AccessControlProvider
    getCurrentUserRole()
      ✓ 应返回 null 当用户未登录 (3 ms)
      ✓ 应从 user.role 读取角色 (1 ms)
      ✓ 应从 user.roles[0] 读取角色
      ✓ 应将角色名称标准化为大写
    checkPermission()
      ✓ 应拒绝所有未登录用户的请求 (15 ms)
      ✓ ADMIN 应对所有资源和操作拥有权限 (7 ms)
      ✓ OWNER 应对所有资源和操作拥有权限 (6 ms)
      ✓ VIEWER 应只能 list 和 show (9 ms)
      ✓ OPERATOR 不能修改 organizations (1 ms)
      ✓ OPERATOR 可以 list/show organizations (1 ms)
      ✓ OPERATOR 对其他资源拥有完整 CRUD 权限 (3 ms)
      ✓ STAFF 角色应与 OPERATOR 等效 (3 ms)
    accessControlProvider.can()
      ✓ 应正确调用 checkPermission 并返回结果 (34 ms)
      ✓ 应拒绝 viewer 的 delete 操作 (2 ms)
      ✓ 应拒绝 operator 修改 organizations (1 ms)
      ✓ 应允许 operator 创建 properties (1 ms)
      ✓ 应拒绝未登录用户的所有请求 (2 ms)
    accessControlProvider.can() - 基本场景
      ✓ 应正确调用并返回 admin 权限 (2 ms)
      ✓ 应在开发模式输出 [ACCESS] 日志 (2 ms)

Test Suites: 1 passed, 1 total
Tests:       19 passed, 19 total
```

### 静态检查

```bash
$ pnpm lint
✓ ESLint passed with 0 errors, 0 warnings

$ pnpm build
✓ TypeScript compilation succeeded
✓ Vite build completed (dist/)
```

### 浏览器测试

**测试账号**: admin@example.com / Password123! / demo-org  
**角色**: OWNER

**验证场景**:
1. ✅ 登录成功 → 跳转 Dashboard
2. ✅ 导航到 Organizations 页面
3. ✅ 导航到 Tenants 页面
4. ✅ 控制台输出 `[ACCESS]` 日志

**控制台日志示例**:
```
[ACCESS] {role: "OWNER", resource: "organizations", action: "list"}
[ACCESS] {role: "OWNER", resource: "properties", action: "list"}
[ACCESS] {role: "OWNER", resource: "tenants", action: "list"}
[ACCESS] {role: "OWNER", resource: "leases", action: "list"}
[ACCESS] {role: "OWNER", resource: "payments", action: "list"}
[ACCESS] {role: "OWNER", resource: "units", action: "list"}
```

**结果**: ✅ 无错误，权限检查正常运行

---

## 📝 技术决策

### 1. 使用 `process.env.NODE_ENV` 而非 `import.meta.env.DEV`

**原因**:
- Jest 测试环境不支持 `import.meta.env`
- `process.env.NODE_ENV` 在测试和开发环境均可用
- Vite 会在构建时替换 `process.env.NODE_ENV`

**实现**:
```typescript
if (process.env.NODE_ENV !== "production") {
  console.log("[ACCESS]", { role, resource, action });
}
```

### 2. 角色名称标准化

所有角色统一转为大写（`ADMIN`, `OWNER`, `VIEWER` 等），避免大小写不一致问题。

```typescript
const role = auth.user.role || auth.user.roles?.[0];
return role ? (role.toUpperCase() as UserRole) : null;
```

### 3. 支持 `role` 和 `roles` 两种格式

兼容后端可能返回单个 `role: string` 或数组 `roles: string[]`。

```typescript
const role = auth.user.role || auth.user.roles?.[0];
```

### 4. STAFF 与 OPERATOR 等效

当前业务场景下，`STAFF` 角色与 `OPERATOR` 权限一致，未来可根据需求细化。

### 5. 未定义资源/操作返回拒绝

```typescript
if (!resource || !action) {
  return { can: false, reason: "资源或操作未定义" };
}
```

确保 Refine 传入的参数有效性。

---

## 🔮 未来扩展（FE-4）

### 1. 菜单权限控制

使用 Refine 的 `CanAccess` 组件包裹菜单项：

```tsx
import { CanAccess } from "@refinedev/core";

<CanAccess resource="organizations" action="list">
  <Menu.Item key="organizations">
    Organizations
  </Menu.Item>
</CanAccess>
```

### 2. 按钮权限控制

```tsx
<CanAccess resource="properties" action="create">
  <Button type="primary">新增 Property</Button>
</CanAccess>
```

### 3. 细粒度权限（基于记录 ID）

当前实现不支持记录级权限（如"只能编辑自己创建的记录"）。未来可扩展：

```typescript
export const accessControlProvider: AccessControlProvider = {
  can: async ({ resource, action, params }: CanParams) => {
    const role = getCurrentUserRole();
    
    // 记录级权限检查
    if (action === "edit" && params?.id) {
      const record = await fetchRecord(resource, params.id);
      if (record.createdBy !== getCurrentUserId()) {
        return { can: false, reason: "只能编辑自己创建的记录" };
      }
    }
    
    return checkPermission(role, resource, action);
  },
};
```

### 4. 动态权限（后端配置）

当前权限规则硬编码在前端。未来可从后端 API 获取：

```typescript
// GET /api/permissions/me
// 返回: { role: "OPERATOR", resources: { organizations: ["list", "show"], ... } }

const permissions = await fetchUserPermissions();
return checkDynamicPermission(permissions, resource, action);
```

---

## 📊 完成情况总结

| 任务项 | 状态 | 备注 |
|--------|------|------|
| 创建 accessControlProvider.ts | ✅ | 138 行，支持 5 种角色 |
| 在 App.tsx 中挂载 | ✅ | 单行代码集成 |
| 创建单元测试 | ✅ | 19 个测试全部通过 |
| 运行静态检查 | ✅ | ESLint + TypeScript 通过 |
| 运行单元测试 | ✅ | 100% 通过率 |
| 开发环境验证 | ✅ | 浏览器测试无错误 |
| 编写文档 | ✅ | 本文档 |

---

## 🎉 交付成果

1. **核心实现**
   - `/frontend/src/providers/accessControlProvider.ts` - RBAC 核心逻辑
   - `/frontend/src/App.tsx` - 集成到 Refine

2. **测试文件**
   - `/frontend/test/accessControlProvider.spec.ts` - 19 个单元测试

3. **文档**
   - `/frontend/FE_1_79_ACCESS_CONTROL.md` - 本实现报告

---

## 🔗 相关任务

- ✅ **FE-1-77**: Data Provider 实现 → 提供 API 数据访问
- ✅ **FE-1-78**: Auth Provider 实现 → 提供用户认证和角色信息
- ✅ **FE-1-79**: Access Control Provider 实现 → 本任务
- 🔜 **FE-4**: 菜单/按钮权限控制 → 基于本任务的 RBAC 基础设施

---

## 📌 注意事项

### 开发模式调试

开发环境下，控制台会输出详细的权限检查日志：

```
[ACCESS] {role: "OWNER", resource: "organizations", action: "list"}
```

生产环境（`NODE_ENV=production`）不会输出日志。

### 后端角色同步

确保后端返回的用户角色名称与前端定义一致：
- 后端: `OrgRole.OWNER` → 前端: `"OWNER"`
- 后端: `OrgRole.STAFF` → 前端: `"STAFF"`

### 未登录处理

未登录用户所有权限检查返回 `{ can: false, reason: "未登录或角色未知" }`，Refine 会自动重定向到登录页面。

---

**任务完成**: FE-1-79 ✅  
**下一步**: 等待 FE-4 任务，实现基于 accessControlProvider 的 UI 权限控制
