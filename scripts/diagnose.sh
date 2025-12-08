#!/bin/bash
# MedGemma Chest X-Ray System - Diagnostic Script
# This script will help diagnose common issues

echo "=========================================="
echo "MedGemma System Diagnostics"
echo "=========================================="
echo ""

echo "1. Checking Docker containers status..."
echo "----------------------------------------"
docker compose ps
echo ""

echo "2. Checking if backend is responding..."
echo "----------------------------------------"
curl -s http://localhost:8000/health | jq . || echo "❌ Backend health check failed"
echo ""

echo "3. Testing stats endpoint..."
echo "----------------------------------------"
curl -s http://localhost:8000/api/v1/studies/stats || echo "❌ Stats endpoint failed"
echo ""

echo "4. Backend container logs (last 50 lines)..."
echo "----------------------------------------"
docker compose logs --tail=50 backend
echo ""

echo "5. Checking .env file..."
echo "----------------------------------------"
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    echo "CORS_ORIGINS setting:"
    grep "CORS_ORIGINS" .env || echo "❌ CORS_ORIGINS not found in .env"
else
    echo "❌ .env file not found! Please copy .env.example to .env"
fi
echo ""

echo "6. Checking backend/models.py for QUEUED status..."
echo "----------------------------------------"
if grep -q "QUEUED = \"queued\"" backend/models.py; then
    echo "✅ QUEUED status found in backend/models.py"
else
    echo "❌ QUEUED status NOT found in backend/models.py"
    echo "This will cause 500 errors!"
fi
echo ""

echo "=========================================="
echo "Diagnostic complete"
echo "=========================================="
