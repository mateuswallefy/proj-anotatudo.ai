# AnotaTudo.AI - Replit Development Guide

## Overview

AnotaTudo.AI is a SaaS financial management platform that transforms WhatsApp messages into structured financial records using AI. Users can send text, audio, photos, or videos via WhatsApp, and the system automatically categorizes and organizes these inputs into a comprehensive financial dashboard.

**Core Functionality:**
- WhatsApp integration for receiving financial data in multiple formats (text, audio, image, video)
- AI-powered classification and extraction of financial transaction data
- Dashboard for visualizing income, expenses, credit cards, and financial trends
- Manual transaction entry and management
- Credit card tracking with invoice management

**Technology Stack:**
- Frontend: React with TypeScript, Vite, TailwindCSS
- Backend: Express.js with TypeScript
- Database: PostgreSQL via Neon (serverless)
- ORM: Drizzle ORM
- UI Components: Shadcn UI (Radix UI primitives)
- AI: OpenAI API (GPT-5)
- Authentication: Replit Auth (OpenID Connect)

## Recent Changes (November 15, 2025)

### Purchase-Based WhatsApp Authentication System
- **Caktos Integration:** Webhook (`/api/webhook-caktos`) receives purchase notifications from Caktos payment platform
- **Purchase Verification:** Only users with approved purchases can access the system
- **WhatsApp Authentication Flow:**
  1. User sends first message to WhatsApp → system creates user with `status='awaiting_email'`
  2. System prompts: "Para liberar seu acesso, envie o e-mail usado na compra."
  3. User sends email → system validates against `purchases` table
  4. If purchase exists and is approved → user status updated to `authenticated`
  5. Authenticated users can send transactions via text, audio, photo, or video
- **Rate Limiting:** 10 messages per minute per phone number to prevent abuse
- **Email Extraction:** Automatic email detection from user messages using regex validation
- **Status-Based Processing:** Transactions only processed for authenticated users

### Instant Tab Navigation System
- **TabShell Component:** All pages (Dashboard, Transações, Cartões, Adicionar, Configurações) remain mounted simultaneously
- **Display Toggle:** Navigation switches between pages using `display: none/block` instead of mount/unmount
- **Zero Loading States:** Eliminates loading spinners when switching tabs
- **Smart Prefetch:** All critical data queries prefetch on initial app mount using React Query
- **Smooth Transitions:** Uses React's `startTransition` for 60fps tab switches
- **URL Sync:** Browser history and URL update without page remount

