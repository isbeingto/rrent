#!/bin/bash
# =============================================================================
# Backend Docker Image Verification Script
# =============================================================================
# Usage: ./verify-docker.sh
# Prerequisites: Docker installed and running
# =============================================================================

set -e

echo "🐳 RRent Backend Docker Verification Script"
echo "=============================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker daemon is not running. Please start Docker.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is available${NC}"
echo ""

# Step 1: Build the image
echo "📦 Step 1: Building Docker image..."
echo "------------------------------------"
if docker build -t rrent-backend:dev .; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo ""

# Step 2: Check image size
echo "📊 Step 2: Checking image size..."
echo "------------------------------------"
IMAGE_SIZE=$(docker images rrent-backend:dev --format "{{.Size}}")
echo "Image size: $IMAGE_SIZE"

# Extract numeric value (assuming format like "500MB")
SIZE_MB=$(echo $IMAGE_SIZE | grep -oE '[0-9]+' | head -1)
if [ "$SIZE_MB" -lt 800 ]; then
    echo -e "${GREEN}✅ Image size is reasonable (<800MB)${NC}"
else
    echo -e "${YELLOW}⚠️  Image size is larger than expected (>800MB)${NC}"
fi
echo ""

# Step 3: Inspect image layers
echo "🔍 Step 3: Image layer information..."
echo "------------------------------------"
docker history rrent-backend:dev --human --format "table {{.CreatedBy}}\t{{.Size}}" | head -10
echo ""

# Step 4: Test container startup (with mock env vars)
echo "🚀 Step 4: Testing container startup..."
echo "------------------------------------"
echo "Starting container with mock environment..."

# Create a temporary container
CONTAINER_ID=$(docker run -d \
    -e NODE_ENV=production \
    -e DATABASE_URL="postgresql://user:pass@localhost:5432/test" \
    -e JWT_SECRET="test-secret-key" \
    -p 3000:3000 \
    rrent-backend:dev)

echo "Container ID: $CONTAINER_ID"
echo "Waiting 10 seconds for startup..."
sleep 10

# Check if container is still running
if docker ps | grep -q $CONTAINER_ID; then
    echo -e "${GREEN}✅ Container is running${NC}"
    
    # Show container logs
    echo ""
    echo "📋 Container logs (last 20 lines):"
    echo "------------------------------------"
    docker logs --tail 20 $CONTAINER_ID
else
    echo -e "${RED}❌ Container exited prematurely${NC}"
    echo ""
    echo "📋 Container logs:"
    echo "------------------------------------"
    docker logs $CONTAINER_ID
    docker rm $CONTAINER_ID
    exit 1
fi
echo ""

# Step 5: Health check (optional - adjust endpoint as needed)
echo "🏥 Step 5: Health check..."
echo "------------------------------------"
echo "Note: Adjust health endpoint in script if needed"
# Uncomment and adjust when health endpoint is available
# if curl -f http://localhost:3000/health &> /dev/null; then
#     echo -e "${GREEN}✅ Health check passed${NC}"
# else
#     echo -e "${YELLOW}⚠️  Health check failed (may need DB connection)${NC}"
# fi
echo "Skipping health check (requires proper DB setup)"
echo ""

# Cleanup
echo "🧹 Cleanup..."
echo "------------------------------------"
docker stop $CONTAINER_ID > /dev/null
docker rm $CONTAINER_ID > /dev/null
echo -e "${GREEN}✅ Container cleaned up${NC}"
echo ""

# Summary
echo "=============================================="
echo -e "${GREEN}🎉 Verification Complete!${NC}"
echo "=============================================="
echo ""
echo "Summary:"
echo "  ✅ Image built successfully"
echo "  ✅ Image size: $IMAGE_SIZE"
echo "  ✅ Container can start"
echo ""
echo "Next steps:"
echo "  1. Set up proper .env.docker file with real credentials"
echo "  2. Run: docker run --env-file .env.docker -p 3000:3000 rrent-backend:dev"
echo "  3. Test with: curl http://localhost:3000/health"
echo ""
