#!/bin/bash
# MedGemma Chest X-Ray System - Rebuild and Restart Script
# This script will rebuild and restart all services with the latest code

set -e

echo "=========================================="
echo "MedGemma System Rebuild and Restart"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found!"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo "Step 1: Pulling latest code from git..."
git pull origin claude/setup-medgemma-chest-01Rsud2o3hEktdjVbvn17EdX
echo "✅ Code updated"
echo ""

echo "Step 2: Stopping all containers..."
docker compose down
echo "✅ Containers stopped"
echo ""

echo "Step 3: Rebuilding images (this may take a few minutes)..."
docker compose build --no-cache backend frontend
echo "✅ Images rebuilt"
echo ""

echo "Step 4: Starting all services..."
docker compose up -d
echo "✅ Services started"
echo ""

echo "Step 5: Waiting for services to initialize (30 seconds)..."
sleep 30
echo ""

echo "Step 6: Checking container status..."
docker compose ps
echo ""

echo "Step 7: Checking backend logs for errors..."
echo "======== Backend Logs (last 20 lines) ========"
docker compose logs --tail=20 backend
echo "=============================================="
echo ""

echo "🎉 Rebuild complete!"
echo ""
echo "Next steps:"
echo "1. Visit http://localhost:8080 in your browser"
echo "2. Check the browser console (F12) for any errors"
echo "3. If you still see errors, run: docker compose logs -f backend"
echo ""
