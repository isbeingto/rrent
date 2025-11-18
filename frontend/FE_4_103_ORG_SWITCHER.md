# FE-4-103 组织切换功能实现报告

**TASK-ID**: FE-4-103  
**Title**: 组织切换（如用户有多个 org）  
**Date**: 2025-11-18  
**Status**: ✅ COMPLETED

---

## 📋 任务概述

实现前端的多组织切换能力，允许用户在拥有多个组织时进行切换，确保：
1. 所有 API 请求使用当前选中的组织 ID
2. 不破坏现有的 API 契约（query vs body vs header）
3. 通过测试锁死组织注入规则，避免未来回归

### 历史背景

在之前的任务中（FE-2-88/89/90/91），organizationId 的传递方式在不同资源间有所不同：
- **Tenants/Properties/Leases**: `create` 时 organizationId 在 **body** 中
- **Units**: `create` 时 organizationId 在 **query** 参数中
- **所有资源**: `getList/getOne/update/delete` 时 organizationId 在 **query** 参数中
- **所有请求**: Axios 拦截器添加 `X-Organization-Id` **header**

本任务旨在：
1. 统一使用 helper 函数获取当前组织，移除硬编码
2. 提供 UI 组件支持组织切换
3. 用测试验证切换后所有请求路径正确

---

## 🗂️ 文件清单

### 新增文件

1. **`/frontend/src/shared/auth/organization.ts`** - 组织相关 helper 函数
   - `getCurrentOrganizationId()`: 获取当前组织 ID
   - `getCurrentOrganizationCode()`: 获取当前组织代码
   - `getCurrentOrganization()`: 获取当前组织完整信息
   - `getUserOrganizations()`: 获取用户所有组织列表
   - `hasMultipleOrganizations()`: 检查是否有多个组织

2. **`/frontend/src/app/layout/OrgSwitcher.tsx`** - 组织切换器 UI 组件

3. **`/frontend/src/app/layout/__tests__/OrgSwitcher.test.tsx`** - 组织切换器测试

### 修改文件

1. **`/frontend/src/shared/auth/storage.ts`**
   - 扩展 `AuthPayload` 接口支持多组织
   - 新增 `switchOrganization()` 函数

2. **`/frontend/src/providers/dataProvider.ts`**
   - 所有方法改用 `getCurrentOrganizationId()` helper
   - 移除直接调用 `loadAuth()` 获取 organizationId

3. **`/frontend/src/lib/http.ts`**
   - Axios 拦截器改用 `getCurrentOrganizationId()` helper
   - 确保 `X-Organization-Id` header 始终使用最新的当前组织

4. **`/frontend/src/providers/authProvider.ts`**
   - 登录时保存 `organizationCode` 和 `organizations` 数组（如果后端提供）

5. **`/frontend/src/app/layout/MainLayout.tsx`**
   - 在顶部栏集成 `OrgSwitcher` 组件

6. **`/frontend/test/dataProvider.spec.ts`**
   - 新增 "FE-4-103: Organization Switching" 测试套件（6个测试用例）

---

## 🏗️ 实现详情

### 1. 统一的组织信息管理

#### 数据结构扩展 (`storage.ts`)

```typescript
export interface OrganizationInfo {
  id: string;
  name: string;
  code?: string;
}

export interface AuthPayload {
  token: string;
  organizationId: string;
  organizationCode?: string;
  user: {
    id: string;
    email: string;
    fullName?: string;
    role?: string;
    roles?: string[];
    organizations?: OrganizationInfo[];  // 新增：用户的组织列表
  };
}
```

#### 组织切换函数 (`storage.ts`)

```typescript
export function switchOrganization(organizationId: string, organizationCode?: string): void {
  const auth = loadAuth();
  if (!auth) return;

  // 验证该组织是否在用户的组织列表中
  if (auth.user.organizations && auth.user.organizations.length > 0) {
    const targetOrg = auth.user.organizations.find(org => org.id === organizationId);
    if (!targetOrg) {
      console.warn(`Organization ${organizationId} not found in user's organizations`);
      return;
    }
  }

  // 更新当前组织
  auth.organizationId = organizationId;
  if (organizationCode) {
    auth.organizationCode = organizationCode;
  }

  saveAuth(auth);
}
```

#### Helper 函数 (`organization.ts`)

```typescript
export function getCurrentOrganizationId(): string | null {
  const auth = loadAuth();
  return auth?.organizationId || null;
}

