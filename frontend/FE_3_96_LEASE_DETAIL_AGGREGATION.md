# FE-3-96: Lease 详情聚合（租客、状态、账单列表）

## 任务概述

在现有 Lease 详情页（`/leases/show/:id`）基础上，完成"聚合视图"改造，让运营人员在一个页面就能看到：
1. 当前租约的核心状态信息（状态流、金额、时间）
2. 对应租客的关键信息（姓名、联系方式，跳转入口）
3. 对应该租约的所有支付单（账单列表），并可以快速跳到 Payment 详情

## 改造前状态

### 原有 Lease 详情页行为
- 位置：`src/pages/leases/show.tsx`
- 功能：仅展示租约基本信息（ID、状态、金额、日期等），未聚合关联对象（租客、房源）和支付单
- 数据获取：仅调用 `GET /leases/:id` 获取租约详情

### 存在的问题
- 需要多次导航才能查看租客信息、房源信息和账单记录
- 缺乏业务上下文，不便于运营人员快速了解租约全貌
- 未充分利用后端已有 API，导致用户体验不佳

## 改造方案

### 1. 租约总览区块（Header）

展示租约核心信息，分为左右两列：

**左侧：**
- 租约 ID（可复制）
- 租约状态 Tag（颜色映射：DRAFT/PENDING/ACTIVE/TERMINATED/EXPIRED）
- 账单周期（中文：月付/季付/年付/一次性）

**右侧：**
- 租金金额（格式化为货币，如 ¥3,500.00）
- 押金金额（若无则显示 "-"）
- 起止日期（startDate ~ endDate，格式化为 YYYY-MM-DD）

### 2. 关联对象区块

分为两个子卡片：

**租客信息子卡片：**
- 通过 `tenantId` 调用 `GET /tenants/:id?organizationId=...` 获取租客详情
- 展示：
  - 姓名（主标题）
  - 邮箱
  - 电话
  - 激活状态 Tag（激活/未激活）
- 操作：提供"查看租客详情"按钮，跳转至 `/tenants/show/:id`

**房源信息子卡片：**
- 使用 `unitId` 和 `propertyId` 调用：
  - `GET /units/:id?organizationId=...`
  - `GET /properties/:id?organizationId=...`
- 展示：
  - 物业名称
  - 单元编号
  - 楼层
  - 面积（若无则显示 "-"）
- 操作：提供"查看单元详情"按钮，跳转至 `/units/show/:id`

### 3. 账单列表区块（Payments for this Lease）

- 标题："账单列表（Payments）"
- 数据获取：使用 `dataProvider.getList("payments", { filters: [{ field: "leaseId", operator: "eq", value: leaseId }] })`
- 表格列：
  - **支付单 ID**：可点击跳转 `/payments/show/:id`
  - **类型**：RENT/DEPOSIT/UTILITY → 中文标签（租金/押金/水电费）
  - **金额**：格式化为货币（CNY）
  - **状态**：Tag（PENDING/PAID/OVERDUE/CANCELLED）
  - **到期日**：格式化为 YYYY-MM-DD
  - **支付日期**：格式化为 YYYY-MM-DD
  - **操作列**："查看详情"按钮 → `/payments/show/:id`

## 实际调用的 API

### 主要 API 调用

1. **租约详情**
   ```
   GET /leases/:id?organizationId=7295cff9-ef25-4e15-9619-a47fa9e2b92d
   ```
   关键响应字段：
   ```json
   {
     "id": "73793dbc-5425-4438-9653-d367af35372d",
     "tenantId": "1d540d62-fc46-4abd-967f-751aa0d448e5",
     "unitId": "b02f7d2f-9e4c-45d3-ad48-7da3bd0cf4f2",
     "propertyId": "7c9136b5-0713-4615-97a6-ca80a5cda553",
     "status": "ACTIVE",
     "billCycle": "MONTHLY",
     "rentAmount": "3000",
     "depositAmount": "6000",
     "currency": "CNY",
     "startDate": "2025-01-01T00:00:00.000Z",
     "endDate": "2026-01-01T00:00:00.000Z"
   }
   ```

