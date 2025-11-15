#!/bin/bash
# BE-6 业务流程验证脚本

set -e

echo "=================================="
echo "BE-6 业务流程验证"
echo "=================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查环境
echo "1. 检查环境..."
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ 缺少 .env 文件${NC}"
    exit 1
fi

# 检查数据库连接
echo "2. 检查数据库连接..."
pnpm prisma db pull --schema=./prisma/schema.prisma > /dev/null 2>&1 || {
    echo -e "${RED}❌ 数据库连接失败${NC}"
    exit 1
}
echo -e "${GREEN}✓ 数据库连接正常${NC}"

# Lint 检查
echo "3. 运行 Lint 检查..."
if pnpm run lint > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Lint 检查通过${NC}"
else
    echo -e "${RED}❌ Lint 检查失败${NC}"
    exit 1
fi

# 构建检查
echo "4. 运行构建检查..."
if pnpm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 构建成功${NC}"
else
    echo -e "${RED}❌ 构建失败${NC}"
    exit 1
fi

# 运行 E2E 测试
echo "5. 运行 BE-6 业务流程 E2E 测试..."
echo -e "${YELLOW}提示：这可能需要几分钟...${NC}"
echo ""

if pnpm test -- be6-business-flow.e2e-spec.ts; then
    echo ""
    echo -e "${GREEN}✓ E2E 测试全部通过${NC}"
else
    echo ""
    echo -e "${RED}❌ E2E 测试失败${NC}"
    exit 1
fi

echo ""
echo "=================================="
echo -e "${GREEN}✓ BE-6 验证完成！所有测试通过。${NC}"
echo "=================================="
echo ""
echo "测试覆盖范围："
echo "  ✓ 完整业务流程（创建→激活→支付）"
echo "  ✓ 租约激活幂等性"
echo "  ✓ 支付标记幂等性"
echo "  ✓ 并发激活测试"
echo "  ✓ 定时任务逻辑验证"
echo "  ✓ 负例场景验证"
echo "  ✓ 审计日志验证"
echo ""

exit 0
