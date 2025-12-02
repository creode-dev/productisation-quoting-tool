#!/bin/bash
# Fix development servers - ensures correct project and proper routing

set -e

echo "🔧 Fixing development server setup..."
echo ""

# Kill any existing servers
echo "🛑 Stopping existing servers..."
pkill -f "vercel dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 2

# Ensure we're in the right directory
cd "$(dirname "$0")/.."
PROJECT_DIR=$(pwd)

echo "📁 Project directory: $PROJECT_DIR"
echo ""

# Verify .vercel directory exists and is correct
if [ ! -f ".vercel/project.json" ]; then
    echo "❌ .vercel/project.json not found. Linking project..."
    vercel link --yes
fi

# Verify project is correct
PROJECT_NAME=$(cat .vercel/project.json | grep -o '"projectName":"[^"]*"' | cut -d'"' -f4)
echo "✅ Vercel project: $PROJECT_NAME"
echo ""

# Start vercel dev on port 3001 for API routes
echo "📡 Starting Vercel dev for API routes on port 3001..."
cd "$PROJECT_DIR"
npx vercel dev --listen 3001 --yes > /tmp/vercel-api.log 2>&1 &
VERCEL_PID=$!
echo "   PID: $VERCEL_PID"

# Wait for vercel dev to start
echo "⏳ Waiting for Vercel dev to start..."
sleep 10

# Check if vercel dev is running
if ! ps -p $VERCEL_PID > /dev/null 2>&1; then
    echo "❌ Vercel dev failed to start. Check logs: tail -f /tmp/vercel-api.log"
    exit 1
fi

# Test API endpoint
echo "🧪 Testing API endpoint..."
sleep 2
API_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/init-db 2>/dev/null || echo "000")
if [ "$API_TEST" = "200" ] || [ "$API_TEST" = "405" ]; then
    echo "   ✅ API routes working (HTTP $API_TEST)"
else
    echo "   ⚠️  API test returned HTTP $API_TEST (might be expected)"
fi

# Start vite with proxy to vercel dev for API routes
echo ""
echo "🎨 Starting Vite dev server on port 5174..."
cd "$PROJECT_DIR"
npm run dev > /tmp/vite-dev.log 2>&1 &
VITE_PID=$!
echo "   PID: $VITE_PID"

sleep 5

echo ""
echo "✅ Servers started!"
echo ""
echo "📋 Status:"
if ps -p $VERCEL_PID > /dev/null 2>&1; then
    echo "   ✅ Vercel dev (API): http://localhost:3001"
else
    echo "   ❌ Vercel dev failed to start"
fi

if ps -p $VITE_PID > /dev/null 2>&1; then
    echo "   ✅ Vite (Frontend): http://localhost:5174"
else
    echo "   ❌ Vite failed to start"
fi

echo ""
echo "🌐 Open: http://localhost:5174"
echo ""
echo "📝 Logs:"
echo "   API: tail -f /tmp/vercel-api.log"
echo "   Frontend: tail -f /tmp/vite-dev.log"
echo ""
echo "🛑 To stop: pkill -f 'vercel dev'; pkill -f vite"
echo ""

