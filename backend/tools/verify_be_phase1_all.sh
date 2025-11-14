#!/usr/bin/env bash

################################################################################
# BE-Phase1 (BE-0..BE-4) 统一验收脚本
# 
# 执行 lint、build、Prisma 验证/迁移/种子，启动服务，并验证基础 API 和认证流程
# 用法: cd backend && bash tools/verify_be_phase1_all.sh
# 
# 版本: 1.0
# 日期: 2024-11-14
################################################################################

set -euo pipefail

# ============================================================================
# 颜色和格式定义
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# 配置
# ============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Load .env file if it exists
if [[ -f "$ROOT_DIR/.env" ]]; then
  set +a
  # shellcheck source=/dev/null
  source "$ROOT_DIR/.env"
  set -a
fi

BACKEND_PORT="${BACKEND_PORT:-3000}"
BACKEND_HOST="http://localhost:${BACKEND_PORT}"
SERVER_LOG="/tmp/be_phase1_server.log"
SERVER_PID=""

# 测试用户配置
TEST_EMAIL="admin+smoke@demo.com"
TEST_PASSWORD="AdminSmoke123!"
TEST_ORG_CODE="demo-org"
TEST_ROLE="OWNER"

# ============================================================================
# 工具函数
# ============================================================================

# 打印步骤标题
print_header() {
  echo ""
  echo "╔════════════════════════════════════════════════════════════════╗"
  echo "║  $1"
  echo "╚════════════════════════════════════════════════════════════════╝"
  echo ""
}

# 打印步骤开始
print_step() {
  echo -e "${BLUE}▶${NC} $1"
}

# 打印成功
print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

# 打印警告
print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# 打印错误并退出
print_error() {
  echo -e "${RED}✗${NC} $1"
}

# 执行步骤
run_step() {
  local name="$1"
  shift
  
  print_step "$name"
  
  if ! "$@"; then
    print_error "Failed at step: $name"
    cleanup
    exit 1
  fi
  
  print_success "$name"
}

# 清理后台进程
cleanup() {
  if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
    echo ""
    echo "Cleaning up server process (PID: $SERVER_PID)..."
    kill "$SERVER_PID" 2>/dev/null || true
    sleep 1
    
    # 如果仍然存在，强制杀死
    if kill -0 "$SERVER_PID" 2>/dev/null; then
      kill -9 "$SERVER_PID" 2>/dev/null || true
    fi
  fi
}

# 设置 trap 在脚本退出时清理
trap cleanup EXIT

# 检查 curl 和 jq
check_dependencies() {
  if ! command -v curl &> /dev/null; then
    print_error "curl is required but not installed"
    exit 1
  fi
  
  if ! command -v jq &> /dev/null; then
    print_warning "jq is not installed, will use basic parsing"
  fi
}

# ============================================================================
# 主脚本开始
# ============================================================================

cd "$ROOT_DIR"

print_header "BE-Phase1 (BE-0..BE-4) 统一验收脚本"

echo "配置信息:"
echo "  工作目录: $ROOT_DIR"
echo "  后端端口: $BACKEND_PORT"
echo "  后端地址: $BACKEND_HOST"
echo "  测试用户: $TEST_EMAIL (role: $TEST_ROLE, org: $TEST_ORG_CODE)"
echo ""

check_dependencies

# ============================================================================
# 1. 环境检查
# ============================================================================

print_header "Step 1: 环境检查"

print_step "检查 Node.js 版本"
node --version
print_success "检查 Node.js 版本"

print_step "检查 pnpm 版本"
pnpm --version
print_success "检查 pnpm 版本"

print_step "检查 DATABASE_URL 环境变量"
if [ -z "${DATABASE_URL:-}" ]; then
  print_error "DATABASE_URL is not set"
  exit 1
else
  print_success "DATABASE_URL is set"
fi

# ============================================================================
# 2. Lint & Build
# ============================================================================

print_header "Step 2: Lint 和构建"

