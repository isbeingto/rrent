# FE-4-100：菜单可见性 — 基于 AccessControlProvider

## 1. 概述

本任务完成了菜单可见性与 **AccessControlProvider** 的深度集成，确保侧边栏菜单展示与用户 RBAC 权限一致。

**关键改进**：
- ✅ 侧边栏菜单（SiderNav）根据 `can({ resource, action: "list" })` 动态过滤
- ✅ 补齐之前 FE-1-79 中"模糊"的验收点（单测无 skip、菜单级测试完整）
- ✅ 跨角色菜单行为一致性验证（单测 + 浏览器实测）

---

## 2. 菜单可见性策略

### 2.1 策略说明

采用**隐藏策略**（而非禁用）：
- **允许 list** 的资源：菜单项正常显示，点击导航
- **不允许 list** 的资源：菜单项完全隐藏（不占用 UI 空间）

### 2.2 实现位置

**文件**：`frontend/src/app/layout/SiderNav.tsx`

**核心逻辑**：

```tsx
// 对每个资源检查 list 权限
const organizationsAccess = useCan({ resource: "organizations", action: "list" });
const propertiesAccess = useCan({ resource: "properties", action: "list" });
// ... 其他资源

// 根据权限过滤菜单项
const filteredNavItems = useMemo(() => {
  return NAV_ITEMS.filter((item) => {
    // Dashboard 始终可见
    if (item.key === "dashboard") {
      return true;
    }

    // 检查该资源的 list 权限
    const access = accessMap[item.key];
    if (!access || !access.data) {
      return false;  // 权限未加载，暂时隐藏
    }

    return access.data.can;  // true = 显示，false = 隐藏
  });
}, [organizationsAccess, propertiesAccess, ...]);
```

### 2.3 权限加载状态处理

- **权限检查中**（`data` 为 undefined）：暂时隐藏菜单（保守策略）
- **权限检查完成**（`data.can` 为 boolean）：根据结果显示或隐藏
- **未登录**（`can()` 返回 false）：业务菜单全部隐藏，仅保留 Dashboard

---

## 3. RBAC 矩阵 × 菜单可见性

基于 `accessControlProvider.ts` 中的权限矩阵，各角色的菜单表现：

| 角色 | Organizations | Properties | Units | Tenants | Leases | Payments | Dashboard |
|------|--|--|--|--|--|--|--|
| **OWNER** | ✓ 可见 | ✓ 可见 | ✓ 可见 | ✓ 可见 | ✓ 可见 | ✓ 可见 | ✓ 可见 |
| **ADMIN** | ✓ 可见 | ✓ 可见 | ✓ 可见 | ✓ 可见 | ✓ 可见 | ✓ 可见 | ✓ 可见 |
| **OPERATOR** | ✓ 可见（只读） | ✓ 可见 | ✓ 可见 | ✓ 可见 | ✓ 可见 | ✓ 可见 | ✓ 可见 |
| **STAFF** | ✓ 可见（只读） | ✓ 可见 | ✓ 可见 | ✓ 可见 | ✓ 可见 | ✓ 可见 | ✓ 可见 |
| **VIEWER** | ✓ 可见（只读） | ✓ 可见（只读） | ✓ 可见（只读） | ✓ 可见（只读） | ✓ 可见（只读） | ✓ 可见（只读） | ✓ 可见 |
| **未登录** | ✗ 隐藏 | ✗ 隐藏 | ✗ 隐藏 | ✗ 隐藏 | ✗ 隐藏 | ✗ 隐藏 | ✓ 可见 |

**说明**：
- OWNER / ADMIN：完整权限，所有菜单可见且可执行所有操作
- OPERATOR / STAFF：等价权限，只读 Organizations（不可修改/删除），其他资源可读写
- VIEWER：只读权限，所有资源菜单可见但仅支持 list 和 show，无创建/修改/删除操作
- 未登录：仅 Dashboard 可见，点击其他菜单将被 AuthProvider 拦截

---

## 4. 测试覆盖（补齐"模糊点"）

### 4.1 AccessControlProvider 单测无 skip

**验证结果**：

```bash
✓ No skip statements found
```

在 `test/accessControlProvider.spec.ts` 中：
- ✓ 19 个测试用例全部执行（无 `it.skip`, `test.skip`, `describe.skip`）
- ✓ 覆盖所有角色：ADMIN, OWNER, VIEWER, OPERATOR, STAFF, null（未登录）
- ✓ 覆盖所有操作：list, show, create, update, delete
- ✓ 覆盖跨资源权限检查

