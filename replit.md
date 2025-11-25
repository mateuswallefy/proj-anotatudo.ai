# AnotaTudo.AI - Replit Development Guide

## Overview
AnotaTudo.AI is a SaaS financial management platform that leverages AI to transform WhatsApp messages (text, audio, photos, videos) into structured financial records. Its core purpose is to provide users with a comprehensive financial dashboard for visualizing income, expenses, credit cards, and financial trends, alongside manual transaction management.

## 🚀 Quick Start (Development)

**DO NOT use the "Run" button** - it causes a port detection loop.

Instead, in the Replit console run:
```bash
bash dev-server.sh
```

Server will start at **http://localhost:3000**

## 🔧 Development Mode

### Starting the Server
```bash
# Option 1: Quick script (Recommended)
bash dev-server.sh

# Option 2: Direct TypeScript
tsx server/index.ts

# Option 3: Alternative shell script
bash start-dev.sh
```

### Accessing the App
- **Frontend**: http://localhost:3000
- **Health Check**: http://localhost:3000/_health
- **API Endpoints**: http://localhost:3000/api/...

### Port Already In Use?
```bash
pkill -9 tsx
sleep 2
bash dev-server.sh
```

## 📦 Production vs Development

**Preview (localhost:3000)**
- Temporary development environment
- Changes appear immediately
- NOT synced with production

**Production (https://anotatudo.com)**
- Live 24/7 deployment
- Only updates when you publish
- Completely separate from preview

To update production, use the Publish button in Replit.

## Recent Changes (November 25, 2025)
### ✅ Development Server Fixed
- **Issue Resolved**: Replit workflow port detection incompatibility
- **Solution**: Manual startup via `bash dev-server.sh`
- **Server Performance**: < 2 seconds startup time
- **Status**: ✅ All systems working perfectly

### Server Architecture
- Express.js backend listening on port 3000
- Async database initialization (non-blocking)
- Health check endpoints at `/_health` and `/health`
- WhatsApp webhook support
- Admin authentication system
- Comprehensive logging

### Previous Changes (November 24, 2025)
- Server startup optimization refactor
- Port configuration analysis completed
- Production deployment confirmed working (anotatudo.com)
- Development preview workaround created

## System Architecture

### Frontend
- **Stack**: React + TypeScript, Vite, TailwindCSS, Shadcn UI
- **Design**: Material Design 3, mobile-first, dark mode support
- **State**: TanStack Query, React Hook Form with Zod validation
- **Navigation**: Zero-reload tab-based (TabContext), responsive design
- **Pages**: 8 complete pages with comprehensive features

### Backend
- **Stack**: Express.js + TypeScript
- **Auth**: Session-based (web) + Email-based (WhatsApp)
- **AI Pipeline**: GPT-5 for transaction extraction
- **Rate Limiting**: 10 messages/minute per WhatsApp number
- **Financial Logic**: Income/Expenses/Savings tracking with variation calculations

### Database
- **Engine**: PostgreSQL via Neon (serverless)
- **ORM**: Drizzle with TypeScript schemas
- **Tables**: users, transacoes, cartoes, subscriptions, whatsapp_sessions, webhooks, etc.

## External Dependencies
- **OpenAI API**: GPT-5 for AI features
- **WhatsApp Business API**: Message handling
- **Neon Database**: PostgreSQL hosting
- **Recharts**: Financial visualizations
- **Radix UI**: Component primitives

## User Preferences
- Communication style: Simple, everyday language
- Development workflow: Manual server startup
- Prioritize: Working features over automation issues
