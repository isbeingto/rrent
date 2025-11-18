# FE-2-91: Leases Create/Edit/Show（租约 CRUD + API 契约核对）

**任务ID**: FE-2-91  
**标题**: Leases Create/Edit/Show（租约创建 / 编辑 / 查看）  
**依赖**: FE-1-77..82, FE-2-83..90, BE-3-34, BE-6-51  
**状态**: ✅ 已完成

---

## 📋 Summary

实现了完整的 Leases CRUD 页面（创建、编辑、查看），并核对了 API 契约：
- ✅ `/leases/create`：新建租约表单，关联租客与单元
- ✅ `/leases/edit/:id`：编辑租约信息（租金、日期、备注等）
- ✅ `/leases/show/:id`：展示租约完整详情
- ✅ 修正 `dataProvider` 以正确处理 Leases Create 的 `organizationId`（body）
- ✅ 补充单元测试覆盖 Leases CRUD 契约（5 个测试）
- ✅ 对比 Tenants/Units/Leases 三者的 API 契约差异

---

## 🔧 Implementation Details

### 1. Create 页面 (`/frontend/src/pages/leases/create.tsx`)

#### 表单字段
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `tenantId` | Select | ✅ | 选择现有租客（下拉从 `/tenants` 加载） |
| `unitId` | Select | ✅ | 选择单元（下拉从 `/units` 加载） |
| `propertyId` | Select | ✅ | 选择物业（下拉从 `/properties` 加载） |
| `startDate` | DatePicker | ✅ | 租约开始日期 |
| `endDate` | DatePicker | ❌ | 租约结束日期（可为空） |
| `rentAmount` | InputNumber | ✅ | 月租金金额（小数点2位） |
| `depositAmount` | InputNumber | ❌ | 押金金额（可为空） |
| `billCycle` | Select | ✅ | 计费周期（ONE_TIME/MONTHLY/QUARTERLY/YEARLY） |
| `status` | Select | ✅ | 初始状态（默认 PENDING） |
| `notes` | TextArea | ❌ | 备注信息 |

#### 关键特性
- 使用 `useSelect` 动态加载租客/单元/物业列表
- 租客下拉显示 `fullName`，单元显示 `unitNumber`，物业显示 `name`
- 日期选择器支持 `YYYY-MM-DD` 格式
- 金额输入支持小数点后 2 位
- 权限控制：仅 OWNER/ADMIN 可访问

#### API 调用
```typescript
POST /leases
Headers:
  - Authorization: Bearer <JWT>
  - X-Organization-Id: <uuid>
Body:
{
  "organizationId": "<uuid>",  // ✅ 在 body 中
  "tenantId": "<uuid>",
  "unitId": "<uuid>",
  "propertyId": "<uuid>",
  "startDate": "2025-01-01",
  "endDate": "2026-01-01",
  "rentAmount": 3000,
  "depositAmount": 6000,
  "billCycle": "MONTHLY",
  "status": "PENDING",
  "notes": "..."
}
```

---

### 2. Edit 页面 (`/frontend/src/pages/leases/edit.tsx`)

#### 可编辑字段
根据后端业务逻辑，以下字段可编辑：
- ✅ `status` - 状态（DRAFT/PENDING/ACTIVE/TERMINATED/EXPIRED）
- ✅ `billCycle` - 计费周期
- ✅ `endDate` - 结束日期（可延长租约）
- ✅ `rentAmount` - 租金金额（调整租金）
- ✅ `depositAmount` - 押金金额
- ✅ `notes` - 备注

#### 不可编辑字段（禁用状态）
根据 `backend/src/modules/lease/dto/update-lease.dto.ts`，以下字段**不允许**修改：
- ❌ `tenantId` - 租客（关键关联，不允许改）
- ❌ `unitId` - 单元（关键关联，不允许改）
- ❌ `propertyId` - 物业（关键关联，不允许改）
- ❌ `startDate` - 开始日期（历史记录，不允许改）

#### API 调用
```typescript
PUT /leases/:id?organizationId=<uuid>
Headers:
  - Authorization: Bearer <JWT>
  - X-Organization-Id: <uuid>
Body:
{
  "status": "ACTIVE",
  "billCycle": "MONTHLY",
  "endDate": "2026-12-31",
  "rentAmount": 3500,
  "depositAmount": 7000,
  "notes": "租金已调整"
}
```

---

### 3. Show 页面 (`/frontend/src/pages/leases/show.tsx`)

#### 展示字段分组

**基本信息**
- 租约ID（前8位）
- 状态（彩色 Tag）
- 创建时间 / 更新时间

**关联信息**
- 租客ID（前8位，未来可扩展为完整租客信息）
- 单元ID（前8位）
- 物业ID（前8位）

**财务信息**
- 租金金额（`CNY 3000.00`）
- 押金金额（可为空）
- 计费周期（中文显示：月付/季付等）
- 币种（默认 CNY）

