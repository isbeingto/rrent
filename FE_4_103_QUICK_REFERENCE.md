# FE-4-103 快速参考指南

## 🎯 任务概览
实现多组织切换功能，为用户提供在多个组织间快速切换的能力。

**状态**: ✅ COMPLETED  
**测试**: ✅ ALL PASSED (191/191)  
**文档**: ✅ COMPLETE

---

## 📦 核心 API

### 获取组织信息
```typescript
import { getCurrentOrganizationId, getCurrentOrganization, getUserOrganizations } from '@shared/auth/organization';

// 获取当前组织ID
const orgId = getCurrentOrganizationId(); // 返回: string | null

// 获取当前组织完整信息
const org = getCurrentOrganization(); // 返回: { id, name, code }

// 获取用户所有组织
const orgs = getUserOrganizations(); // 返回: OrganizationInfo[]

// 检查是否有多个组织
if (hasMultipleOrganizations()) {
  // 显示组织切换器
}
```

### 切换组织
```typescript
import { switchOrganization } from '@shared/auth/storage';

// 切换组织
switchOrganization('org-id', 'org-code');
// 自动更新 localStorage，所有后续请求自动使用新组织
```

---

## 🎨 UI 组件

### OrgSwitcher 组件
```tsx
import OrgSwitcher from '@app/layout/OrgSwitcher';

<OrgSwitcher />
// 已集成到 MainLayout（位置：顶部栏）
// 单组织时: 不显示任何内容
// 多组织时: 显示下拉选择器
```

---

## 📋 文件位置

**新增文件**:
- `frontend/src/shared/auth/organization.ts` - Helper 函数
- `frontend/src/app/layout/OrgSwitcher.tsx` - UI 组件
- `frontend/src/app/layout/__tests__/OrgSwitcher.test.tsx` - 组件测试

**修改文件**:
- `frontend/src/shared/auth/storage.ts` - 新增 switchOrganization()
- `frontend/src/providers/dataProvider.ts` - 使用 helper 函数
- `frontend/src/lib/http.ts` - Axios 拦截器使用 helper
- `frontend/src/providers/authProvider.ts` - 保存 organizations 数组
- `frontend/src/app/layout/MainLayout.tsx` - 集成 OrgSwitcher
- `frontend/test/dataProvider.spec.ts` - 新增组织切换测试

**完整文档**:
- `frontend/FE_4_103_ORG_SWITCHER.md` - 详细的任务报告

---

## 🧪 测试

### 运行所有前端测试
```bash
cd /srv/rrent/frontend
pnpm test
```

**预期结果**: 191 passed, 191 total ✅

### 运行 OrgSwitcher 组件测试
```bash
cd /srv/rrent/frontend
pnpm test -- OrgSwitcher
```

**预期结果**: 6 passed, 6 total ✅

### 运行 DataProvider 组织切换测试
```bash
cd /srv/rrent/frontend
pnpm test -- dataProvider
```

**预期结果**: 48 passed（含 6 个新增组织切换测试）✅

---

## 🔍 API 契约（保持不变）

| 操作 | organizationId 位置 | 示例 |
|------|-------------------|------|
| 列表查询 | URL query | `GET /api/tenants?organizationId=org-id` |
| 获取详情 | URL query | `GET /api/tenants/id?organizationId=org-id` |
| Tenants create | Body | `{ organizationId, ... }` |
| Properties create | Body | `{ organizationId, ... }` |
| Leases create | Body | `{ organizationId, ... }` |
| Units create | Query | `POST /api/units?organizationId=org-id` |
| 所有请求 | Header | `X-Organization-Id: org-id` |

---

## 📝 数据模型

### AuthPayload 接口扩展
```typescript
interface AuthPayload {
  token: string;
  organizationId: string;        // 当前组织
  organizationCode?: string;     // 当前组织代码
  user: {
    id: string;
    email: string;
    organizations?: [{           // 用户所有组织（后端提供时）
      id: string;
      name: string;
      code?: string;
    }];
  };
}
```

---

## 🚀 使用场景

### 场景 1: 显示用户所在的组织
```tsx
const currentOrg = getCurrentOrganization();
console.log(`当前在 ${currentOrg?.name} 组织`);
```

### 场景 2: 条件显示组织切换器
```tsx
if (hasMultipleOrganizations()) {
  return <OrgSwitcher />;
}
```

### 场景 3: 手动切换组织（例如在菜单中）
```tsx
const handleSwitchOrg = (orgId: string) => {
  const org = getUserOrganizations().find(o => o.id === orgId);
  if (org) {
    switchOrganization(org.id, org.code);
    window.location.reload(); // 重新加载页面确保所有状态重置
  }
};
```

---

## ⚙️ 配置与环境

无需特殊配置。系统自动从 localStorage 中读取当前组织信息。

**localStorage 中的数据结构**：
```json
{
  "rrent_auth": {
    "token": "...",
    "organizationId": "current-org-id",
    "organizationCode": "ORG_CODE",
    "user": {
      "id": "...",
      "email": "...",
      "organizations": [...]
    }
  }
}
```

---

## 🔄 组织切换流程

```
用户点击 OrgSwitcher
    ↓
选择新组织
    ↓
switchOrganization() 更新 localStorage
    ↓
invalidate() 清除 Refine 缓存
    ↓
window.location.reload() 刷新页面
    ↓
所有后续请求使用新的 organizationId
```

---

## 📊 浏览器验证

### 模拟多组织用户
```javascript
// 在浏览器控制台执行
const auth = JSON.parse(localStorage.getItem('rrent_auth'));
auth.user.organizations = [
  { id: 'orgA', name: 'Organization A', code: 'ORG_A' },
  { id: 'orgB', name: 'Organization B', code: 'ORG_B' }
];
auth.organizationId = 'orgA';
localStorage.setItem('rrent_auth', JSON.stringify(auth));
location.reload();
```

**预期结果**:
- 顶部栏显示 OrgSwitcher
- 当前选中 "Organization A"
- 点击可切换到 "Organization B"
- 刷新后仍保持选择

---

## 🚧 已知限制 & 后续工作

### 当前状态
- ✅ 前端完全实现
- ⏳ 后端尚未提供 `user.organizations` 数组

### 后端需要做
1. 在登录响应中增加 `organizations` 字段
2. 实现权限检查（切换组织后重新验证权限）
3. 测试多用户的多组织场景

### 前端可选优化
1. 无页面刷新切换（需要完整的状态管理）
2. 权限变更检查和 UI 更新
3. 组织切换的动画 / 加载提示

---

## 🎓 技术亮点

1. **统一的 Helper 函数系统**
   - 集中管理组织信息获取
   - 易于维护和测试

2. **透明的切换机制**
   - 用户感知不到内部实现
   - 所有请求自动使用新组织

3. **充分的测试覆盖**
   - 12 个新增测试用例
   - 覆盖所有 API 调用方式

4. **完美的向后兼容**
   - 单组织用户无任何变化
   - 多组织功能 graceful fallback

---

## 📞 联系与支持

- **完整文档**: `frontend/FE_4_103_ORG_SWITCHER.md`
- **测试位置**: `frontend/test/dataProvider.spec.ts` (FE-4-103 套件)
- **组件位置**: `frontend/src/app/layout/OrgSwitcher.tsx`

---

**创建日期**: 2025-11-18  
**状态**: ✅ COMPLETED  
**测试**: ✅ ALL PASSED
