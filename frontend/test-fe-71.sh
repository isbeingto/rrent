#!/bin/bash
set -e

echo "========================================="
echo "FE-0-71 验收测试脚本"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数
PASSED=0
FAILED=0

# 测试函数
test_case() {
    local name="$1"
    local command="$2"
    
    echo -n "测试: $name ... "
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED++))
    fi
}

echo "1️⃣  代码质量检查"
echo "-------------------------------------------"

test_case "TypeScript 编译检查" "pnpm type-check"
test_case "ESLint 检查" "pnpm lint"
test_case "构建测试" "pnpm build"

echo ""
echo "2️⃣  文件存在性检查"
echo "-------------------------------------------"

test_case "导航配置文件存在" "[ -f src/shared/nav.ts ]"
test_case "主布局文件存在" "[ -f src/app/layout/MainLayout.tsx ]"
test_case "侧边栏导航文件存在" "[ -f src/app/layout/SiderNav.tsx ]"
test_case "路由配置文件存在" "[ -f src/app/AppRoutes.tsx ]"
test_case "Dashboard 页面存在" "[ -f src/pages/dashboard/index.tsx ]"
test_case "404 页面存在" "[ -f src/pages/not-found.tsx ]"

echo ""
echo "3️⃣  代码内容检查"
echo "-------------------------------------------"

test_case "导航配置包含 7 个菜单项" "grep -c 'key:' src/shared/nav.ts | grep -q 7"
test_case "MainLayout 使用 Layout 组件" "grep -q 'Layout' src/app/layout/MainLayout.tsx"
test_case "MainLayout 包含 Sider" "grep -q 'Sider' src/app/layout/MainLayout.tsx"
test_case "MainLayout 包含 Header" "grep -q 'Header' src/app/layout/MainLayout.tsx"
test_case "MainLayout 包含 Breadcrumb" "grep -q 'Breadcrumb' src/app/layout/MainLayout.tsx"
test_case "SiderNav 使用 Menu 组件" "grep -q 'Menu' src/app/layout/SiderNav.tsx"
test_case "AppRoutes 配置了路由" "grep -q 'createBrowserRouter\|RouterProvider' src/app/AppRoutes.tsx"
test_case "App.tsx 使用了 AppRoutes" "grep -q 'AppRoutes' src/App.tsx"

echo ""
echo "4️⃣  环境变量支持检查"
echo "-------------------------------------------"

test_case "MainLayout 读取 VITE_APP_NAME" "grep -q 'VITE_APP_NAME' src/app/layout/MainLayout.tsx"
test_case "默认应用名为 rrent" "grep -q \"'rrent'\" src/app/layout/MainLayout.tsx || grep -q '\"rrent\"' src/app/layout/MainLayout.tsx"

echo ""
echo "5️⃣  响应式布局检查"
echo "-------------------------------------------"

test_case "Sider 配置了 breakpoint" "grep -q 'breakpoint' src/app/layout/MainLayout.tsx"
test_case "Sider 支持折叠" "grep -q 'collapsed' src/app/layout/MainLayout.tsx"

echo ""
echo "========================================="
echo "测试总结"
echo "========================================="
echo -e "通过: ${GREEN}${PASSED}${NC}"
echo -e "失败: ${RED}${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}❌ 存在失败的测试${NC}"
    exit 1
fi