2. **租客信息**
   ```
   GET /tenants/:id?organizationId=7295cff9-ef25-4e15-9619-a47fa9e2b92d
   ```
   关键响应字段：
   ```json
   {
     "id": "1d540d62-fc46-4abd-967f-751aa0d448e5",
     "fullName": "Demo Tenant",
     "email": "tenant@example.com",
     "phone": "13800000000",
     "isActive": true
   }
   ```

3. **单元信息**
   ```
   GET /units/:id?organizationId=7295cff9-ef25-4e15-9619-a47fa9e2b92d
   ```
   关键响应字段：
   ```json
   {
     "id": "b02f7d2f-9e4c-45d3-ad48-7da3bd0cf4f2",
     "unitNumber": "101",
     "floor": "1",
     "area": null,
     "propertyId": "7c9136b5-0713-4615-97a6-ca80a5cda553"
   }
   ```

4. **物业信息**
   ```
   GET /properties/:id?organizationId=7295cff9-ef25-4e15-9619-a47fa9e2b92d
   ```
   关键响应字段：
   ```json
   {
     "id": "7c9136b5-0713-4615-97a6-ca80a5cda553",
     "name": "Demo Property",
     "address": "123 Demo Street"
   }
   ```

5. **账单列表（带过滤）**
   ```
   GET /payments?organizationId=7295cff9-ef25-4e15-9619-a47fa9e2b92d&page=1&limit=50&leaseId=73793dbc-5425-4438-9653-d367af35372d
   ```
   关键响应字段：
   ```json
   {
     "items": [
       {
         "id": "f36a64f7-63f3-4fd7-b682-f71b6a66a335",
         "leaseId": "73793dbc-5425-4438-9653-d367af35372d",
         "type": "RENT",
         "amount": "3000",
         "status": "PAID",
         "dueDate": "2025-02-01T00:00:00.000Z",
         "paidAt": "2025-11-18T03:28:26.732Z"
       }
     ],
     "meta": { "total": 1, "page": 1, "limit": 50, "pageCount": 1 }
   }
   ```

### 注意事项

- 所有请求头均包含：
  - `Authorization: Bearer <token>`
  - `X-Organization-Id: <organizationId>`
- 金额字段（`rentAmount`, `depositAmount`, `amount`）在后端以字符串形式返回（Prisma Decimal 类型），需在前端转换为 number
- `depositAmount` 可能为 `null`，需特殊处理

## 实现细节

### 文件修改

1. **主要文件：`src/pages/leases/show.tsx`**
   - 重构为包含 3 个区块的聚合视图
   - 使用 `useEffect` + `http` 客户端获取租客、单元、物业信息
   - 使用 `useList` hook 获取支付单列表（带 `leaseId` 过滤器）
   - 处理 Prisma Decimal 字段的类型转换（字符串 → 数字）

2. **次要文件：`src/pages/leases/index.tsx`**
   - 修复租金和押金列渲染中的 `toFixed` 错误
   - 添加 `null` 值检查和类型转换

3. **核心文件：`src/providers/dataProvider.ts`**
   - **新增功能**：在 `getList` 方法中添加 `filters` 参数处理
   - 支持 `eq` 和 `contains` 操作符
   - 将 Refine 过滤器映射为后端 query 参数（如 `leaseId=xxx`）

### 类型定义更新

```typescript
interface ILease {
  // ...
  rentAmount: number | string; // Prisma Decimal 可能返回字符串
  depositAmount?: number | string | null;
  // ...
}

interface IPayment {
  // ...
  amount: number | string; // Prisma Decimal 可能返回字符串
  // ...
}
```

### 过滤器实现（dataProvider.ts）

```typescript
// FE-3-96: 过滤器映射
if (filters && filters.length > 0) {
  filters.forEach((filter) => {
    if ('field' in filter && 'operator' in filter && 'value' in filter) {
      const { field, operator, value } = filter;
      
      if (operator === 'eq' || operator === 'contains') {
        queryParams[field] = value;
      }
    }
  });
}
```