**日期信息**
- 开始日期
- 结束日期（可为空）

**其他**
- 备注（可为空）

#### 操作按钮
- ✅ **编辑** - 跳转到 `/leases/edit/:id`（权限：OWNER/ADMIN）
- ✅ **删除** - 删除租约（权限：OWNER/ADMIN）
- 🔜 **激活租约** - TODO：对接 BE-6-51 激活流程（`POST /leases/:id/activate`）
- 🔜 **标记结束** - TODO：业务流程待后续 EPIC 实现

#### API 调用
```typescript
GET /leases/:id?organizationId=<uuid>
Headers:
  - Authorization: Bearer <JWT>
  - X-Organization-Id: <uuid>
Response:
{
  "id": "<uuid>",
  "organizationId": "<uuid>",
  "tenantId": "<uuid>",
  "unitId": "<uuid>",
  "propertyId": "<uuid>",
  "status": "ACTIVE",
  "billCycle": "MONTHLY",
  "startDate": "2025-01-01T00:00:00.000Z",
  "endDate": "2026-01-01T00:00:00.000Z",
  "rentAmount": "3000.00",
  "depositAmount": "6000.00",
  "currency": "CNY",
  "notes": "...",
  "createdAt": "2025-11-18T...",
  "updatedAt": "2025-11-18T..."
}
```

---

## 🔍 API Contract Verification & DataProvider 修正

### 发现的问题
在实现过程中，发现 Leases 的 Create 操作需要 `organizationId` 在 **body** 中（与 Tenants/Properties 一致），但原 `dataProvider` 只处理了 Tenants/Properties，Leases 被归为"其他资源"，导致 `organizationId` 未注入。

### 修正方案
**修改文件**: `/frontend/src/providers/dataProvider.ts`

```typescript
async function create<TData extends BaseRecord = BaseRecord, TVariables = any>(
  params: CreateParams<TVariables>
): Promise<CreateResponse<TData>> {
  try {
    const { resource, variables } = params;
    let url = buildResourcePath(resource);
    
    const auth = loadAuth();
    
    if (auth?.organizationId && resource !== 'organizations') {
      // FE-2-91: Leases 同样需要 organizationId 在 body 中
      if (resource === 'tenants' || resource === 'properties' || resource === 'leases') {
        // Tenants/Properties/Leases: organizationId 注入到 body 中
        (variables as Record<string, unknown>).organizationId = auth.organizationId;
      } else if (resource === 'units') {
        // Units: organizationId 作为 query 参数
        url += `?organizationId=${auth.organizationId}`;
      }
      // 其他资源根据需要扩展
    }
    
    const response = await httpClient.post<TData>(url, variables);
    return { data: response.data };
  } catch (error) {
    throw handleError(error);
  }
}
```

### 新增测试
**修改文件**: `/frontend/test/dataProvider.spec.ts`

新增 5 个 Leases CRUD 契约测试：
1. ✅ `GET /leases - should include organizationId in query params`
2. ✅ `GET /leases/:id - should include organizationId in query params`
3. ✅ `POST /leases - should include organizationId in body, NOT in query`
4. ✅ `PUT /leases/:id - should include organizationId in query params`
5. ✅ `DELETE /leases/:id - should include organizationId in query params`

**测试结果**: ✅ 42/42 通过

```bash
$ pnpm run test:data-provider
# PASS test/dataProvider.spec.ts (7.286 s)
# Test Suites: 1 passed, 1 total
# Tests:       42 passed, 42 total
```

---

## 📊 API 契约差异对比表

| 操作 | Tenants | Units | Properties | Leases |
|------|---------|-------|------------|--------|
| **getList (GET /)** | Query | Query | Query | Query |
| **getOne (GET /:id)** | Query | Query | Query | Query |
| **create (POST /)** | **Body** | Query | **Body** | **Body** |
| **update (PUT /:id)** | Query | Query | Query | Query |
| **deleteOne (DELETE /:id)** | Query | Query | Query | Query |

### 关键结论
1. **getList/getOne**: 所有资源（除 `organizations`）都需要 `organizationId` 在 **query** 中
2. **create**: 分为两类：
   - **Body 派**：Tenants, Properties, **Leases**
   - **Query 派**：Units
3. **update/delete**: 所有资源统一在 **query** 中

### 为什么有差异？
根据后端 DTO 定义：
- **Tenants/Properties/Leases**: `CreateXxxDto` 继承自基类，包含 `organizationId` 字段 → Body
- **Units**: Controller 使用 `@Query('organizationId')` 显式声明 → Query

---

## 🧪 Testing & Verification

### 自动化测试
1. ✅ **Data Provider 单元测试** - 42 个测试全部通过（新增 5 个 Leases 契约测试）
2. ✅ **TypeScript 编译** - `pnpm run build` 无错误
3. ✅ **Lint 检查** - `pnpm lint` 无警告

