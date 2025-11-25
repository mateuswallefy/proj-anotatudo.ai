#!/bin/bash
# AnotaTudo.AI - Development Server
# Runs on port 5000 (external port 80 via Replit config)

set -e

# Kill any existing servers
pkill -f "tsx server/index.ts" 2>/dev/null || true
sleep 1

# Clean port if locked
lsof -i :5000 -sTCP:LISTEN -t 2>/dev/null | xargs -r kill -9 2>/dev/null || true
sleep 1

# Start server
cd /home/runner/workspace
export NODE_ENV=development
export PORT=5000
tsx server/index.ts
