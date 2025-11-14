# TASK 41-42 快速开始指南

## 📋 总览

✅ **TASK 41**: 6 个控制器的角色基访问控制 (RBAC) 已完成
✅ **TASK 42**: 用户创建 CLI 脚本已完成

## 🚀 快速使用

### 1. 创建用户

```bash
# 最简单的方式 - 自动生成密码
npx ts-node scripts/create-user.ts \
  --email user@company.com \
  --role OPERATOR \
  --org-code ORG001

# 完整方式 - 指定所有参数
npx ts-node scripts/create-user.ts \
  --email admin@company.com \
  --role OWNER \
  --org-code ORG001 \
  --password MySecurePassword123! \
  --full-name "Admin User"
```

### 2. 角色选择

| 角色 | 使用场景 |
|------|--------|
| `OWNER` | 公司创始人/最高管理者 |
| `PROPERTY_MGR` | 物业管理经理 |
| `OPERATOR` | 日常运营人员 |
| `STAFF` | 前台/查看员工 |

### 3. 登录和获取 Token

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@company.com",
    "password": "password_from_above",
    "organizationCode": "ORG001"
  }'
```

响应:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}
```

### 4. 使用 Token 访问受保护的端点

```bash
# 使用 Bearer token 访问 API
curl -H "Authorization: Bearer eyJhbGc..." \
  http://localhost:3000/api/properties

# 示例: 创建物业 (需要 OPERATOR+ 权限)
curl -X POST http://localhost:3000/api/properties \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Downtown Office",
    "code": "PROP001",
    "type": "OFFICE",
    "city": "Shanghai",
    "organizationId": "org-uuid"
  }'

# 示例: 删除物业 (需要 ADMIN 权限)
curl -X DELETE http://localhost:3000/api/properties/prop-uuid \
  -H "Authorization: Bearer <token>"
```

## 📊 权限矩阵速查表

### Organization (组织管理)
```
           GET  POST  PUT  DELETE
OWNER      ✓    ✓    ✓    ✓
PROPERTY_  ✓    ✗    ✗    ✗
OPERATOR   ✗    ✗    ✗    ✗
STAFF      ✗    ✗    ✗    ✗
```

### Property, Unit, Tenant, Lease, Payment
```
           GET  POST  PUT  DELETE
OWNER      ✓    ✓    ✓    ✓
PROPERTY_  ✓    ✓    ✓    ✓
OPERATOR   ✓    ✓    ✓    ✗
STAFF      ✓    ✗    ✗    ✗
```

## 🔧 前端集成示例

### React + Axios

```typescript
import axios from 'axios';

// 创建 API 实例
const api = axios.create({
  baseURL: 'http://localhost:3000/api'
});

// 请求拦截器 - 自动添加 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 处理 401/403 错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token 过期或无效 - 重新登录
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // 权限不足
      alert('您没有权限执行此操作');
    }
    return Promise.reject(error);
  }
);

// 使用
const properties = await api.get('/properties');
const newProperty = await api.post('/properties', {
  name: 'My Property',
  code: 'PROP001',
  // ...
});
```

### Vue 3 + fetch

```typescript
// composables/useApi.ts
import { ref } from 'vue';

export function useApi() {
  async function request(method, url, data = null) {
    const token = localStorage.getItem('access_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };

    const response = await fetch(`/api${url}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined
    });

    if (response.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    } else if (response.status === 403) {
      throw new Error('权限不足');
    }

    return response.json();
  }

  return {
    get: (url) => request('GET', url),
    post: (url, data) => request('POST', url, data),
    put: (url, data) => request('PUT', url, data),
    delete: (url) => request('DELETE', url)
  };
}
```

## 🧪 测试权限

### 测试 STAFF 用户被拒绝创建

```bash
# 1. 使用 STAFF 权限的 token
STAFF_TOKEN="<token from STAFF user>"

# 2. 尝试创建物业 (应该失败)
curl -X POST http://localhost:3000/api/properties \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "code": "TEST001", ...}'

# 预期结果: 403 Forbidden
# {
#   "statusCode": 403,
#   "message": "Insufficient permissions",
#   "error": "Forbidden"
# }
```

### 测试角色升级效果

```bash
# 1. 使用 OPERATOR token 成功创建
OPERATOR_TOKEN="<token from OPERATOR user>"

curl -X POST http://localhost:3000/api/properties \
  -H "Authorization: Bearer $OPERATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "code": "TEST001", ...}'

# 预期结果: 201 Created

# 2. 使用同一 token 尝试删除 (应该失败)
curl -X DELETE http://localhost:3000/api/properties/prop-id \
  -H "Authorization: Bearer $OPERATOR_TOKEN"

# 预期结果: 403 Forbidden

# 3. 升级用户为 PROPERTY_MGR，再次删除
# 使用 ADMIN token 更新用户角色...
# 然后使用新 token 再次删除

curl -X DELETE http://localhost:3000/api/properties/prop-id \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 预期结果: 204 No Content
```

## ⚙️ 环境配置

### .env 文件

```bash
# JWT 配置
JWT_SECRET=your-super-secret-key-min-32-chars-long!!!
JWT_EXPIRES_IN=3600  # 1小时，单位：秒

# 密码配置
BCRYPT_ROUNDS=10

# 数据库配置
DATABASE_URL="postgresql://user:password@localhost:5432/rrent"
```

### 密钥生成

```bash
# 生成安全的 JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 输出类似:
# a7f3e2c8b1d4a6f9c2e5b8d1f4a7c0e3d6a9f2c5b8e1d4a7f0c3e6a9b2c5f8
```

## 📱 移动应用集成

### React Native + Axios

```typescript
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
  baseURL: 'https://api.example.com'
});

// 请求拦截器
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 登录
export async function login(email, password, organizationCode) {
  const response = await api.post('/auth/login', {
    email,
    password,
    organizationCode
  });
  
  // 安全存储 token
  await SecureStore.setItemAsync('access_token', response.data.access_token);
  return response.data;
}

// 获取物业列表
export async function getProperties() {
  return api.get('/properties');
}
```

## 🐛 常见问题

### Q: 创建用户时说"邮箱已被使用"
A: 该邮箱已存在于数据库中。使用不同的邮箱或删除旧用户。

### Q: Token 过期了怎么办？
A: 重新调用 `/auth/login` 获取新 token。生产环境建议实现 refresh token。

### Q: 怎么修改用户密码？
A: 目前脚本不支持。需要实现 `/auth/change-password` 端点。

### Q: 怎么修改用户角色？
A: 使用 UserService 更新 user.role 字段（需要实现管理端点）。

### Q: 不同组织的用户能否跨组织访问？
A: 不能。Prisma 中间件自动隔离 organizationId，跨组织查询返回 404。

## 📚 完整文档

- **详细指南**: `IMPLEMENTATION_GUIDE_TASK_41_42.md`
- **执行总结**: `TASK_41_42_EXECUTION_SUMMARY.md`
- **快速参考**: `TASK_41_42_SUMMARY.md`

## 🔒 安全提示

⚠️ **生产部署必须**:
1. 使用强 JWT_SECRET (32+ 随机字符)
2. 启用 HTTPS (不要使用 HTTP)
3. 设置合理的 CORS 允许列表
4. 启用速率限制防止暴力破解
5. 定期更新依赖包
6. 监控异常的登录尝试

## 📞 需要帮助？

1. 查看实现指南中的故障排查部分
2. 检查后端日志输出
3. 验证 JWT_SECRET 配置是否正确
4. 确保数据库连接正常

---

**最后更新**: 2024-01-15
**版本**: 1.0
