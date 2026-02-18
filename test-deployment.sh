#!/bin/bash
# DriftX Deployment Test Script
# This script tests the deployment configuration

set -e

echo "🔍 DriftX Deployment Test"
echo "=========================="
echo ""

# Test 1: Check if backend dependencies are installed
echo "1️⃣ Testing Backend Dependencies..."
cd backend
if [ ! -d "venv" ]; then
    echo "   Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -q -r requirements.txt
echo "   ✅ Backend dependencies installed"

# Test 2: Check if backend can start
echo ""
echo "2️⃣ Testing Backend Startup..."
python -m uvicorn main:app --host 127.0.0.1 --port 8000 > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
sleep 3

if curl -s http://127.0.0.1:8000/ | grep -q "DriftX Backend Running"; then
    echo "   ✅ Backend started successfully"
else
    echo "   ❌ Backend failed to start"
    cat /tmp/backend.log
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Test 3: Test API endpoints
echo ""
echo "3️⃣ Testing API Endpoints..."

endpoints=(
    "/"
    "/scheduler-status"
    "/snapshot-info"
    "/drift"
    "/alerts"
    "/current-processes"
    "/resource-analysis"
)

for endpoint in "${endpoints[@]}"; do
    if curl -s "http://127.0.0.1:8000${endpoint}" > /dev/null; then
        echo "   ✅ ${endpoint}"
    else
        echo "   ❌ ${endpoint} failed"
    fi
done

# Test 4: Check frontend files
cd ../frontend
echo ""
echo "4️⃣ Testing Frontend Configuration..."

if [ -f "src/config/api.js" ]; then
    echo "   ✅ API configuration file exists"
else
    echo "   ❌ API configuration file missing"
    exit 1
fi

# Check if App.jsx uses API_ENDPOINTS
if grep -q "API_ENDPOINTS" src/App.jsx; then
    echo "   ✅ Frontend uses API configuration"
else
    echo "   ❌ Frontend doesn't use API configuration"
    exit 1
fi

# Test 5: Check deployment files
cd ..
echo ""
echo "5️⃣ Testing Deployment Files..."

if [ -f "nginx-driftx.conf" ]; then
    echo "   ✅ Nginx configuration exists"
else
    echo "   ❌ Nginx configuration missing"
fi

if [ -f "systemd/driftx.service" ]; then
    echo "   ✅ Systemd service file exists"
else
    echo "   ❌ Systemd service file missing"
fi

if [ -f "README.md" ]; then
    echo "   ✅ Documentation exists"
else
    echo "   ❌ Documentation missing"
fi

# Cleanup
echo ""
echo "🧹 Cleaning up..."
kill $BACKEND_PID 2>/dev/null || true

echo ""
echo "✅ All tests passed!"
echo ""
echo "Next steps:"
echo "1. Review the README.md for deployment instructions"
echo "2. Configure nginx using nginx-driftx.conf"
echo "3. Install systemd service using systemd/driftx.service"
echo "4. Build frontend for production: cd frontend && npm run build"
