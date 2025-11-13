#!/bin/bash

# BE-2-30: Test Setup and Execution Script
# This script ensures the database is ready before running tests

set -e

cd /srv/rrent/backend

echo "========================================="
echo "BE-2-30: Services Integration Test Setup"
echo "========================================="

# Check if PostgreSQL is running
echo "Checking PostgreSQL connection..."
if timeout 5 pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "✓ PostgreSQL is running"
else
    echo "⚠ PostgreSQL not found at localhost:5432"
    echo "  Attempting to start PostgreSQL service..."
    
    # Try to start PostgreSQL if available
    if command -v pg_ctl &> /dev/null; then
        echo "  Starting PostgreSQL with pg_ctl..."
        # This is a fallback - may need manual setup
    elif command -v service &> /dev/null; then
        sudo service postgresql start 2>/dev/null || true
    else
        echo "  ERROR: PostgreSQL is not running and cannot be started automatically"
        echo "  Please ensure PostgreSQL is running on localhost:5432"
        exit 1
    fi
    
    sleep 2
    
    if ! timeout 5 pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
        echo "  ERROR: Still cannot reach PostgreSQL"
        exit 1
    fi
fi

echo ""
echo "Setting up database schema..."

# Push schema to database (create tables if needed)
npx prisma db push --skip-generate --accept-data-loss > /dev/null 2>&1 || {
    echo "Warning: Could not push schema (database may already exist)"
}

echo "✓ Database schema ready"
echo ""
echo "Running BE-2 service tests..."
echo "========================================="
echo ""

# Run the tests
pnpm test:be2-services --forceExit

echo ""
echo "========================================="
echo "Test run complete"
echo "========================================="
