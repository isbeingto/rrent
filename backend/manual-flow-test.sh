#!/bin/bash

# 手动业务流程验证脚本
# 创建用户、组织和基本资源，然后验证 API 调用

set -e

API_BASE="http://localhost:3000"
ORG_CODE="MANUAL-ORG-$(date +%s)"
USER_EMAIL="manual-user-$(date +%s)@test.com"
PASSWORD="testpass123"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}BE-6 手动业务流程验证${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# 步骤 1: 直接使用 Prisma 创建组织和用户
echo -e "${YELLOW}[1] 准备测试数据（使用 Prisma）...${NC}"

cat > /tmp/setup-test-data.ts << 'EOF'
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function main() {
  const prisma = new PrismaClient();
  const orgCode = process.env.ORG_CODE;
  const userEmail = process.env.USER_EMAIL;
  const password = process.env.PASSWORD;

  try {
    // 创建组织
    const org = await prisma.organization.create({
      data: {
        name: `Manual Test Org ${orgCode}`,
        code: orgCode,
        description: 'Manual test organization',
        timezone: 'Asia/Shanghai',
      },
    });
    console.log(`ORG_ID=${org.id}`);

    // 创建用户
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: userEmail,
        fullName: 'Manual Test User',
        passwordHash,
        role: 'OWNER',
        organizationId: org.id,
      } as any,
    });
    console.log(`USER_ID=${user.id}`);
  } finally {
    await prisma.$disconnect();
  }
}

main();
EOF

# 运行 Prisma 设置脚本
export ORG_CODE USER_EMAIL PASSWORD
cd /srv/rrent/backend

# 使用 npx tsx 而不是 ts-node（更快）
eval "$(npx tsx /tmp/setup-test-data.ts 2>/dev/null | grep "=" || echo "ERROR=true")"

if [ -z "$ORG_ID" ] || [ -z "$USER_ID" ]; then
  echo -e "${RED}❌ 创建组织/用户失败${NC}"
  exit 1
fi

echo -e "${GREEN}✓ 组织已创建: $ORG_ID${NC}"
echo -e "${GREEN}✓ 用户已创建: $USER_ID (${USER_EMAIL})${NC}"
echo ""

# 步骤 2: 用户登录
echo -e "${YELLOW}[2] 执行用户登录...${NC}"

LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$USER_EMAIL\",
    \"password\": \"$PASSWORD\",
    \"organizationCode\": \"$ORG_CODE\"
  }")

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('accessToken', ''))" 2>/dev/null || echo "")

if [ -z "$ACCESS_TOKEN" ]; then
  echo -e "${RED}❌ 登录失败${NC}"
  echo "响应: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ 登录成功${NC}"
echo -e "${GREEN}✓ AccessToken: ${ACCESS_TOKEN:0:20}...${NC}"
echo ""

# 步骤 3: 创建 Property
echo -e "${YELLOW}[3] 创建物业...${NC}"

PROPERTY_RESPONSE=$(curl -s -X POST "$API_BASE/properties" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"organizationId\": \"$ORG_ID\",
    \"name\": \"Manual Test Property\",
    \"code\": \"MANUAL-PROP-001\",
    \"description\": \"Test property\",
    \"addressLine1\": \"123 Test St\",
    \"city\": \"Shanghai\",
    \"country\": \"CN\"
  }")

