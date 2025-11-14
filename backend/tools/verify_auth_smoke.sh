#!/bin/bash

#############################################################################
# Auth Smoke E2E 验证脚本
# 在已启动的后端服务上运行完整的认证链路验证
# 
# 用法: bash backend/tools/verify_auth_smoke.sh [--port 3000]
#############################################################################

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
BACKEND_PORT=${1:-3000}
BACKEND_HOST="http://localhost:${BACKEND_PORT}"
TEST_EMAIL="auth-smoke@example.com"
TEST_PASSWORD="AuthSmoke123!"
TEST_ORG_CODE="demo-org"
TEST_ROLE="OWNER"

echo "================================================"
echo "  Auth Smoke E2E 验证脚本"
echo "================================================"
echo ""

# 1. 检查后端是否运行
echo -n "检查后端服务 (${BACKEND_HOST})... "
if ! curl -s -f "${BACKEND_HOST}/health" > /dev/null 2>&1; then
  echo -e "${RED}❌ 后端服务未运行${NC}"
  echo "请先启动后端: pnpm start:dev"
  exit 1
fi
echo -e "${GREEN}✓${NC}"

# 2. 创建/更新测试用户
echo -n "创建测试用户... "

# 检查是否在 backend 目录，如果不在则 cd 到 backend
if [ ! -f "package.json" ]; then
  cd backend || {
    echo -e "${RED}❌ 无法找到 backend 目录${NC}"
    exit 1
  }
fi

# 运行创建用户脚本（使用幂等模式，忽略已存在错误）
if ! pnpm ts-node scripts/create-user.ts \
  --email "${TEST_EMAIL}" \
  --password "${TEST_PASSWORD}" \
  --role "${TEST_ROLE}" \
  --org-code "${TEST_ORG_CODE}" \
  > /dev/null 2>&1; then
  # 如果脚本失败，可能是用户已存在
  # 继续进行，因为这对 smoke 测试无关紧要
  echo -e "${YELLOW}⚠${NC} (用户可能已存在)"
else
  echo -e "${GREEN}✓${NC}"
fi

# 3. 调用登录接口
echo -n "调用 POST /auth/login... "

LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BACKEND_HOST}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL}\",
    \"password\": \"${TEST_PASSWORD}\",
    \"organizationCode\": \"${TEST_ORG_CODE}\"
  }")

# 分离响应体和状态码
HTTP_CODE=$(echo "${LOGIN_RESPONSE}" | tail -n1)
RESPONSE_BODY=$(echo "${LOGIN_RESPONSE}" | sed '$d')

if [ "${HTTP_CODE}" != "200" ] && [ "${HTTP_CODE}" != "201" ]; then
  echo -e "${RED}❌ 登录失败 (HTTP ${HTTP_CODE})${NC}"
  echo "响应: ${RESPONSE_BODY}"
  exit 1
fi

echo -e "${GREEN}✓${NC}"

# 4. 提取 accessToken
echo -n "提取访问令牌... "

if ! command -v jq &> /dev/null; then
  # 如果没有 jq，使用简单的 grep/sed
  TOKEN=$(echo "${RESPONSE_BODY}" | grep -o '"accessToken":"[^"]*"' | sed 's/"accessToken":"\(.*\)"/\1/')
else
  TOKEN=$(echo "${RESPONSE_BODY}" | jq -r '.accessToken // empty')
fi

if [ -z "${TOKEN}" ]; then
  echo -e "${RED}❌ 无法提取 accessToken${NC}"
  echo "登录响应: ${RESPONSE_BODY}"
  exit 1
fi

echo -e "${GREEN}✓${NC}"

# 5. 调用 /auth/me
echo -n "调用 GET /auth/me... "

ME_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer ${TOKEN}" \
  "${BACKEND_HOST}/auth/me")

# 分离响应体和状态码
HTTP_CODE=$(echo "${ME_RESPONSE}" | tail -n1)
RESPONSE_BODY=$(echo "${ME_RESPONSE}" | sed '$d')

if [ "${HTTP_CODE}" != "200" ]; then
  echo -e "${RED}❌ 获取当前用户信息失败 (HTTP ${HTTP_CODE})${NC}"
  echo "响应: ${RESPONSE_BODY}"
  exit 1
fi

echo -e "${GREEN}✓${NC}"

# 6. 验证响应内容
echo -n "验证响应数据... "

if ! command -v jq &> /dev/null; then
  # 使用 grep 进行基础验证
  EMAIL=$(echo "${RESPONSE_BODY}" | grep -o '"email":"[^"]*"' | sed 's/"email":"\(.*\)"/\1/')
  ROLE=$(echo "${RESPONSE_BODY}" | grep -o '"role":"[^"]*"' | sed 's/"role":"\(.*\)"/\1/')
else
  EMAIL=$(echo "${RESPONSE_BODY}" | jq -r '.email // empty')
  ROLE=$(echo "${RESPONSE_BODY}" | jq -r '.role // empty')
fi

if [ "${EMAIL}" != "${TEST_EMAIL}" ]; then
  echo -e "${RED}❌ 邮箱不匹配${NC}"
  echo "预期: ${TEST_EMAIL}, 实际: ${EMAIL}"
  exit 1
fi

if [ "${ROLE}" != "${TEST_ROLE}" ]; then
  echo -e "${RED}❌ 角色不匹配${NC}"
  echo "预期: ${TEST_ROLE}, 实际: ${ROLE}"
  exit 1
fi

echo -e "${GREEN}✓${NC}"

# 7. 验证没有 passwordHash 字段
echo -n "验证密码不泄露... "

if echo "${RESPONSE_BODY}" | grep -q "passwordHash"; then
  echo -e "${RED}❌ 响应中不应该包含 passwordHash${NC}"
  exit 1
fi

echo -e "${GREEN}✓${NC}"

echo ""
echo "================================================"
echo -e "${GREEN}✅ Auth smoke test passed (login + /auth/me)${NC}"
echo "================================================"
exit 0
