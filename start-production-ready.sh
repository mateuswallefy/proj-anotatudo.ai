#!/bin/bash
# Production-ready server startup script
# This ensures only ONE instance runs at a time

set -e

echo "🔄 Starting AnotaTudo.AI Server..."

# Kill any existing processes
pkill -f "tsx server/index.ts" 2>/dev/null || true
sleep 1

# Kill port lock if needed
lsof -i :3000 -sTCP:LISTEN -t 2>/dev/null | xargs -r kill -9 2>/dev/null || true
sleep 1

# Export environment
export NODE_ENV=production
export PORT=3000

# Start server - stay running
cd /home/runner/workspace
exec tsx server/index.ts
