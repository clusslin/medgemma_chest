#!/bin/bash

set -e

echo "========================================="
echo "MedGemma Chest X-Ray Automation System"
echo "========================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "Please edit .env file with your configuration"
    exit 1
fi

# Create data directories
echo "Creating data directories..."
mkdir -p data/dicom_storage data/results data/logs models

# Pull Docker images
echo "Pulling Docker images..."
docker-compose pull

# Build Docker images
echo "Building Docker images..."
docker-compose build

# Start services
echo "Starting services..."
docker-compose up -d postgres rabbitmq redis

# Wait for services to be healthy
echo "Waiting for services to be ready..."
sleep 10

# Initialize database
echo "Initializing database..."
docker-compose run --rm backend python /app/scripts/init_db.py

# Start all services
echo "Starting all services..."
docker-compose up -d

echo ""
echo "========================================="
echo "System started successfully!"
echo "========================================="
echo ""
echo "Services:"
echo "  - Frontend:        http://localhost:3000"
echo "  - Backend API:     http://localhost:8000/api/docs"
echo "  - RabbitMQ UI:     http://localhost:15672 (guest/guest)"
echo "  - DICOM SCP Port:  11112"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f"
echo ""
echo "To stop services:"
echo "  docker-compose down"
echo ""
