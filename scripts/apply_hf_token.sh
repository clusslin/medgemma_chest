#!/bin/bash
# Apply HuggingFace Token and Restart Services

echo "🔧 MedGemma System - Applying HuggingFace Token Configuration"
echo "=============================================================="
echo ""

cd /home/user/medgemma_chest

echo "✅ HF_TOKEN configured in .env file"
echo ""

echo "🛑 Stopping all containers..."
docker compose down
echo ""

echo "🔨 Rebuilding backend, workers, and DICOM SCP..."
docker compose build --no-cache backend dicom_scp worker_dicom worker_report
echo ""

echo "🚀 Starting all services..."
docker compose up -d
echo ""

echo "⏳ Waiting 20 seconds for services to initialize..."
sleep 20
echo ""

echo "📊 Container Status:"
docker compose ps
echo ""

echo "🔍 Checking worker_dicom logs (first 30 lines)..."
echo "================================================"
docker compose logs worker_dicom | head -30
echo "================================================"
echo ""

echo "✅ Configuration complete!"
echo ""
echo "📝 Next steps:"
echo "1. Monitor model download: docker compose logs -f worker_dicom"
echo "2. The model is ~15-20GB, first download will take time"
echo "3. Model will be cached in ./models/ directory"
echo "4. Visit http://localhost:8080 when download completes"
echo ""
echo "⚠️  SECURITY REMINDER:"
echo "Your HuggingFace token has been shared in this session."
echo "For security, consider regenerating it at:"
echo "https://huggingface.co/settings/tokens"
