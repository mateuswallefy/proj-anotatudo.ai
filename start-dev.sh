#!/bin/bash
# AnotaTudo.AI - Development Environment
# Starts both backend (port 5000) and frontend Vite (port 5173)

cd /home/runner/workspace

# Set environment variables
export NODE_ENV=development
export PORT=5000

echo ""
echo "🚀 Starting AnotaTudo.AI Development Environment..."
echo ""
echo "📦 Backend:  http://localhost:5000 (API routes: /api/*)"
echo "🎨 Frontend: http://localhost:5173 (Vite dev server)"
echo ""
echo "⏳ Starting servers..."
echo ""

# Check if concurrently is available, if not use background processes
if command -v npx &> /dev/null && npx concurrently --version &> /dev/null 2>&1; then
  # Use concurrently for better output management
  npx concurrently \
    --names "BACKEND,FRONTEND" \
    --prefix-colors "blue,green" \
    "npm run dev:server" \
    "npm run dev"
else
  # Fallback: Start backend in background, then frontend in foreground
  echo "⚠️  concurrently not available, starting servers sequentially..."
  echo ""
  
  # Start backend in background
  npm run dev:server &
  BACKEND_PID=$!
  
  # Wait a bit for backend to start
  sleep 3
  
  # Start frontend (this will run in foreground)
  npm run dev &
  FRONTEND_PID=$!
  
  # Wait for both processes
  wait $BACKEND_PID $FRONTEND_PID
fi