### 手动验证清单
1. ✅ 登录 `admin@example.com` / `Password123!`
2. ✅ 从 `/leases` 点击"新建租约"：
   - ✅ 表单打开，所有下拉正常加载（租客/单元/物业）
   - ✅ 填写必填字段后提交
   - ✅ 新租约出现在列表中
3. ✅ 从列表点击"编辑"：
   - ✅ 表单加载现有数据
   - ✅ 租客/单元/物业字段为禁用状态（不可修改）
   - ✅ 修改租金或备注后提交
   - ✅ 列表/详情页数据更新
4. ✅ 从列表点击"查看"：
   - ✅ 详情页字段完整显示
   - ✅ 状态 Tag 颜色正确
   - ✅ 金额格式化为 `CNY 3000.00`
5. ✅ DevTools Network 检查：
   - ✅ Create: `POST /leases`，Body 包含 `organizationId`
   - ✅ Update: `PUT /leases/:id?organizationId=...`
   - ✅ GetOne: `GET /leases/:id?organizationId=...`
   - ✅ 所有请求包含 `Authorization` 和 `X-Organization-Id` 头
6. ✅ Console 无新的错误（Refine DevTools WebSocket 报错可忽略）

---

## 🚀 Next Steps & Known Limitations

### 未来扩展（TODO）
1. **激活租约流程**（BE-6-51）
   - 前端添加"激活租约"按钮（Show 页面）
   - 调用 `POST /leases/:id/activate`
   - 处理激活后的状态更新（PENDING → ACTIVE）
   - 显示生成的 Payment 记录

2. **租约终止流程**
   - 添加"标记结束"按钮
   - 更新租约状态为 TERMINATED
   - 更新关联 Unit 的状态（OCCUPIED → VACANT）

3. **关联数据完整展示**
   - 当前只显示 ID（前8位）
   - 未来可扩展：
     - Show 页面展示完整租客信息（姓名、电话）
     - 展示完整单元信息（单元号、房型）
     - 前端调用多个 `getOne()` 或后端扩展 API 支持 `include` 参数

4. **批量操作**
   - 批量删除租约
   - 批量导出租约（Excel/CSV）

5. **筛选增强**
   - List 页面的筛选条件目前只有 UI，需实现 `filters` 映射
   - 支持按租客姓名、单元号筛选（而非只有 ID）

### 已知限制
1. ✅ **关联数据未展示** - 只显示 ID，不展示租客姓名/单元号（需后端支持或前端多次调用）
2. ✅ **筛选未实现** - List 页面筛选表单为占位，未映射到 API 参数
3. ✅ **激活流程缺失** - "激活租约"按钮为占位，未对接 BE-6-51
4. ✅ **日期验证** - 未在前端强制校验 `endDate > startDate`（依赖后端验证）

---

## 📚 Related Files

### 新增文件
- `/frontend/src/pages/leases/create.tsx` - 租约创建页面
- `/frontend/src/pages/leases/edit.tsx` - 租约编辑页面
- `/frontend/src/pages/leases/show.tsx` - 租约详情页面

### 修改文件
- `/frontend/src/app/AppRoutes.tsx` - 添加 create/edit/show 路由
- `/frontend/src/providers/dataProvider.ts` - 修正 Leases create 的 organizationId 处理
- `/frontend/test/dataProvider.spec.ts` - 新增 5 个 Leases CRUD 契约测试

### 依赖文件
- `/frontend/src/pages/leases/index.tsx` - 列表页（FE-2-90）
- `backend/src/modules/lease/lease.controller.ts` - 后端控制器
- `backend/src/modules/lease/dto/create-lease.dto.ts` - 创建 DTO
- `backend/src/modules/lease/dto/update-lease.dto.ts` - 更新 DTO
- `backend/prisma/schema.prisma` - Lease 模型定义

---

## ✅ Acceptance Checklist

- [x] `pnpm lint` 通过
- [x] `pnpm build` 通过
- [x] `pnpm run test:data-provider` 通过（42/42）
- [x] Create 页面：
  - [x] 表单字段完整（10 个字段）
  - [x] 租客/单元/物业下拉正常加载
  - [x] 提交后新租约出现在列表中
- [x] Edit 页面：
  - [x] 加载现有数据
  - [x] 租客/单元/物业字段禁用
  - [x] 修改后提交成功
- [x] Show 页面：
  - [x] 字段完整显示
  - [x] 状态 Tag 颜色正确
  - [x] 编辑/删除按钮可用
- [x] DevTools Network：
  - [x] Create: Body 包含 `organizationId`
  - [x] Update/GetOne: Query 包含 `organizationId`
  - [x] 所有请求包含正确的 Headers
- [x] 已在 `dataProvider.spec.ts` 中新增 5 个 Leases 契约测试
- [x] 已修正 `dataProvider` 实现并让测试通过
- [x] 文档记录了 Tenants/Units/Leases 的 API 契约差异表

---

**完成日期**: 2025-11-18  
**开发者**: GitHub Copilot (Claude Sonnet 4.5)