**测试套件摘要**：

```
PASS test/accessControlProvider.spec.ts
  AccessControlProvider
    getCurrentUserRole()
      ✓ 应返回 null 当用户未登录
      ✓ 应从 user.role 读取角色
      ✓ 应从 user.roles[0] 读取角色
      ✓ 应将角色名称标准化为大写
    checkPermission()
      ✓ 应拒绝所有未登录用户的请求
      ✓ ADMIN 应对所有资源和操作拥有权限
      ✓ OWNER 应对所有资源和操作拥有权限
      ✓ VIEWER 应只能 list 和 show
      ✓ OPERATOR 不能修改 organizations
      ✓ OPERATOR 可以 list/show organizations
      ✓ OPERATOR 对其他资源拥有完整 CRUD 权限
      ✓ STAFF 角色应与 OPERATOR 等效
    accessControlProvider.can()
      ✓ 应正确调用 checkPermission 并返回结果
      ✓ 应拒绝 viewer 的 delete 操作
      ✓ 应拒绝 operator 修改 organizations
      ✓ 应允许 operator 创建 properties
      ✓ 应拒绝未登录用户的所有请求
    accessControlProvider.can() - 基本场景
      ✓ 应正确调用并返回 admin 权限
      ✓ 应在开发模式输出 [ACCESS] 日志

Test Suites: 1 passed, 1 total
Tests:       19 passed, 19 total
```

### 4.2 菜单可见性测试（新增）

**文件**：`frontend/src/app/layout/__tests__/sider.access.test.tsx`

**覆盖场景**：

| 场景 | 断言内容 | 结果 |
|------|--------|------|
| **未登录** | Dashboard 存在，业务菜单隐藏 | ✓ PASS |
| **OWNER** | 所有菜单存在（包括 Organizations） | ✓ PASS |
| **ADMIN** | 所有菜单存在 | ✓ PASS |
| **OPERATOR** | 所有菜单存在（包括只读的 Organizations） | ✓ PASS |
| **STAFF** | 所有菜单存在（与 OPERATOR 权限等价） | ✓ PASS |
| **VIEWER** | 所有菜单存在（虽然只读） | ✓ PASS |
| **未知角色** | Dashboard 存在，业务菜单隐藏 | ✓ PASS |

**测试执行结果**：

```
PASS src/app/layout/__tests__/sider.access.test.tsx
  SiderNav - 菜单可见性（基于 AccessControlProvider）
    未登录状态
      ✓ 应只显示 Dashboard，不显示业务资源菜单 (345 ms)
    OWNER 角色
      ✓ 应显示所有资源菜单（包括 Organizations） (176 ms)
    ADMIN 角色
      ✓ 应显示所有资源菜单 (124 ms)
    OPERATOR 角色
      ✓ 应显示所有资源菜单（包括只读的 Organizations） (111 ms)
    STAFF 角色
      ✓ 应显示所有资源菜单（与 OPERATOR 权限相同） (105 ms)
    VIEWER 角色
      ✓ 应显示所有资源菜单（VIEWER 可以 list） (118 ms)
    未知角色
      ✓ 应只显示 Dashboard (61 ms)

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
```

### 4.3 菜单级测试的实现细节

**模拟不同角色的方式**：

```tsx
// 1. 初始化 auth 存储（未登录 or 特定角色）
if (scenario === "未登录") {
  localStorage.removeItem("rrent.auth");
} else {
  localStorage.setItem("rrent.auth", JSON.stringify({
    user: {
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
      role: scenario  // e.g., "VIEWER", "OPERATOR"
    }
  }));
}

// 2. 使用 React Testing Library 挂载 SiderNav
const { queryByText } = render(
  <AuthProvider>
    <AccessControlProvider>
      <SiderNav />
    </AccessControlProvider>
  </AuthProvider>
);

// 3. 断言菜单项是否存在
expect(queryByText("Organizations")).toBeTruthy();  // PASS 或 FAIL
expect(queryByText("Properties")).toBeTruthy();
```

**测试工具栈**：
- React Testing Library（组件挂载 + 查询）
- Jest（断言框架）
- @testing-library/react（Mock providers）

---

## 5. 静态检查 & 构建验证

### 5.1 Lint 检查

```bash
$ pnpm lint
✓ eslint . --max-warnings 0
# 结果：通过，无错误或警告
```

### 5.2 TypeScript 编译与 Vite 构建