export function getCurrentOrganization(): OrganizationInfo | null {
  const auth = loadAuth();
  if (!auth) return null;

  // 如果用户有组织列表，从列表中找到当前组织
  if (auth.user.organizations && auth.user.organizations.length > 0) {
    const currentOrg = auth.user.organizations.find(
      org => org.id === auth.organizationId
    );
    if (currentOrg) return currentOrg;
  }

  // 回退：使用 auth 中的顶级字段
  return {
    id: auth.organizationId,
    code: auth.organizationCode,
    name: auth.organizationCode || auth.organizationId,
  };
}

export function hasMultipleOrganizations(): boolean {
  const orgs = getUserOrganizations();
  return orgs.length > 1;
}
```

### 2. OrgSwitcher 组件

```tsx
export default function OrgSwitcher() {
  const invalidate = useInvalidate();
  const organizations = getUserOrganizations();
  const currentOrgId = getCurrentOrganizationId();

  // 如果只有一个或没有组织，不显示切换器
  if (!hasMultipleOrganizations()) {
    return null;
  }

  const handleChange = (value: string) => {
    const targetOrg = organizations.find(org => org.id === value);
    if (!targetOrg) return;

    // 切换组织
    switchOrganization(targetOrg.id, targetOrg.code);

    // 清除所有资源缓存
    invalidate({ resource: "*", invalidates: ["all"] });

    // 刷新页面以确保所有状态重置
    window.location.reload();
  };

  return (
    <Select
      value={currentOrgId || undefined}
      onChange={handleChange}
      style={{ minWidth: 180 }}
      placeholder="选择组织"
      suffixIcon={<SwapOutlined />}
      options={organizations.map(org => ({
        label: org.name,
        value: org.id,
      }))}
    />
  );
}
```

**设计要点：**
- 单组织用户：组件返回 `null`，不占用任何 UI 空间
- 多组织用户：显示下拉选择器，列出所有组织
- 切换后：
  1. 调用 `switchOrganization()` 更新 localStorage
  2. 使用 `useInvalidate()` 清除 Refine 缓存
  3. 刷新页面确保所有状态重置

### 3. DataProvider 更新

**所有方法统一使用 `getCurrentOrganizationId()`**：

```typescript
// 修改前（直接调用 loadAuth）
const auth = loadAuth();
if (auth?.organizationId && resource !== 'organizations') {
  queryParams.organizationId = auth.organizationId;
}

