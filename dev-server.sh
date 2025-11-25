#!/bin/bash
# AnotaTudo.AI - Development Server
# Express with integrated Vite on port 5000

cd /home/runner/workspace

# Kill existing processes
pkill -f "tsx|vite|node" 2>/dev/null || true
sleep 2

echo ""
echo "🚀 Starting AnotaTudo.AI Development Server..."
echo ""
echo "📍 Access at: http://localhost:5000"
echo "   (External port 5000 via .replit config)"
echo ""

# Run Express with integrated Vite
NODE_ENV=development tsx server/index.ts