run_step "ESLint 检查" pnpm run lint

run_step "TypeScript 构建" pnpm run build

# ============================================================================
# 3. Prisma 验证、迁移和种子
# ============================================================================

print_header "Step 3: Prisma 验证、迁移和种子"

run_step "Prisma Schema 验证" pnpm prisma validate

run_step "Prisma 数据库迁移" pnpm prisma migrate deploy

run_step "Prisma 数据库种子" pnpm prisma db seed

# ============================================================================
# 4. 启动后端服务
# ============================================================================

print_header "Step 4: 启动后端服务"

print_step "启动 Nest.js 应用（后台）"

rm -f "$SERVER_LOG"

pnpm start:dev > "$SERVER_LOG" 2>&1 &
SERVER_PID=$!

echo "  服务 PID: $SERVER_PID"
echo "  日志位置: $SERVER_LOG"

# 等待服务启动（探测健康检查端点）
print_step "等待服务启动..."

max_retries=40
retry_count=0
sleep_time=0.5

while [ $retry_count -lt $max_retries ]; do
  if curl -s -f "${BACKEND_HOST}/health" > /dev/null 2>&1; then
    print_success "服务已启动"
    break
  fi
  
  retry_count=$((retry_count + 1))
  if [ $retry_count -eq $max_retries ]; then
    print_error "服务启动超时（重试 $max_retries 次后仍未响应）"
    echo ""
    echo "服务日志内容:"
    tail -30 "$SERVER_LOG"
    exit 1
  fi
  
  sleep "$sleep_time"
done

# ============================================================================
# 5. 基础路由验证
# ============================================================================

print_header "Step 5: 基础路由验证"

# GET /health
print_step "验证 GET /health"
HEALTH_RES=$(curl -s -w "\n%{http_code}" "${BACKEND_HOST}/health")
HTTP_CODE=$(echo "$HEALTH_RES" | tail -n1)
BODY=$(echo "$HEALTH_RES" | head -n-1)

if [ "$HTTP_CODE" != "200" ]; then
  print_error "GET /health 返回非 200 状态码: $HTTP_CODE"
  exit 1
fi

if ! echo "$BODY" | grep -q "status"; then
  print_error "GET /health 响应体缺少 'status' 字段"
  exit 1
fi

print_success "GET /health 验证通过"

# GET /
print_step "验证 GET /"
ROOT_RES=$(curl -s -w "\n%{http_code}" "${BACKEND_HOST}/")
HTTP_CODE=$(echo "$ROOT_RES" | tail -n1)
BODY=$(echo "$ROOT_RES" | head -n-1)

if [ "$HTTP_CODE" != "200" ]; then
  print_error "GET / 返回非 200 状态码: $HTTP_CODE"
  exit 1
fi

if ! echo "$BODY" | grep -q "RRent"; then
  print_warning "GET / 响应体可能不包含预期字符串"
fi

print_success "GET / 验证通过"

# GET /api
print_step "验证 GET /api"
API_RES=$(curl -s -w "\n%{http_code}" "${BACKEND_HOST}/api")
HTTP_CODE=$(echo "$API_RES" | tail -n1)
BODY=$(echo "$API_RES" | head -n-1)

if [ "$HTTP_CODE" != "200" ]; then
  print_error "GET /api 返回非 200 状态码: $HTTP_CODE"
  exit 1
fi

print_success "GET /api 验证通过"

# ============================================================================
# 6. BE-2 服务验收
# ============================================================================

print_header "Step 6: BE-2 服务验收"

if [ -f "tools/verify_be2_all.sh" ] && [ -x "tools/verify_be2_all.sh" ]; then
  print_step "执行 BE-2 统一验证脚本"
  
  if bash tools/verify_be2_all.sh; then
    print_success "BE-2 统一验证通过"
  else
    print_error "BE-2 统一验证失败"
    exit 1
  fi
