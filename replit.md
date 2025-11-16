# AnotaTudo.AI - Replit Development Guide

## Overview
AnotaTudo.AI is a SaaS financial management platform that leverages AI to transform WhatsApp messages (text, audio, photos, videos) into structured financial records. Its core purpose is to provide users with a comprehensive financial dashboard for visualizing income, expenses, credit cards, and financial trends, alongside manual transaction management. The project aims to offer a seamless and intuitive financial tracking experience through AI-driven data processing.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Technology Stack**: React with TypeScript, Vite, TailwindCSS, Shadcn UI (Radix UI primitives).
- **Design System**: Adheres to Material Design 3 principles for financial layouts, mobile-first responsive design, HSL-based CSS variables for theming, Inter for primary typography, JetBrains Mono for financial values, and full dark mode support. All Button components use design-system variants (no custom gradients).
- **State Management**: TanStack Query (React Query) for server state, TabContext for instant navigation state, custom hooks for authentication and UI state, React Hook Form with Zod for form management.
- **Navigation Architecture**: 
  - **Mobile Navigation**: Fixed bottom navigation bar (BottomNavigation.tsx) with 8 icon-based tabs for mobile devices (hidden on desktop)
  - **Desktop Navigation**: Top NavBar with horizontal tabs, period selector, and theme toggle
  - **Zero Reload Navigation**: All pages mounted simultaneously, TabContext controls visibility via CSS `display: none/block` for instant switching
  - **Responsive Design**: Mobile-first approach with bottom tabs (sm and below) and top tabs (lg and above)
- **Reusable Card Components**: 
  - **StatCard**: Summary cards with icons, labels, values, and trends (used in Dashboard, Transações)
  - **ProgressCard**: Progress bars with usage percentages (used in Orçamento, Cartões)
  - **MetricCard**: Metric displays with icons and subtitles (used in Economias, Metas, Insights)
- **Redesigned Pages**: All 8 pages (Dashboard, Transações, Economias, Orçamento, Metas, Cartões, Insights, Configurações) feature mobile-first layouts with summary cards, CTA buttons, and interactive lists.
- **Period Filtering System**: Comprehensive month-based filtering system integrated with React Query caching, all analytics endpoints include period parameter.
- **Notification Preferences**: User-configurable notification settings (budget alerts, card due dates, weekly insights, goals achieved) stored in database with toggle UI in Configurações.
- **Mobile UX**: Bottom navigation, responsive card layouts, optimized touch targets, comprehensive data-testid attributes for testing.

### Backend
- **Technology Stack**: Express.js with TypeScript.
- **API Structure**: RESTful endpoints under `/api`, using session-based authentication.
- **Authentication Flow**: Email+password for web dashboard, with initial user creation and password management handled via WhatsApp interaction.
- **AI Processing Pipeline**: Processes WhatsApp messages (transcription, OCR), extracts financial data using GPT-5, and records transactions with confidence scores.
- **Rate Limiting**: Implemented for WhatsApp messages (10 messages/minute per phone number).
- **Financial Logic**: 
  - **Three transaction types**: 'entrada' (income), 'saida' (expenses), 'economia' (savings)
  - **Balance formula**: Saldo = Receitas - Despesas - Economias (savings reduce available balance, not counted as income)
  - **Auto-update goals**: When creating tipo='economia' with goalId, automatically updates metas.valorAtual and marks concluida=true when target reached
  - **Variation calculations**: Handles edge cases like zero previous values (returns ±100% for clear growth/decline indication)
- **Analytics Functions**: Provides endpoints for `period-summary` (includes totalEconomias, variacaoSaldo), `monthly-comparison`, `expenses-by-category`, `income-by-category`, and `yearly-evolution`, all user-scoped and returning calculated financial insights.

### Data Storage
- **Database**: PostgreSQL via Neon (serverless) with Drizzle ORM.
- **Schema**: Includes `users`, `purchases`, `transacoes` (financial transactions), `cartoes` (credit cards), `faturas` (invoices), `cartao_transacoes`, and `sessions`.
- **Data Access**: Storage abstraction layer with user-scoped queries and transactional operations.

### Authentication and Authorization
- **Replit Auth Integration**: OAuth 2.0 / OpenID Connect flow with PostgreSQL session storage and HTTPS-only cookies.
- **User Session Management**: Database-stored sessions, cached user info, token refresh, and automatic user creation/update.
- **Authorization**: Route-level protection via `isAuthenticated` middleware, ensuring all queries are scoped to the authenticated user's ID.

## External Dependencies
- **OpenAI API**: For AI-powered financial transaction classification and data extraction (GPT-5).
- **WhatsApp Business API**: For message reception, processing, and media handling.
- **Neon Database**: Serverless PostgreSQL hosting.
- **Recharts**: For rendering financial visualizations.
- **date-fns**: For date formatting and calculations.
- **Zod**: For schema validation.
- **Radix UI**: Primitives for UI components.
- **Vite & esbuild**: For frontend and backend bundling.