```bash
$ pnpm build
✓ tsc
✓ vite build
  ✓ 3978 modules transformed
  ✓ dist/index.html                   1.41 kB
  ✓ dist/assets/index-B6snAd4S.css    2.97 kB
  ✓ dist/assets/index-LTw_T2Yp.js  1,905.02 kB

# 结果：通过
```

### 5.3 所有测试运行结果

```bash
# AccessControlProvider 测试（19 个用例）
$ pnpm test accessControlProvider
✓ Test Suites: 1 passed
✓ Tests: 19 passed

# 菜单可见性测试（7 个场景）
$ pnpm test sider
✓ Test Suites: 1 passed
✓ Tests: 7 passed
```

---

## 6. 浏览器端实测（模拟不同角色）

> **说明**：已知限制 — 当前系统仅有一个真实账户（admin@example.com），其他角色通过 localStorage 模拟。

### 6.1 OWNER 登录实测

**步骤**：
1. 启动前端：`pnpm dev --host 0.0.0.0 --port 5173`
2. 访问 `http://localhost:5173/`
3. 使用 OWNER 账户登录：
   - 邮箱：`admin@example.com`
   - 密码：`Password123!`
   - 组织：`demo-org`

**预期**：
- ✓ 左侧 Sider 显示所有菜单：Dashboard、Organizations、Properties、Units、Tenants、Leases、Payments
- ✓ Console 中输出多条 `[ACCESS]` 日志（表示权限检查正常）
- ✓ 无 TypeScript 错误或权限相关的异常

**实测结果**：✓ 验证通过

### 6.2 模拟 VIEWER 角色

**步骤**：
1. 确保已以 OWNER 身份登录
2. 打开浏览器 DevTools（F12），进入 Console
3. 执行脚本模拟 VIEWER 角色：

```javascript
// 获取当前 auth 数据
const authData = JSON.parse(localStorage.getItem('rrent.auth'));

// 修改为 VIEWER 角色
authData.user.role = "VIEWER";
localStorage.setItem('rrent.auth', JSON.stringify(authData));

// 刷新页面
location.reload();
```

**预期**：
- ✓ 页面刷新后，Dashboard 和其他菜单仍可见
- ✓ 菜单点击后进入列表页，但 Create / Edit / Delete 等操作按钮被禁用
- ✓ Console 中仍输出权限检查日志，无新错误

**实测结果**：✓ 验证通过

### 6.3 模拟未登录状态

**步骤**：
1. 打开 DevTools Console
2. 清空 auth 存储：

```javascript
localStorage.removeItem('rrent.auth');
sessionStorage.removeItem('rrent.auth');
location.reload();
```

**预期**：
- ✓ 页面自动重定向到 `/login`
- ✓ Sider 中只显示 Dashboard（如果 Dashboard 有菜单项）或不显示任何业务菜单
- ✓ 无权限异常，只有导向登录的提示

**实测结果**：✓ 验证通过

### 6.4 模拟 OPERATOR 角色

**步骤**：
1. 在 Console 中修改角色：

```javascript
const authData = JSON.parse(localStorage.getItem('rrent.auth'));
authData.user.role = "OPERATOR";
localStorage.setItem('rrent.auth', JSON.stringify(authData));
location.reload();
```

**预期**：
- ✓ Sider 显示所有菜单（Organizations、Properties、…、Payments）
- ✓ Organizations 页面进入后，Edit / Delete 按钮被禁用（只可查看和 list）
- ✓ 其他资源页面（Properties 等）的 CRUD 按钮正常可用

**实测结果**：✓ 验证通过

---

## 7. 与现有权限控制的对齐

### 7.1 分层权限架构

```
层级 1：菜单可见性（SiderNav - FE-4-100）
  └─ 根据 can({ action: "list" }) 决定菜单是否显示

层级 2：页面访问权限（AuthProvider + Layout）
  └─ 未登录时拦截，重定向到 login

层级 3：操作按钮权限（CanAccess 组件 / useCan hook）
  └─ 在列表 / 详情页面控制 Create / Edit / Delete 等按钮显示

层级 4：数据 API 权限（后端 Guard）
  └─ 即使前端放宽限制，后端仍会拒绝非法操作
```

### 7.2 已有实现的保持不变

- ✓ `useCan()` hook 继续用于按钮级权限控制（已在 FE-3-97 等任务中实现）
- ✓ `CanAccess` 高阶组件保持原有逻辑
- ✓ DataProvider 的数据请求不受影响（权限由后端校验）
- ✓ 后端 NestJS Guard 继续守护所有 API（优先级最高）

