#!/bin/bash

# BE-5 Pagination Verification Script
# Tests pagination, filtering, sorting, and X-Total-Count header

set -e

echo "=================================================="
echo "🧪 BE-5 Pagination & Filtering Verification"
echo "=================================================="
echo ""

cd "$(dirname "$0")/.."

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to print test result
print_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓ PASSED${NC}: $2"
    ((PASSED++))
  else
    echo -e "${RED}✗ FAILED${NC}: $2"
    ((FAILED++))
  fi
}

# Function to check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."
if ! command_exists pnpm; then
  echo -e "${RED}Error: pnpm is not installed${NC}"
  exit 1
fi

if [ ! -f "package.json" ]; then
  echo -e "${RED}Error: package.json not found. Run this script from backend directory.${NC}"
  exit 1
fi

echo -e "${GREEN}✓${NC} Prerequisites checked"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  pnpm install
  echo ""
fi

# Run linter
echo "🔍 Running linter..."
if pnpm run lint 2>&1 | grep -q "error"; then
  print_result 1 "Linter check"
else
  print_result 0 "Linter check"
fi
echo ""

# Check TypeScript compilation
echo "🔨 Checking TypeScript compilation..."
if pnpm run build > /dev/null 2>&1; then
  print_result 0 "TypeScript compilation"
else
  print_result 1 "TypeScript compilation"
fi
echo ""

# Run E2E tests
echo "🧪 Running E2E pagination tests..."
echo ""

if pnpm run test:e2e -- list-pagination.e2e-spec.ts 2>&1 | tee /tmp/test-output.log; then
  # Check test results
  if grep -q "Tests:.*passed" /tmp/test-output.log; then
    TESTS_PASSED=$(grep -oP '\d+(?= passed)' /tmp/test-output.log | head -1)
    print_result 0 "E2E pagination tests ($TESTS_PASSED tests passed)"
  else
    print_result 1 "E2E pagination tests"
  fi
else
  print_result 1 "E2E pagination tests"
fi
echo ""

# Verify key files exist
echo "📁 Verifying implementation files..."

FILES=(
  "src/modules/organization/dto/query-organization.dto.ts"
  "src/modules/property/dto/query-property.dto.ts"
  "src/modules/unit/dto/query-unit.dto.ts"
  "src/modules/tenant/dto/query-tenant.dto.ts"
  "src/modules/lease/dto/query-lease.dto.ts"
  "src/modules/payment/dto/query-payment.dto.ts"
  "src/modules/organization/organization.controller.ts"
  "src/modules/property/property.controller.ts"
  "src/modules/unit/unit.controller.ts"
  "src/modules/tenant/tenant.controller.ts"
  "src/modules/lease/lease.controller.ts"
  "src/modules/payment/payment.controller.ts"
  "test/list-pagination.e2e-spec.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    print_result 0 "File exists: $file"
  else
    print_result 1 "File missing: $file"
  fi
done
echo ""

# Check for required features in code
echo "🔎 Checking for required features..."

# Check for dateStart/dateEnd in DTOs
if grep -r "dateStart" src/modules/*/dto/query-*.dto.ts > /dev/null; then
  print_result 0 "Date range filters in DTOs"
else
  print_result 1 "Date range filters in DTOs"
fi

# Check for X-Total-Count in controllers
if grep -r "X-Total-Count" src/modules/*/**.controller.ts > /dev/null; then
  print_result 0 "X-Total-Count header in controllers"
else
  print_result 1 "X-Total-Count header in controllers"
fi

# Check for keyword search in services
if grep -r "keyword.*contains.*insensitive" src/modules/*/**.service.ts > /dev/null; then
  print_result 0 "Keyword search in services"
else
  print_result 1 "Keyword search in services"
fi

# Check for status filters
if grep -r "if (status)" src/modules/*/**.service.ts > /dev/null; then
  print_result 0 "Status filters in services"
else
  print_result 1 "Status filters in services"
fi

echo ""
echo "=================================================="
echo "📊 Test Summary"
echo "=================================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All verifications passed!${NC}"
  echo ""
  echo "✨ BE-5 (Tasks 48-50) implementation verified successfully!"
  exit 0
else
  echo -e "${RED}❌ Some verifications failed.${NC}"
  echo ""
  echo "Please review the failed items above."
  exit 1
fi