## 验收测试（chrome-devtools-mcp）

### A. 静态检查

1. **Lint 检查**
   ```bash
   cd frontend && pnpm lint
   ```
   ✅ **结果**：无 error / warning

2. **TypeScript 编译**
   ```bash
   pnpm build
   ```
   ✅ **结果**：构建成功，无类型错误

3. **数据提供者测试**
   ```bash
   pnpm test:data-provider
   ```
   ✅ **结果**：42/42 测试全绿，无回归

### B. 运行时验证

#### 测试环境
- 登录用户：`admin@example.com` / `Password123!`
- 组织：`demo-org`
- 测试租约：
  - ID: `73793dbc-5425-4438-9653-d367af35372d`
  - 状态：ACTIVE（生效中）
  - 租金：¥3,000.00
  - 押金：¥6,000.00

#### 验收点 1：租约总览区块

**测试步骤**：访问 `/leases/show/73793dbc-5425-4438-9653-d367af35372d`

**DOM 观察**：
- ✅ 页面顶部展示"租约总览"卡片
- ✅ 租约 ID：`73793dbc-5425-4438-9653-d367af35372d`（可复制）
- ✅ 状态 Tag：`生效中`（绿色）
- ✅ 账单周期：`月付`
- ✅ 租金金额：`¥3,000.00`
- ✅ 押金金额：`¥6,000.00`
- ✅ 起止日期：`2025-01-01 ~ 2026-01-01`

#### 验收点 2：租客信息区块

**DOM 观察**：
- ✅ 展示"租客信息"子卡片
- ✅ 姓名：`Demo Tenant`
- ✅ 邮箱：`tenant@example.com`
- ✅ 电话：`13800000000`
- ✅ 状态 Tag：`激活`（绿色）
- ✅ "查看租客详情"按钮可见

**Network 验证**：
```
GET /tenants/1d540d62-fc46-4abd-967f-751aa0d448e5?organizationId=7295cff9-ef25-4e15-9619-a47fa9e2b92d
Status: 304 (缓存)
Headers: Authorization, X-Organization-Id
```

#### 验收点 3：房源信息区块

**DOM 观察**：
- ✅ 展示"房源信息"子卡片
- ✅ 物业名称：`Demo Property`
- ✅ 单元编号：`101`
- ✅ 楼层：`1`
- ✅ 面积：`-`（未设置）
- ✅ "查看单元详情"按钮可见

**Network 验证**：
```
GET /units/b02f7d2f-9e4c-45d3-ad48-7da3bd0cf4f2?organizationId=7295cff9-ef25-4e15-9619-a47fa9e2b92d
Status: 304 (缓存)

GET /properties/7c9136b5-0713-4615-97a6-ca80a5cda553?organizationId=7295cff9-ef25-4e15-9619-a47fa9e2b92d
Status: 200
```

#### 验收点 4：账单列表区块

**DOM 观察**：
- ✅ 展示"账单列表（Payments）"表格
- ✅ 表头：支付单 ID / 类型 / 金额 / 状态 / 到期日 / 支付日期 / 操作
- ✅ 显示 1 条账单记录：
  - ID: `f36a64f7...`（可点击）
  - 类型：`租金`
  - 金额：`¥3,000.00`
  - 状态：`已支付`（绿色 Tag）
  - 到期日：`2025-02-01`
  - 支付日期：`2025-11-18`
- ✅ "查看详情"按钮可见

**Network 验证**：
```
GET /payments?organizationId=7295cff9-ef25-4e15-9619-a47fa9e2b92d&page=1&limit=50&leaseId=73793dbc-5425-4438-9653-d367af35372d
Status: 200
Response Body: {"items":[...], "meta":{"total":1, ...}}
```
✅ **关键验证**：请求 URL 中包含 `leaseId` 过滤参数

#### 验收点 5：跳转功能

**测试步骤**：点击支付单"查看详情"按钮

**结果**：
- ✅ 成功跳转至 `/payments/show/f36a64f7-63f3-4fd7-b682-f71b6a66a335`
- ✅ Payments 详情页正常渲染