// 修改后（使用统一 helper）
const organizationId = getCurrentOrganizationId();
if (organizationId && resource !== 'organizations') {
  queryParams.organizationId = organizationId;
}
```

**变更点：**
- `getList()`: ✅ 使用 helper
- `getOne()`: ✅ 使用 helper
- `create()`: ✅ 使用 helper（body 和 query 两种方式）
- `update()`: ✅ 使用 helper
- `deleteOne()`: ✅ 使用 helper

### 4. Axios 拦截器更新

```typescript
httpClient.interceptors.request.use((config) => {
  const auth = loadAuth();
  
  if (auth) {
    // JWT Token
    if (auth.token) {
      config.headers.Authorization = `Bearer ${auth.token}`;
    }

    // 组织信息（使用 helper 确保始终使用最新的当前组织）
    const currentOrgId = getCurrentOrganizationId();
    if (currentOrgId) {
      config.headers["X-Organization-Id"] = currentOrgId;
    }
  }

  return config;
});
```

---

## ✅ API 契约保持不变

本任务 **没有** 改变任何 API 契约，只是将硬编码的组织 ID 获取方式改为统一的 helper：

| 资源 | 操作 | organizationId 位置 | 变更 |
|-----|------|-------------------|------|
| Tenants | create | **body** | ❌ 无变更 |
| Properties | create | **body** | ❌ 无变更 |
| Leases | create | **body** | ❌ 无变更 |
| Units | create | **query** | ❌ 无变更 |
| 所有资源 | getList/getOne/update/delete | **query** | ❌ 无变更 |
| 所有请求 | - | **X-Organization-Id header** | ❌ 无变更 |

---

## 🧪 测试覆盖

### 1. OrgSwitcher 组件测试

文件: `/frontend/src/app/layout/__tests__/OrgSwitcher.test.tsx`

**测试用例：**

| 场景 | 测试点 | 状态 |
|-----|-------|------|
| 单组织用户 | 只有一个组织时不显示 | ✅ |
| 单组织用户 | 没有组织信息时不显示 | ✅ |
| 多组织用户 | 有多个组织时显示选择器 | ✅ |
| 多组织用户 | 切换组织时调用 switchOrganization | ✅ |
| localStorage | 切换后 auth 数据更新 | ✅ |
| localStorage | 尝试切换到不存在的组织时警告 | ✅ |

### 2. DataProvider 组织切换测试

文件: `/frontend/test/dataProvider.spec.ts`

新增测试套件: **"FE-4-103: Organization Switching"**

**测试用例（全部通过）：**

| 测试用例 | 验证内容 | 状态 |
|---------|---------|------|
| getList 切换组织 | 第一次使用 orgA，第二次使用 orgB | ✅ PASS |
| getOne 切换组织 | URL 中的 organizationId 从 orgA 变为 orgB | ✅ PASS |
| create 切换组织（body） | Tenants/Properties/Leases body 中的 organizationId 切换 | ✅ PASS |
| create 切换组织（query） | Units query 中的 organizationId 切换 | ✅ PASS |
| update 切换组织 | URL 中的 organizationId 从 orgA 变为 orgB | ✅ PASS |
| delete 切换组织 | URL 中的 organizationId 从 orgA 变为 orgB | ✅ PASS |

**测试结果：**

```
Test Suites: 1 passed, 1 total
Tests:       48 passed, 48 total (包括 6 个组织切换测试)
Time:        7.823 s
```

---

## 📝 浏览器验证步骤

由于当前后端 **尚未** 返回多组织数据（`user.organizations`），以下是浏览器实测的步骤：

### 准备工作

1. 启动后端和前端：
   ```bash
   # 后端
   cd /srv/rrent/backend && pnpm run start:dev

   # 前端
   cd /srv/rrent/frontend && pnpm run dev
   ```

2. 登录系统（使用任意测试账号）

### 场景 1：单组织用户（当前默认行为）

1. 打开浏览器 DevTools → Application → Local Storage → `rrent_auth`
2. 查看 auth 数据：
   ```json
   {
     "token": "...",
     "organizationId": "demo-org",
     "user": {
       "id": "...",
       "email": "...",
       // organizations 字段不存在或为空
     }
   }
   ```
3. **预期结果**：顶部栏 **不显示** OrgSwitcher 组件

### 场景 2：模拟多组织用户

1. 在 DevTools Console 中手动修改 localStorage：
   ```javascript
   const auth = JSON.parse(localStorage.getItem('rrent_auth'));
   auth.user.organizations = [
     { id: 'orgA', name: 'Organization A', code: 'ORG_A' },
     { id: 'orgB', name: 'Organization B', code: 'ORG_B' }
   ];
   auth.organizationId = 'orgA';
   localStorage.setItem('rrent_auth', JSON.stringify(auth));
   ```

2. 刷新页面（F5）

3. **预期结果**：顶部栏显示 OrgSwitcher，选中 "Organization A"

### 场景 3：切换组织

1. 点击 OrgSwitcher 下拉菜单
2. 选择 "Organization B"
3. **预期行为**：
   - localStorage 中 `auth.organizationId` 变为 `orgB`
   - 页面自动刷新
   - 所有后续请求使用 `orgB`

4. 验证请求（Network 面板）：
   ```
   GET /api/tenants?page=1&limit=20&organizationId=orgB
   Header: X-Organization-Id: orgB
   ```

### 场景 4：刷新后保持选择

1. 切换到 Organization B 后
2. 手动刷新浏览器（F5）
3. **预期结果**：
   - OrgSwitcher 仍然显示 "Organization B"
   - 所有请求仍然使用 `orgB`

---

## 🔍 与之前任务的关联

### 已验证的 API 契约（不受影响）

本任务基于以下任务的契约，并通过测试确保它们不被破坏：

- **FE-2-88**: Units API 契约（query 参数注入）
- **FE-2-89**: Tenants API 契约（body 注入 + query 注入）
- **FE-2-90**: Properties/Leases 列表分页契约
- **FE-2-91**: Leases CRUD 契约（body + query 混合）
- **FE-1-80**: Axios 拦截器（header 注入）

### 测试套件覆盖

| 任务 | 测试文件 | 状态 |
|-----|---------|------|
| FE-1-82 | `test/dataProvider.spec.ts` | ✅ 48 passed（含 FE-4-103 新增 6 个） |
| FE-4-103 | `src/app/layout/__tests__/OrgSwitcher.test.tsx` | ✅ 6 passed |

---

## 🚧 已知限制与后续工作

### 1. 后端支持待对齐

**当前状态：**
- 后端登录接口 (`POST /auth/login`) 只返回单个 `organizationId`
- 不返回 `user.organizations` 数组

**前端已准备好：**
- AuthProvider 会保存 `organizations` 数组（如果后端提供）
- OrgSwitcher 会在有多个组织时自动显示

**后续需要：**
- 后端在登录响应中增加 `organizations` 字段：
  ```json
  {
    "accessToken": "...",
    "user": {
      "id": "...",
      "organizationId": "current-org-id",
      "organizations": [
        { "id": "org1", "name": "Org 1", "code": "ORG1" },
        { "id": "org2", "name": "Org 2", "code": "ORG2" }
      ]
    }
  }
  ```

### 2. 切换组织时的用户体验

**当前实现：**
- 切换组织后 **刷新整个页面** (`window.location.reload()`)

**原因：**
- 确保所有状态（Refine 缓存、React 状态、内存中的引用）完全重置
- 避免跨组织数据泄漏

**未来优化（可选）：**
- 使用 React Router 的导航 + Refine 的 `invalidate` 实现无刷新切换
- 需要确保所有组件正确响应 auth 变化

### 3. 权限检查

**当前未实现：**
- 切换组织时没有检查用户在新组织中的权限

**未来需要：**
- 切换组织后重新检查用户权限
- 如果用户在新组织中是 viewer，隐藏相关操作按钮

---

## 📊 总结

### 完成内容

✅ 统一组织信息获取（`getCurrentOrganizationId()` helper）  
✅ 移除所有硬编码的 organizationId  
✅ 实现 OrgSwitcher UI 组件（多组织时显示）  
✅ 更新 dataProvider 所有方法使用 helper  
✅ 更新 Axios 拦截器使用 helper  
✅ 扩展 authProvider 保存组织列表  
✅ 编写 OrgSwitcher 组件测试（6 个用例）  
✅ 扩展 dataProvider 测试验证组织切换（6 个用例）  
✅ 所有测试通过（48 passed）  
✅ 不破坏现有 API 契约（Tenants/Units/Properties/Leases）

### 测试通过率

- **DataProvider 测试**: 48/48 passed ✅
- **OrgSwitcher 测试**: 6/6 passed ✅
- **总体测试**: 54/54 passed ✅

### 代码质量

- ✅ 无硬编码 organizationId
- ✅ 统一使用 helper 函数
- ✅ 类型安全（TypeScript 严格模式）
- ✅ 向后兼容（单组织用户无影响）
- ✅ 前向兼容（后端提供多组织数据时即可启用）

---

## 🎯 验收清单

- [x] OrgSwitcher 组件实现
- [x] 统一的组织 helper 函数
- [x] dataProvider 更新使用 helper
- [x] Axios 拦截器更新使用 helper
- [x] authProvider 扩展支持多组织
- [x] MainLayout 集成 OrgSwitcher
- [x] 组件测试（6 个用例全部通过）
- [x] dataProvider 组织切换测试（6 个用例全部通过）
- [x] 静态检查通过（无 TS 错误）
- [x] 不破坏现有 API 契约
- [x] 文档完整（本文件）

---

**任务状态**: ✅ **COMPLETED**  
**测试状态**: ✅ **ALL PASSED (54/54)**  
**文档状态**: ✅ **COMPLETE**

