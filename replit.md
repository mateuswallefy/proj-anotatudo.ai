# AnotaTudo.AI - Replit Development Guide

## Overview
AnotaTudo.AI is a SaaS financial management platform that leverages AI to transform WhatsApp messages (text, audio, photos, videos) into structured financial records. Its core purpose is to provide users with a comprehensive financial dashboard for visualizing income, expenses, credit cards, and financial trends, alongside manual transaction management.

## 🚀 DEV/PROD Workflow (November 28, 2025)

### Architecture
```
DEV (eumateus3435/workspace)
    ↓ git push
GitHub (proj-anotatudo.ai.git)
    ↓ git pull
PROD (eumateus3435/prod)
```

### Databases (Neon)
**DEV:**
```
postgresql://neondb_owner:npg_aUvt8L9IKjMW@ep-shy-recipe-aco7vd4h-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**PROD:** [Separate Neon instance - kept isolated via NEON_DATABASE_URL env var]

### Workflow
1. **Make changes in DEV** (this workspace)
2. **Push to GitHub:** `git push origin main`
3. **Pull to PROD:** On prod workspace, run `git pull origin main`
4. Each environment maintains its own `NEON_DATABASE_URL` secret (never committed)

## Quick Start (Development)

### Running the Server (Port 5000)
```bash
npm run dev:server
```

Server will start at **http://localhost:5000**

### Accessing the App
- **Frontend**: http://localhost:5000 (via Replit Preview on external port 80)
- **Health Check**: http://localhost:5000/_health
- **API Endpoints**: http://localhost:5000/api/...

### Port Already In Use?
```bash
pkill -9 -f node
sleep 1
npm run dev:server
```

## 🔧 Configuration

### .replit File
```
modules = ["nodejs-20"]
run = "npm run dev:server"

[[ports]]
localPort = 5000
externalPort = 80
```

This binds internal port 5000 to external port 80 for Replit Preview.

## 📦 Server Architecture

### Tech Stack
- **Backend**: Express.js + TypeScript
- **Frontend**: React + Vite, TailwindCSS, Shadcn UI
- **Database**: PostgreSQL via Neon (serverless)
- **ORM**: Drizzle with TypeScript schemas
- **Auth**: Session-based (web) + Email-based (WhatsApp)

### Key Components
- Express server with Vite middleware (development mode)
- Health check endpoints at `/_health`
- WhatsApp webhook support
- Admin authentication system
- AI pipeline (GPT integration)
- Financial logic (Income/Expenses/Savings)

## Recent Changes (November 28, 2025)

### ✅ DEV/PROD Separation Implemented
- Implemented secure development workflow with GitHub synchronization
- Each environment maintains separate Neon database via NEON_DATABASE_URL
- Code syncs via git (GitHub), databases stay isolated
- Express server running on port 5000 with Vite middleware
- Port mapping configured in .replit for Preview access

### Previous Fixes
- Resolved package.json synchronization across environments
- Fixed Git merge conflicts (.gitignore, .replit)
- Corrected server architecture (Express+Vite instead of standalone Vite)
- Resolved EADDRINUSE port conflicts

## User Preferences
- Communication style: Simple, everyday language
- Development workflow: Code editing in DEV → git push → GitHub → git pull to PROD
- Each environment has isolated Neon database
- Prioritize: Working features over automation
