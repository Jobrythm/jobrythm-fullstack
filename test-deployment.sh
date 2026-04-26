#!/bin/bash

# Script to test Docker deployment
# Run this after: docker compose up -d --build

echo "🚀 Testing Jobrythm Docker Deployment..."
echo ""

# Wait for containers to start
echo "⏳ Waiting for containers to start..."
sleep 5

# Check if containers are running
echo "📊 Checking container status..."
docker compose ps

echo ""
echo "📋 Checking app logs..."
docker compose logs app | tail -20

echo ""
echo "🔍 Testing health endpoint..."
for i in {1..30}; do
    if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
        echo "✅ Health check passed!"
        curl -s http://localhost:8080/api/health | python3 -m json.tool
        break
    else
        echo "⏳ Attempt $i/30: Waiting for app to be ready..."
        sleep 2
    fi
done

echo ""
echo "🌐 Testing frontend..."
if curl -s http://localhost:8080 | grep -q "<!doctype html>"; then
    echo "✅ Frontend is serving!"
else
    echo "❌ Frontend not responding"
fi

echo ""
echo "✨ Deployment test complete!"
echo "📝 Access the app at: http://localhost:8080"
echo "👤 Default login: admin@example.com / adminpassword"
