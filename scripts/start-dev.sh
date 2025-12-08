#!/bin/bash
# Script to start development server with proper API routing

set -e

echo "🔧 Starting development servers..."
echo ""

# Kill any existing servers
pkill -f "vercel dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 2

# Start vercel dev on a different port for API routes
echo "📡 Starting Vercel dev for API routes on port 3001..."
npx vercel dev --listen 3001 > /tmp/vercel-api.log 2>&1 &
VERCEL_PID=$!

# Wait for vercel dev to start
sleep 8

# Start vite with proxy to vercel dev for API routes
echo "🎨 Starting Vite dev server on port 5174..."
npm run dev > /tmp/vite-dev.log 2>&1 &
VITE_PID=$!

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




