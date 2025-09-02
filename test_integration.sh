#!/bin/bash

echo "🧪 Testing YATAV Integration..."
echo ""

# Test backend health
echo "1. Testing Backend Health Check..."
BACKEND_RESPONSE=$(curl -s http://127.0.0.1:8008/health)
if [[ $BACKEND_RESPONSE == *"healthy"* ]]; then
    echo "   ✅ Backend is healthy"
else
    echo "   ❌ Backend health check failed"
fi

# Test CORS from port 3000
echo ""
echo "2. Testing CORS from localhost:3000..."
CORS_3000=$(curl -s -I -H "Origin: http://localhost:3000" http://127.0.0.1:8008/health | grep "access-control-allow-origin")
if [[ $CORS_3000 == *"http://localhost:3000"* ]]; then
    echo "   ✅ CORS allowed for localhost:3000"
else
    echo "   ❌ CORS blocked for localhost:3000"
fi

# Test CORS from port 3002
echo ""
echo "3. Testing CORS from localhost:3002..."
CORS_3002=$(curl -s -I -H "Origin: http://localhost:3002" http://127.0.0.1:8008/health | grep "access-control-allow-origin")
if [[ $CORS_3002 == *"http://localhost:3002"* ]]; then
    echo "   ✅ CORS allowed for localhost:3002"
else
    echo "   ❌ CORS blocked for localhost:3002"
fi

# Test characters endpoint
echo ""
echo "4. Testing Characters Endpoint..."
CHARACTERS=$(curl -s http://127.0.0.1:8008/characters)
if [[ $CHARACTERS == *"characters"* ]]; then
    echo "   ✅ Characters endpoint working"
else
    echo "   ❌ Characters endpoint failed"
fi

echo ""
echo "✅ Integration test complete!"
echo ""
echo "📝 Summary:"
echo "   - Backend: http://127.0.0.1:8008"
echo "   - Frontend (main): http://localhost:3000"
echo "   - Frontend (alt): http://localhost:3002"
echo "   - API Docs: http://127.0.0.1:8008/docs"