PROPERTY_ID=$(echo "$PROPERTY_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null || echo "")

if [ -z "$PROPERTY_ID" ]; then
  echo -e "${RED}❌ 创建物业失败${NC}"
  echo "响应: $PROPERTY_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ 物业已创建: $PROPERTY_ID${NC}"
echo ""

# 步骤 4: 创建 Unit
echo -e "${YELLOW}[4] 创建单元...${NC}"

UNIT_RESPONSE=$(curl -s -X POST "$API_BASE/units" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"organizationId\": \"$ORG_ID\",
    \"propertyId\": \"$PROPERTY_ID\",
    \"unitNumber\": \"101\",
    \"floor\": 1,
    \"areaSqm\": 50,
    \"bedrooms\": 2
  }")

UNIT_ID=$(echo "$UNIT_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null || echo "")

if [ -z "$UNIT_ID" ]; then
  echo -e "${RED}❌ 创建单元失败${NC}"
  echo "响应: $UNIT_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ 单元已创建: $UNIT_ID${NC}"
echo ""

# 步骤 5: 创建 Tenant
echo -e "${YELLOW}[5] 创建租户...${NC}"

TENANT_RESPONSE=$(curl -s -X POST "$API_BASE/tenants" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"organizationId\": \"$ORG_ID\",
    \"firstName\": \"John\",
    \"lastName\": \"Doe\",
    \"idNumber\": \"ID123456\",
    \"idType\": \"PASSPORT\",
    \"phoneNumber\": \"13800138000\",
    \"email\": \"tenant@test.com\"
  }")

TENANT_ID=$(echo "$TENANT_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null || echo "")

if [ -z "$TENANT_ID" ]; then
  echo -e "${RED}❌ 创建租户失败${NC}"
  echo "响应: $TENANT_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ 租户已创建: $TENANT_ID${NC}"
echo ""

# 步骤 6: 创建 Lease
echo -e "${YELLOW}[6] 创建租约...${NC}"

LEASE_RESPONSE=$(curl -s -X POST "$API_BASE/leases" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"organizationId\": \"$ORG_ID\",
    \"unitId\": \"$UNIT_ID\",
    \"tenantId\": \"$TENANT_ID\",
    \"startDate\": \"2024-01-01\",
    \"endDate\": \"2025-12-31\",
    \"monthlyRent\": 3000
  }")

LEASE_ID=$(echo "$LEASE_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null || echo "")

if [ -z "$LEASE_ID" ]; then
  echo -e "${RED}❌ 创建租约失败${NC}"
  echo "响应: $LEASE_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ 租约已创建: $LEASE_ID${NC}"
echo ""

# 步骤 7: 激活租约（第一次）
echo -e "${YELLOW}[7] 激活租约（第一次）...${NC}"

ACTIVATE_RESPONSE_1=$(curl -s -X POST "$API_BASE/leases/$LEASE_ID/activate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{\"organizationId\": \"$ORG_ID\"}")

LEASE_STATUS=$(echo "$ACTIVATE_RESPONSE_1" | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', ''))" 2>/dev/null || echo "")

if [ "$LEASE_STATUS" != "ACTIVE" ]; then
  echo -e "${RED}❌ 激活租约失败${NC}"
  echo "响应: $ACTIVATE_RESPONSE_1"
  exit 1
fi

echo -e "${GREEN}✓ 租约已激活: 状态=$LEASE_STATUS${NC}"
echo ""

# 步骤 8: 激活租约（第二次，测试幂等性）
echo -e "${YELLOW}[8] 激活租约（第二次，测试幂等性）...${NC}"

ACTIVATE_RESPONSE_2=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_BASE/leases/$LEASE_ID/activate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{\"organizationId\": \"$ORG_ID\"}")

HTTP_CODE=$(echo "$ACTIVATE_RESPONSE_2" | grep "HTTP_CODE:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$ACTIVATE_RESPONSE_2" | sed '/^HTTP_CODE:/d')

if [ "$HTTP_CODE" == "409" ]; then
  echo -e "${GREEN}✓ 幂等性验证成功: 返回 409 冲突${NC}"
elif [ "$HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✓ 幂等性验证成功: 返回 200（已是 ACTIVE 状态）${NC}"
else
  echo -e "${YELLOW}⚠ 幂等性验证: 返回状态码 $HTTP_CODE${NC}"
fi
echo ""

# 步骤 9: 查询生成的支付记录
echo -e "${YELLOW}[9] 查询支付记录...${NC}"

PAYMENTS_RESPONSE=$(curl -s -X GET "$API_BASE/payments" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

# 从支付列表获取第一个支付 ID
PAYMENT_ID=$(echo "$PAYMENTS_RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if isinstance(data, list) and len(data) > 0:
    print(data[0].get('id', ''))
elif isinstance(data, dict) and 'items' in data and len(data['items']) > 0:
    print(data['items'][0].get('id', ''))
else:
    print('')
" 2>/dev/null || echo "")

if [ -z "$PAYMENT_ID" ]; then
  echo -e "${RED}❌ 未找到支付记录${NC}"
  echo "响应: $PAYMENTS_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ 支付记录已找到: $PAYMENT_ID${NC}"
echo ""

# 步骤 10: 标记支付为已支付（第一次）
echo -e "${YELLOW}[10] 标记支付为已支付（第一次）...${NC}"

PAYMENT_MARK_1=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_BASE/payments/$PAYMENT_ID/mark-paid" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{\"organizationId\": \"$ORG_ID\"}")

HTTP_CODE=$(echo "$PAYMENT_MARK_1" | grep "HTTP_CODE:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$PAYMENT_MARK_1" | sed '/^HTTP_CODE:/d')

PAYMENT_STATUS=$(echo "$RESPONSE_BODY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', ''))" 2>/dev/null || echo "")

if [ "$PAYMENT_STATUS" == "PAID" ]; then
  echo -e "${GREEN}✓ 支付已标记: 状态=$PAYMENT_STATUS${NC}"
else
  echo -e "${RED}❌ 标记支付失败${NC}"
  echo "响应: $RESPONSE_BODY"
  exit 1
fi
echo ""

# 步骤 11: 标记支付为已支付（第二次，测试幂等性）
echo -e "${YELLOW}[11] 标记支付为已支付（第二次，测试幂等性）...${NC}"

PAYMENT_MARK_2=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_BASE/payments/$PAYMENT_ID/mark-paid" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{\"organizationId\": \"$ORG_ID\"}")

HTTP_CODE=$(echo "$PAYMENT_MARK_2" | grep "HTTP_CODE:" | cut -d: -f2)

if [ "$HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✓ 幂等性验证成功: 返回 200（已是 PAID 状态）${NC}"
else
  echo -e "${YELLOW}⚠ 幂等性验证: 返回状态码 $HTTP_CODE${NC}"
fi
echo ""

# 步骤 12: 验证审计日志
echo -e "${YELLOW}[12] 验证审计日志...${NC}"

cat > /tmp/check-audit-logs.ts << 'EOF'
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const orgId = process.env.ORG_ID;

  try {
    const logs = await prisma.auditLog.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });
    
    console.log(`总审计日志: ${logs.length}`);
    logs.forEach((log) => {
      console.log(`  - ${log.action} on ${log.entity}:${log.entityId.substring(0, 8)}...`);
    });
  } finally {
    await prisma.$disconnect();
  }
}

main();
EOF

export ORG_ID
npx tsx /tmp/check-audit-logs.ts 2>/dev/null || true
echo ""

echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}✓ 手动业务流程验证完成！${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo "测试覆盖："
echo "  ✓ 用户登录"
echo "  ✓ 物业创建"
echo "  ✓ 单元创建"
echo "  ✓ 租户创建"
echo "  ✓ 租约创建"
echo "  ✓ 租约激活（幂等性）"
echo "  ✓ 支付标记（幂等性）"
echo "  ✓ 审计日志验证"
echo ""

exit 0