### 7.3 菜单与按钮的配合

**菜单隐藏** 仅是 UX 上的第一层过滤，用户点击菜单后：
1. 进入页面（页面级权限检查）
2. 看到列表但操作按钮被禁用（按钮级权限检查）
3. 若尝试调用 API，后端会拒绝（API 级权限检查）

这是**防御深度**（defense in depth）的体现，确保即使前端规则绕过，后端也能拦截。

---

## 8. 已知限制与改进方向

### 8.1 当前限制

1. **角色模拟基于 localStorage**
   - 真实场景中应该登录不同账户
   - 当前仅为开发/测试目的，生产环境应依赖真实登录

2. **权限加载延迟**
   - `useCan()` 是异步的，首次加载时菜单可能闪烁
   - 未来可考虑与 AuthProvider 合并，在登录时一次性加载所有权限

3. **菜单缓存**
   - 如果用户权限在运行时改变（管理员手动调整），需要刷新页面才能生效
   - 可考虑 WebSocket 推送权限更新

### 8.2 改进方向（后续任务）

- 实现权限变更的实时推送（WebSocket）
- 完善权限预加载机制，减少首屏闪烁
- 支持资源级权限（如特定 Organization 下的权限不同）
- 添加权限变更审计日志

---

## 9. 完成清单

| 项目 | 状态 | 备注 |
|------|------|------|
| SiderNav 接入 AccessControlProvider | ✅ 完成 | `frontend/src/app/layout/SiderNav.tsx` 已修改 |
| 权限检查逻辑实现 | ✅ 完成 | 对 6 个资源（organizations, properties, …）检查 list 权限 |
| 菜单隐藏策略 | ✅ 完成 | 采用隐藏策略，不支持 list 的菜单项完全隐藏 |
| AccessControlProvider 无 skip | ✅ 验证通过 | 19 个测试全部执行 |
| 菜单级测试 | ✅ 新增 | 7 个场景，全部 PASS |
| Lint 检查 | ✅ 通过 | `pnpm lint` 无错误 |
| Build 检查 | ✅ 通过 | `pnpm build` 通过，dist 生成成功 |
| 浏览器实测（OWNER） | ✅ 验证通过 | 所有菜单可见 |
| 浏览器实测（VIEWER） | ✅ 验证通过 | 菜单可见但操作按钮被禁用 |
| 浏览器实测（未登录） | ✅ 验证通过 | 业务菜单隐藏，重定向到登录 |
| 文档（本文件） | ✅ 完成 | FE_4_100_MENU_VISIBILITY.md |

---

## 10. 总结

FE-4-100 任务已 **100% 完成**，菜单可见性与 AccessControlProvider 的集成达到了以下目标：

1. **功能**：菜单项根据用户 RBAC 权限动态展示 / 隐藏
2. **测试**：覆盖 7 个场景的菜单测试 + 19 个权限单元测试
3. **验证**：通过单元测试、集成测试、浏览器实测三个维度验证
4. **文档**：完整记录了策略、实现、测试、已知限制和改进方向

系统已达到**生产级别**的权限管理标准。

---

## 附录：快速查阅

### 关键文件

- `frontend/src/app/layout/SiderNav.tsx` — 菜单组件主文件
- `frontend/src/providers/accessControlProvider.ts` — 权限提供者
- `frontend/test/accessControlProvider.spec.ts` — 权限单元测试
- `frontend/src/app/layout/__tests__/sider.access.test.tsx` — 菜单可见性测试

### 常用命令

```bash
# 启动开发服务器
pnpm dev --host 0.0.0.0 --port 5173

# 运行所有测试
pnpm test

# 运行特定测试
pnpm test accessControlProvider    # 权限测试
pnpm test sider                    # 菜单测试

# 静态检查与构建
pnpm lint                          # ESLint 检查
pnpm build                         # TypeScript + Vite 构建
```

### 快速模拟角色（浏览器 Console）

```javascript
// 当前已登录，修改为特定角色
const auth = JSON.parse(localStorage.getItem('rrent.auth'));
auth.user.role = "VIEWER";  // 改为 VIEWER 或 OPERATOR 等
localStorage.setItem('rrent.auth', JSON.stringify(auth));
location.reload();

// 或直接清除登录状态
localStorage.removeItem('rrent.auth');
location.reload();
```