#### 验收点 6：Console 检查

**Console 观察**：
- ✅ 无新增运行时错误
- ✅ 无 `undefined is not an object` 或 `Cannot read property xxx of undefined` 错误
- ✅ 无 `toFixed is not a function` 错误（已修复）
- ⚠️ 允许的噪音：
  - `WebSocket connection to 'ws://localhost:5001/' failed` (Refine DevTools)
  - `Warning: Instance created by useForm is not connected to any Form element`

### C. 边界测试

#### 测试用例：租约无账单记录

**测试步骤**：访问 `/leases/show/c552b8f9-a298-49c9-8b9a-43a4d42da7e6`

**结果**：
- ✅ 租约总览正常展示
- ✅ 租客信息正常展示（张三 / zhangsan@example.com）
- ✅ 房源信息正常展示（Demo Property / UNIT-102）
- ✅ 账单列表显示："该租约暂无账单记录"
- ✅ Network 请求：`GET /payments?...&leaseId=c552b8f9-...` 返回空数组

## 回归影响分析

### 对 FE-2-90..93 的影响

1. **FE-2-90（Leases List）**
   - ✅ **无影响**：列表页功能正常，分页、排序、筛选均正常工作
   - ✅ 修复了租金和押金列的 `toFixed` 错误（副产物）

2. **FE-2-91（Leases CRUD）**
   - ✅ **无影响**：Create/Edit/Delete 功能未改动
   - ✅ Show 页面增强，但不影响原有编辑流程

3. **FE-2-92（Payments List）**
   - ✅ **无影响**：Payment 列表页未修改
   - ✅ Show 页面跳转正常

4. **FE-2-93（Mark-Paid）**
   - ✅ **无影响**：标记已支付功能未改动
   - ℹ️ 租约详情页暂未添加"二次 Mark-Paid"按钮（已记录为 TODO）

### DataProvider 增强

- ✅ 新增 `filters` 支持（`eq` 和 `contains` 操作符）
- ✅ 所有现有测试（42/42）仍然通过
- ✅ 未改变现有 API 契约

## 已知限制与 TODO

### 当前限制

1. **过滤器支持**：仅支持 `eq` 和 `contains` 操作符，其他操作符（`ne`, `gt`, `gte`, `lt`, `lte`, `in`, `nin`, `between`）暂不支持
2. **租约激活**：详情页"激活租约"按钮仍为占位符（标记为 TODO）
3. **二次 Mark-Paid**：租约详情页的账单列表暂未提供"标记已支付"按钮，避免与 Payment 详情页功能重复

### 未来扩展

1. **批量操作**：支持在租约详情页直接批量标记账单已支付
2. **账单统计**：展示该租约的账单汇总（已支付/待支付/逾期金额）
3. **租约时间线**：展示租约生命周期事件（创建/激活/支付/终止）
4. **高级过滤**：支持日期范围、多值筛选等复杂过滤条件

## 总结

### 完成的工作

1. ✅ 重构 Lease Show 页面为 3 区块聚合视图
2. ✅ 实现租客、单元、物业信息的关联展示
3. ✅ 实现账单列表的过滤查询（基于 `leaseId`）
4. ✅ 增强 DataProvider 以支持过滤器参数
5. ✅ 修复 Prisma Decimal 字段的类型处理问题
6. ✅ 通过静态检查和运行时验证
7. ✅ 确保无回归，所有现有测试通过

### 验收结论

- ✅ 所有验收标准满足
- ✅ 功能完整，用户体验良好
- ✅ 代码质量高，无 lint/类型错误
- ✅ 性能表现正常（4-6 个并行 API 调用，总耗时 < 1s）
- ✅ 文档完整，便于后续维护

---

**任务状态**：✅ 已完成  
**提交日期**：2025-11-18  
**相关文件**：
- `frontend/src/pages/leases/show.tsx`
- `frontend/src/pages/leases/index.tsx`
- `frontend/src/providers/dataProvider.ts`
