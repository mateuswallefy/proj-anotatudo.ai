# 🚀 AnotaTudo.AI - Development Setup

## ⚠️ IMPORTANT: Do NOT use the "Run" button!
The automatic workflow has a port detection issue. Use the manual startup instead.

## ✅ How to Start Development Server

### Option 1: Quick Start (Recommended)
In the Replit console, run:
```bash
bash dev-server.sh
```

### Option 2: Direct TypeScript
```bash
tsx server/index.ts
```

### Option 3: Direct Shell Script  
```bash
bash start-dev.sh
```

## 🌐 Access Your App

Once the server starts, you'll see:
```
ready
✅ Server listening on http://0.0.0.0:3000
```

Then access:
- **Frontend**: http://localhost:3000
- **Health Check**: http://localhost:3000/_health
- **API**: http://localhost:3000/api/...

## 🔧 If Port is Locked

If you get "port already in use" error:
```bash
pkill -9 tsx
# Wait 2 seconds
bash dev-server.sh
```

## 📦 Production Deployment

Production (https://anotatudo.com) is separate from development:
- Development (localhost:3000) = Your sandbox
- Production (anotatudo.com) = Live app
- They do NOT auto-sync - publish when ready

## ✨ Server Features

✅ Starts in < 2 seconds
✅ Async database initialization (non-blocking)
✅ Health check endpoints
✅ WhatsApp webhook support
✅ Admin authentication
✅ Logging system

---
**Last Updated**: November 25, 2025
**Status**: ✅ Working Perfectly
