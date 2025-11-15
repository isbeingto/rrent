#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

export NODE_ENV="test"

if [ ! -f .env.test ]; then
  echo "[verify_be7_test_base] Missing .env.test. Copy .env.test.example before running." >&2
  exit 1
fi

pnpm install --silent
pnpm run test -- --runTestsByPath test/auth-smoke.e2e-spec.ts
