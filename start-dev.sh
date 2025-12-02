#!/bin/bash
# Start the backend server (includes Vite middleware for frontend in development)
cd /home/runner/workspace
export NODE_ENV=development
export PORT=5000

echo "🚀 Starting development server on port 5000..."
echo "   Backend: API routes on /api/*"
echo "   Frontend: Vite middleware on all other routes"
echo ""

exec npx tsx server/index.ts