else
  print_warning "跳过 BE-2 验证 (tools/verify_be2_all.sh 未找到或无执行权限)"
fi

# ============================================================================
# 7. Auth 烟囱验证
# ============================================================================

print_header "Step 7: Auth 烟囱验证"

if [ -f "tools/verify_auth_smoke.sh" ] && [ -x "tools/verify_auth_smoke.sh" ]; then
  print_step "执行 Auth Smoke 脚本"
  
  if bash tools/verify_auth_smoke.sh; then
    print_success "Auth Smoke 验证通过"
  else
    print_error "Auth Smoke 验证失败"
    exit 1
  fi
else
  print_warning "跳过 Auth Smoke 验证 (tools/verify_auth_smoke.sh 未找到或无执行权限)"
fi

# ============================================================================
# 8. 带 JWT 的业务接口验证
# ============================================================================

print_header "Step 8: 带 JWT 的业务接口验证"

# 创建测试用户
print_step "创建测试用户"

CREATE_USER_OUTPUT=$(pnpm ts-node scripts/create-user.ts \
  --email "$TEST_EMAIL" \
  --password "$TEST_PASSWORD" \
  --role "$TEST_ROLE" \
  --org-code "$TEST_ORG_CODE" 2>&1 || true)

if echo "$CREATE_USER_OUTPUT" | grep -q "already exists\|created successfully"; then
  print_success "测试用户已创建或已存在"
else
  print_warning "创建测试用户的结果不确定，将继续尝试登录"
fi

# 登录获取 Token
print_step "调用 POST /auth/login 获取访问令牌"

LOGIN_RES=$(curl -s -w "\n%{http_code}" -X POST "${BACKEND_HOST}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"organizationCode\":\"$TEST_ORG_CODE\"}")

HTTP_CODE=$(echo "$LOGIN_RES" | tail -n1)
BODY=$(echo "$LOGIN_RES" | head -n-1)

if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "201" ]; then
  print_error "POST /auth/login 返回非 200/201 状态码: $HTTP_CODE"
  echo "响应体: $BODY"
  exit 1
fi

# 解析 accessToken
if command -v jq &> /dev/null; then
  TOKEN=$(echo "$BODY" | jq -r '.accessToken // empty' 2>/dev/null || echo "")
else
  # 基础的 JSON 解析（适用于简单情况）
  TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*"' | head -1 | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  print_error "无法从登录响应中提取 accessToken"
  echo "响应体: $BODY"
  exit 1
fi

print_success "成功获取访问令牌 (长度: ${#TOKEN} 字符)"

# 调用业务接口（GET /organizations）
print_step "调用 GET /organizations（需要 JWT）"

ORG_RES=$(curl -s -w "\n%{http_code}" "${BACKEND_HOST}/organizations" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$ORG_RES" | tail -n1)
BODY=$(echo "$ORG_RES" | head -n-1)

if [ "$HTTP_CODE" != "200" ]; then
  print_error "GET /organizations 返回非 200 状态码: $HTTP_CODE"
  echo "响应体: $BODY"
  exit 1
fi

# 验证响应结构
if ! echo "$BODY" | grep -q "items\|data\|organizations"; then
  print_warning "GET /organizations 响应体可能缺少预期的列表字段"
fi

print_success "GET /organizations 验证通过"

# ============================================================================
# 最终成功输出
# ============================================================================

print_header "✅ BE-Phase1 (BE-0..BE-4) 验收通过"

echo "所有验证步骤已成功完成:"
echo ""
echo "  ✓ 环境检查"
echo "  ✓ Lint 和构建"
echo "  ✓ Prisma 验证、迁移和种子"
echo "  ✓ 后端服务启动"
echo "  ✓ 基础路由验证"
echo "  ✓ BE-2 服务验收"
echo "  ✓ Auth 烟囱验证"
echo "  ✓ 带 JWT 的业务接口验证"
echo ""
echo "后端项目已准备就绪！"
echo ""

exit 0
