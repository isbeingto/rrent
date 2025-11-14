# BE-5 Tasks 48-50 快速参考

## 📚 目录
- [API 使用示例](#api-使用示例)
- [Query 参数说明](#query-参数说明)
- [响应格式](#响应格式)
- [测试命令](#测试命令)

---

## API 使用示例

### 1. 基础分页
```bash
GET /tenants?organizationId=xxx&page=1&pageSize=10
```

### 2. Keyword 搜索

#### Organization
```bash
# 搜索名称或代码
GET /organizations?keyword=Acme&page=1&pageSize=10
```

#### Property
```bash
# 搜索名称、代码或地址
GET /properties?organizationId=xxx&keyword=Main&page=1&pageSize=10
```

#### Unit
```bash
# 搜索单元编号
GET /units?organizationId=xxx&keyword=101&page=1&pageSize=10
```

#### Tenant
```bash
# 搜索姓名、邮箱或电话
GET /tenants?organizationId=xxx&keyword=alice&page=1&pageSize=10
```

### 3. Status 筛选

#### Lease
```bash
# 筛选租约状态
GET /leases?organizationId=xxx&status=ACTIVE&page=1&pageSize=10
# 可用值: ACTIVE, PENDING, EXPIRED, CANCELLED
```

#### Payment
```bash
# 筛选支付状态
GET /payments?organizationId=xxx&status=PAID&page=1&pageSize=10
# 可用值: PENDING, PAID, OVERDUE, CANCELLED
```

#### Unit
```bash
# 筛选单元状态
GET /units?organizationId=xxx&status=AVAILABLE&page=1&pageSize=10
# 可用值: AVAILABLE, OCCUPIED, MAINTENANCE, UNAVAILABLE
```

### 4. 日期范围筛选

#### 基于 createdAt
```bash
# 只指定开始日期
GET /tenants?organizationId=xxx&dateStart=2024-01-01T00:00:00.000Z&page=1&pageSize=10

# 只指定结束日期
GET /tenants?organizationId=xxx&dateEnd=2024-12-31T23:59:59.999Z&page=1&pageSize=10

# 指定日期范围
GET /tenants?organizationId=xxx&dateStart=2024-01-01&dateEnd=2024-12-31&page=1&pageSize=10
```

#### Payment 特殊字段
```bash
# Payment 还支持按 dueDate 筛选
GET /payments?organizationId=xxx&dueDateFrom=2024-01-01&dueDateTo=2024-12-31&page=1&pageSize=10

# 或按 createdAt 筛选
GET /payments?organizationId=xxx&dateStart=2024-01-01&dateEnd=2024-12-31&page=1&pageSize=10
```

### 5. 排序

```bash
# 按创建时间升序
GET /tenants?organizationId=xxx&sort=createdAt&order=asc&page=1&pageSize=10

# 按创建时间降序（默认）
GET /tenants?organizationId=xxx&sort=createdAt&order=desc&page=1&pageSize=10
```

### 6. 组合筛选

```bash
# 关键词 + 日期范围 + 分页
GET /tenants?organizationId=xxx&keyword=alice&dateStart=2024-01-01&dateEnd=2024-12-31&page=1&pageSize=10

# 状态 + 日期范围 + 排序
GET /leases?organizationId=xxx&status=ACTIVE&dateStart=2024-01-01&sort=createdAt&order=asc&page=1&pageSize=10

# 所有参数组合
GET /payments?organizationId=xxx&status=PENDING&dateStart=2024-01-01&dateEnd=2024-12-31&sort=dueDate&order=desc&page=1&pageSize=10
```

---

## Query 参数说明

### 通用参数（所有列表 API）

| 参数       | 类型   | 必填 | 默认值 | 说明                           |
|-----------|--------|------|--------|--------------------------------|
| page      | number | 否   | 1      | 页码（从 1 开始）               |
| pageSize  | number | 否   | 20     | 每页数量（最大 100）            |
| limit     | number | 否   | 20     | pageSize 的别名                 |
| sort      | string | 否   | -      | 排序字段（如 createdAt）        |
| order     | string | 否   | asc    | 排序方向（asc 或 desc）         |

### 筛选参数

| 参数       | 类型   | 适用模块                  | 说明                      |
|-----------|--------|---------------------------|---------------------------|
| keyword   | string | Org, Property, Unit, Tenant | 模糊搜索关键词           |
| status    | enum   | Unit, Lease, Payment       | 状态筛选                 |
| dateStart | string | 所有模块                   | 开始日期（ISO 8601）      |
| dateEnd   | string | 所有模块                   | 结束日期（ISO 8601）      |

### 模块特定参数

#### Organization
```typescript
keyword?: string;        // 搜索 name, code
dateStart?: string;      // 筛选 createdAt >= dateStart
dateEnd?: string;        // 筛选 createdAt <= dateEnd
```

#### Property
```typescript
organizationId!: string; // 必填
propertyId?: string;     // 按 ID 筛选
keyword?: string;        // 搜索 name, code, addressLine1
city?: string;           // 按城市筛选
dateStart?: string;      // 筛选 createdAt >= dateStart
dateEnd?: string;        // 筛选 createdAt <= dateEnd
```

#### Unit
```typescript
organizationId!: string; // 必填
propertyId?: string;     // 按物业筛选
status?: UnitStatus;     // 按状态筛选
keyword?: string;        // 搜索 unitNumber
dateStart?: string;      // 筛选 createdAt >= dateStart
dateEnd?: string;        // 筛选 createdAt <= dateEnd
```

#### Tenant
```typescript
organizationId!: string; // 必填
fullName?: string;       // 按姓名筛选
keyword?: string;        // 搜索 fullName, email, phone
isActive?: boolean;      // 按激活状态筛选
dateStart?: string;      // 筛选 createdAt >= dateStart
dateEnd?: string;        // 筛选 createdAt <= dateEnd
```

#### Lease
```typescript
organizationId!: string; // 必填
propertyId?: string;     // 按物业筛选
unitId?: string;         // 按单元筛选
tenantId?: string;       // 按租户筛选
status?: LeaseStatus;    // 按状态筛选
dateStart?: string;      // 筛选 createdAt >= dateStart
dateEnd?: string;        // 筛选 createdAt <= dateEnd
```

#### Payment
```typescript
organizationId!: string; // 必填
leaseId?: string;        // 按租约筛选
status?: PaymentStatus;  // 按状态筛选
dueDateFrom?: string;    // 筛选 dueDate >= dueDateFrom
dueDateTo?: string;      // 筛选 dueDate <= dueDateTo
dateStart?: string;      // 筛选 createdAt >= dateStart（可选）
dateEnd?: string;        // 筛选 createdAt <= dateEnd（可选）
```

---

## 响应格式

### 成功响应

```json
{
  "items": [
    {
      "id": "tenant-123",
      "fullName": "Alice Smith",
      "email": "alice@example.com",
      "phone": "+1234567890",
      "organizationId": "org-456",
      "createdAt": "2024-01-15T08:30:00.000Z",
      "updatedAt": "2024-01-15T08:30:00.000Z"
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "pageCount": 5
  }
}
```

### 响应头

```
Content-Type: application/json
X-Total-Count: 42
```

### 空结果

```json
{
  "items": [],
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 10,
    "pageCount": 0
  }
}
```

---

## 测试命令

### 运行单元测试
```bash
cd backend
pnpm run test -- filtering.spec.ts
```

### 运行 E2E 测试
```bash
cd backend
pnpm run test:e2e -- list-pagination.e2e-spec.ts
```

### 运行验证脚本
```bash
cd backend
./tools/verify_be5_pagination.sh
```

### 构建项目
```bash
cd backend
pnpm run build
```

### 运行 Linter
```bash
cd backend
pnpm run lint
```

---

## 🔍 调试技巧

### 使用 curl 查看响应头
```bash
curl -I "http://localhost:3000/tenants?organizationId=xxx&page=1&pageSize=10"
```

### 使用 curl 查看完整响应
```bash
curl -v "http://localhost:3000/tenants?organizationId=xxx&keyword=alice&page=1&pageSize=10"
```

### 在浏览器中测试
```javascript
// 在浏览器控制台中
fetch('/tenants?organizationId=xxx&keyword=alice&page=1&pageSize=10')
  .then(res => {
    console.log('Total Count:', res.headers.get('X-Total-Count'));
    return res.json();
  })
  .then(data => console.log(data));
```

---

## 📝 注意事项

1. **日期格式**: 使用 ISO 8601 格式（`YYYY-MM-DDTHH:mm:ss.sssZ`）
2. **大小写**: keyword 搜索不区分大小写
3. **分页限制**: pageSize 最大值为 100
4. **租户隔离**: 所有查询自动按 organizationId 隔离
5. **可选参数**: 所有筛选参数都是可选的
6. **向后兼容**: 不使用新参数时保持原有行为

---

## 🎯 快速示例集合

```bash
# 1. 获取所有租户（默认分页）
GET /tenants?organizationId=xxx

# 2. 搜索名字包含 "alice" 的租户
GET /tenants?organizationId=xxx&keyword=alice

# 3. 获取激活的租约
GET /leases?organizationId=xxx&status=ACTIVE

# 4. 获取最近 30 天创建的支付记录
GET /payments?organizationId=xxx&dateStart=2024-10-15

# 5. 获取待支付的支付记录，按到期日期升序排列
GET /payments?organizationId=xxx&status=PENDING&sort=dueDate&order=asc

# 6. 搜索物业并按创建时间降序
GET /properties?organizationId=xxx&keyword=Main&sort=createdAt&order=desc&page=1&pageSize=5
```

---

## 🚀 前端集成示例

### React 示例
```typescript
const fetchTenants = async (params: {
  organizationId: string;
  keyword?: string;
  dateStart?: string;
  dateEnd?: string;
  page?: number;
  pageSize?: number;
}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  });

  const response = await fetch(`/tenants?${searchParams}`);
  const totalCount = response.headers.get('X-Total-Count');
  const data = await response.json();

  return {
    items: data.items,
    total: parseInt(totalCount || '0', 10),
    meta: data.meta,
  };
};

// 使用
const result = await fetchTenants({
  organizationId: 'org-123',
  keyword: 'alice',
  page: 1,
  pageSize: 10,
});
```

### React Admin 示例
```typescript
import { useList, useGetList } from 'react-admin';

const TenantList = () => {
  const { data, total, isLoading } = useGetList('tenants', {
    pagination: { page: 1, perPage: 10 },
    sort: { field: 'createdAt', order: 'DESC' },
    filter: { 
      organizationId: 'org-123',
      keyword: 'alice',
      dateStart: '2024-01-01',
    },
  });

  // X-Total-Count 会自动被 React Admin 读取
  return (
    <div>
      <p>Total: {total}</p>
      {/* ... */}
    </div>
  );
};
```

---

✅ **准备就绪！所有功能已实现并测试通过。**
