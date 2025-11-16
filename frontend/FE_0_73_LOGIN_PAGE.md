# FE-0-73：登录页路由与表单

## 概述

本文档说明 FE-0-73 任务的实现细节，包括登录页路由、表单组件及未来的 API 接入点。

---

## 路由配置

### 入口

- **路径**：`/login`
- **组件**：`src/pages/auth/LoginPage.tsx`
- **类型**：公开路由，不包装在 MainLayout（不显示在侧边菜单中）

### 路由注册位置

- **文件**：`src/app/AppRoutes.tsx`
- **代码**：
  ```tsx
  <Routes>
    {/* 公开路由 - 登录页 */}
    <Route path="/login" element={<LoginPage />} />

    {/* 主应用布局及业务路由 */}
    <Route path="/" element={<MainLayout />}>
      {/* 其他业务路由... */}
    </Route>
  </Routes>
  ```

---

## 登录表单

### 组件文件

- `src/pages/auth/LoginPage.tsx`

### UI 设计

- **布局**：Layout 居中（水平/垂直）
- **容器**：AntD Card，最大宽度 400px
- **标题**："登录"
- **响应式**：卡片宽度自适应容器

### 表单字段

#### 1. 邮箱（email）

- **类型**：email input
- **必填**：是
- **校验规则**：
  - 不能为空，提示："请输入邮箱地址"
  - 格式校验，提示："请输入正确的邮箱地址"
- **占位符**：请输入邮箱

#### 2. 密码（password）

- **类型**：password input
- **必填**：是
- **校验规则**：
  - 不能为空，提示："请输入密码"
  - 最少 6 位，提示："密码长度至少 6 位"
- **占位符**：请输入密码（至少 6 位）

#### 3. 组织代码（organizationCode）

- **类型**：text input
- **必填**：是
- **校验规则**：
  - 不能为空，提示："请输入组织代码"
- **占位符**：请输入组织代码

### 提交按钮

- **文本**："登录"
- **样式**：primary type，block 宽度
- **加载态**：点击提交时显示 loading 状态

---

## 表单提交行为（占位逻辑）

### 当前实现

表单所有字段合法且点击登录按钮时，会触发以下行为：

1. **控制台输出**（用于开发调试）

   ```javascript
   [LOGIN_STUB] { email: "...", password: "...", organizationCode: "..." }
   ```

2. **用户提示**
   - 页面右上角弹出 AntD message.success，文案："登录请求已发送（当前为占位逻辑）"

3. **代码位置**
   - `src/pages/auth/LoginPage.tsx` 中的 `handleLogin()` 函数

### TODO 标记

在代码中有明确的 TODO 注释，指示后续接入真实 API 的位置：

```tsx
// TODO(FE-1-Auth): 将此处替换为真实 /auth/login API 调用与 Token 处理
```

该注释出现在：

1. `handleLogin()` 函数的 try 块中（API 调用位置）
2. 文件顶部的函数文档注释（关键说明）

---

## 与后续任务的关联

### FE-1-Auth

负责以下内容：

- 将 `handleLogin()` 中的占位逻辑替换为真实 `/auth/login` API 调用
- 实现 JWT Token 存储（localStorage / cookie）
- 集成 Refine 的 `authProvider`
- 实现登录后的重定向逻辑

### 当前任务（FE-0-73）不涉及

- ❌ JWT Token 管理
- ❌ Refine authProvider 集成
- ❌ 登录后的重定向
- ❌ 权限校验

---

## 验证清单

### 代码质量

- ✅ `pnpm lint` 无错误无警告
- ✅ `pnpm build` 编译成功，无 TypeScript 错误

### 功能验证

- ✅ 访问 `http://localhost:5174/login` 正常加载
- ✅ 页面中央显示 Card，标题为"登录"
- ✅ 表单包含邮箱、密码、组织代码三个字段
- ✅ 缺少必填字段时，点击登录显示校验错误
- ✅ 邮箱格式错误时，显示错误提示
- ✅ 密码少于 6 位时，显示错误提示
- ✅ 所有字段合法时，点击登录触发控制台输出和 message.success

### 路由与导航

- ✅ `/login` 不在主侧边菜单中
- ✅ 访问 `/` 等业务路由时，不会意外跳转

---

## 文件修改总结

| 文件                           | 操作 | 说明                             |
| ------------------------------ | ---- | -------------------------------- |
| `src/pages/auth/LoginPage.tsx` | 新增 | 登录页组件，AntD 表单 + 占位逻辑 |
| `src/app/AppRoutes.tsx`        | 修改 | 添加 `/login` 公开路由           |

---

## 后续步骤参考

1. **FE-1-Auth**：接入真实登录 API、Token 管理、权限检查
2. **FE-2-Dashboard**：登录后跳转首页逻辑
3. **BE 集成**：对接 BE-4/BE-6 提供的 `/auth/login` 接口
