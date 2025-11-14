#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "╔════════════════════════════════════════════╗"
echo "║   BE-2 Unified Verification - Services    ║"
echo "╚════════════════════════════════════════════╝"
echo

step() {
  echo
  echo "▶ $1"
  echo "────────────────────────────────────────────"
}

# 1) Lint
step "1. ESLint 检查"
pnpm run lint

# 2) Build
step "2. TypeScript 构建（不带产物校验即可）"
pnpm run build

# 3) Prisma 验证
step "3. Prisma Schema 验证"
pnpm prisma validate

# 4) BE-2 Service 测试（第一组：Org/Property/Unit 等）
step "4. BE-2 Service Tests (Part 1: be2-org-property-unit)"
pnpm test:be2-services

# 5) BE-2 Service 测试（第二组：Tenant/Lease/Payment）
step "5. BE-2 Service Tests (Part 2: be2-tenant-lease-payment)"
pnpm test:be2-services-2

echo
echo "╔════════════════════════════════════════════╗"
echo "║  ✅  BE-2 verification completed success   ║"
echo "╚════════════════════════════════════════════╝"
