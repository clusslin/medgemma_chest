#!/bin/bash
# Quick fix script for 500 errors and CORS issues

echo "🔧 Stopping all containers..."
docker compose down

echo "🔨 Rebuilding backend container..."
docker compose build --no-cache backend

echo "🚀 Starting all services..."
docker compose up -d

echo "⏳ Waiting 15 seconds for services to initialize..."
sleep 15

echo "📊 Container status:"
docker compose ps

echo ""
echo "🔍 Testing backend health..."
curl -s http://localhost:8000/health | head -20

echo ""
echo "🔍 Testing stats endpoint..."
curl -s http://localhost:8000/api/v1/studies/stats | head -20

echo ""
echo "✅ Done! Please refresh your browser at http://localhost:8080"
