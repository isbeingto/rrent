#!/bin/bash
# =============================================================================
# Quick Start Script for RRent Development Environment
# =============================================================================
# Usage: ./quick-start-dev.sh
# Prerequisites: Docker and Docker Compose installed
# =============================================================================

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 RRent Development Environment Quick Start${NC}"
echo "=============================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose not found. Please install Docker Compose.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is available${NC}"
echo ""

# Navigate to infra directory
cd "$(dirname "$0")"

# Check if .env.dev exists, if not copy from example
if [ ! -f .env.dev ]; then
    echo -e "${YELLOW}⚠️  .env.dev not found. Copying from .env.dev.example...${NC}"
    cp .env.dev.example .env.dev
    echo -e "${GREEN}✅ Created .env.dev${NC}"
    echo ""
fi

echo "📦 Starting development environment..."
echo "------------------------------------"
docker compose -f docker-compose.dev.yml up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "📊 Service Status:"
echo "------------------------------------"
docker compose -f docker-compose.dev.yml ps

echo ""
echo "=============================================="
echo -e "${GREEN}✅ Development environment is ready!${NC}"
echo "=============================================="
echo ""
echo "📝 Quick Commands:"
echo "  View logs:         docker compose -f infra/docker-compose.dev.yml logs -f"
echo "  Stop services:     docker compose -f infra/docker-compose.dev.yml down"
echo "  Restart backend:   docker compose -f infra/docker-compose.dev.yml restart rrent-backend-dev"
echo ""
echo "🔗 Endpoints:"
echo "  Backend API:       http://localhost:3000"
echo "  Health Check:      http://localhost:3000/health"
echo "  PostgreSQL:        localhost:5432"
echo ""
echo "🗄️  Database Credentials (from .env.dev):"
echo "  Database:          rrent_dev"
echo "  User:              rrent_user"
echo "  Password:          rrent_dev_password"
echo ""
echo "💡 Tip: Read infra/BE_8_DOCKER_COMPOSE.md for complete documentation"
echo ""