### Material Design 3 Dashboard Redesign
- **Modern Color Palette:**
  - Primary: Emerald (#10B981) - income, positive values
  - Secondary: Teal (#0AA298) - expenses, neutral actions  
  - Accent: Orange (#F2994A) - warnings, highlights
  - Neutrals: Blue-gray tones for sophisticated backgrounds
- **Typography:** Inter for UI text, JetBrains Mono for financial values (tabular-nums)
- **Redesigned Components:**
  - **SpendingSpeedometer:** RadialBarChart with radial gradients, centered percentage display (48px font)
  - **DailyAverageChart:** AreaChart with 0.6→0 opacity gradients, animated dots, glassmorphism tooltips
  - **WeekdayAnalysis:** Rounded bars (8px radius), vertical gradients, highlighted max values
  - **CategoryRanking:** Circular tonal icons (40px), badges for transaction counts, mini progress bars
  - **InsightsCards:** Tonal surfaces (HSL alpha 0.05-0.15), circular icons (48px), uppercase labels
- **Glassmorphism:** Chart tooltips use backdrop-blur with semi-transparent backgrounds
- **Animations:** All charts use 400ms smooth transitions following Material Motion guidelines
- **Dark Mode:** Full HSL-based color system with proper alpha channel support for both themes

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Component System:**
- Uses Shadcn UI component library built on Radix UI primitives
- Material Design 3 principles for information-dense financial layouts
- Component path aliases configured via `components.json`
- Responsive design with mobile-first breakpoints (768px threshold)

**State Management:**
- TanStack Query (React Query) for server state management
- Custom hooks for authentication (`useAuth`) and UI state
- Form state managed via React Hook Form with Zod validation

**Routing:**
- Wouter for client-side routing (lightweight alternative to React Router)
- Protected routes based on authentication state
- Main routes: Dashboard, Transactions, Cards, Add Transaction, Settings

**Design System:**
- Typography: Inter (primary), JetBrains Mono (financial values)
- Color system: HSL-based CSS variables for theming
- Spacing: Tailwind's spacing scale (2, 4, 6, 8, 12, 16)
- Dark mode support via class-based theme switching

### Backend Architecture

**API Structure:**
- RESTful endpoints under `/api` prefix
- Express.js server with TypeScript
- Session-based authentication using connect-pg-simple
- Middleware for request logging and JSON parsing

**Key Endpoints:**
- `/api/auth/user` - Get current user information
- `/api/transacoes` - CRUD operations for transactions
- `/api/cartoes` - Credit card management
- `/api/faturas` - Invoice management
- `/api/whatsapp/webhook` - WhatsApp message reception (planned)

**Authentication Flow:**
- Replit Auth via OpenID Connect (OIDC)
- Session storage in PostgreSQL
- User session includes claims, access_token, refresh_token
- Protected routes require `isAuthenticated` middleware

**AI Processing Pipeline:**
1. Receive message from WhatsApp webhook
2. Determine message type (text, audio, image, video)
3. Process content:
   - Text: Direct classification
   - Audio: Transcription → classification
   - Image: OCR → classification
   - Video: Frame extraction → OCR → classification
4. Extract structured data (type, category, amount, date, description)
5. Return confidence score with extracted data
6. Create transaction record in database

### Data Storage Solutions

**Database Schema (PostgreSQL via Drizzle ORM):**

**Core Tables:**
- `users` - User profiles with WhatsApp-based authentication
  - Stores: id, email (nullable), telefone (unique), status ('awaiting_email' | 'authenticated'), plan
  - Status field controls access: only authenticated users can create transactions
  - Created/updated timestamps

- `purchases` - Purchase records from Caktos payment platform
  - Stores: email, telefone, status ('approved' | 'pending' | 'refunded'), purchaseId, productName, amount
  - Links purchases to users for authentication validation
  - Updated when user authenticates via WhatsApp (telefone field populated)

- `transacoes` (Transactions)
  - Type: entrada (income) / saida (expense)
  - Categories: Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Compras, Contas, Salário, Investimentos, Outros
  - Origin tracking: texto, audio, foto, video, manual
  - Linked to user via userId foreign key
  - Stores: amount, date, description, confidence score

- `cartoes` (Credit Cards)
  - Card details: name, total limit, used limit
  - Billing cycle: closing day, due day
  - Card brand: visa, mastercard, elo, amex, etc.
  - Per-user card management

- `faturas` (Invoices)
  - Linked to specific credit card
  - Month/year tracking
  - Status: aberta (open), fechada (closed), paga (paid), atrasada (late)
  - Total amount and due date

- `cartao_transacoes` (Card Transactions)
  - Links transactions to specific invoices
  - Installment tracking (current/total)
  - Separate from main transactions table

- `sessions` - Session storage for authentication
  - Required for Replit Auth integration

**ORM Configuration:**
- Drizzle ORM with PostgreSQL dialect
- Schema-first approach with type inference
- Zod integration for runtime validation
- Migrations managed in `/migrations` directory

**Data Access Pattern:**
- Storage abstraction layer (`IStorage` interface)
- `DatabaseStorage` implementation for all CRUD operations
- User-scoped queries for data isolation
- Transactional operations for related data updates

### Authentication and Authorization

**Replit Auth Integration:**
- OAuth 2.0 / OpenID Connect flow
- Discovery endpoint: `https://replit.com/oidc`
- Session management with PostgreSQL storage
- 7-day session TTL
- HTTPS-only cookies for security

**User Session Management:**
- Sessions stored in `sessions` table
- User information cached in session
- Token refresh mechanism for expired access tokens
- Automatic user creation/update on login

**Authorization Pattern:**
- Route-level protection via `isAuthenticated` middleware
- User ID from session claims (`req.user.claims.sub`)
- All queries scoped to authenticated user's ID
- No cross-user data access

### External Dependencies

**OpenAI Integration:**
- Model: GPT-5 (latest as of August 2025)
- Usage: Financial transaction classification and data extraction
- Structured JSON output for transaction data
- Confidence scoring for AI interpretations

**WhatsApp Business API (Planned):**
- Meta WhatsApp Cloud API integration
- Webhook endpoint for message reception
- Message type detection and routing
- Media download and processing capabilities

**Neon Database:**
- Serverless PostgreSQL hosting
- WebSocket connection pooling
- Connection string via `DATABASE_URL` environment variable
- Automatic connection management

**Third-Party Libraries:**
- Chart rendering: Recharts for financial visualizations
- Date handling: date-fns for date formatting and calculations
- Form validation: Zod schemas with react-hook-form
- UI components: Complete Radix UI primitive set

**Build and Development Tools:**
- Vite for frontend bundling and HMR
- esbuild for backend bundling
- TypeScript for type safety across full stack
- Replit-specific plugins for development environment integration