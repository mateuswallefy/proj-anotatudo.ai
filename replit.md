# AnotaTudo.AI - Replit Development Guide

## Overview
AnotaTudo.AI is a SaaS financial management platform that leverages AI to transform WhatsApp messages (text, audio, photos, videos) into structured financial records. Its core purpose is to provide users with a comprehensive financial dashboard for visualizing income, expenses, credit cards, and financial trends, alongside manual transaction management. The project aims to offer a seamless and intuitive financial tracking experience through AI-driven data processing.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Technology Stack**: React with TypeScript, Vite, TailwindCSS, Shadcn UI (Radix UI primitives).
- **Design System**: Adheres to Material Design 3 principles for financial layouts, mobile-first responsive design, HSL-based CSS variables for theming, Inter for primary typography, JetBrains Mono for financial values, and full dark mode support.
- **State Management**: TanStack Query (React Query) for server state, custom hooks for authentication and UI state, React Hook Form with Zod for form management.
- **Routing**: Wouter for client-side routing with protected authentication-based routes.
- **Instant Tab Navigation**: Pages remain mounted using `display: none/block` for smooth transitions without loading states.
- **Premium Analytics Dashboard**: Features redesigned components like PeriodSummaryCards, MonthlyComparisonChart, ExpensesByCategoryChart, IncomeByCategoryChart, and YearlyEvolutionChart, incorporating glassmorphism and smooth animations with a modern Material Design 3 color palette.
- **Period Filtering System**: Comprehensive month-based filtering system integrated with URL synchronization and React Query caching, allowing users to view transactions and analytics for any specific month.
- **Mobile UX Enhancements**: Includes improved navigation (larger tap targets, visible logo), responsive transaction list (card layout on mobile), and a Floating Action Button (FAB) for quick transaction creation.

### Backend
- **Technology Stack**: Express.js with TypeScript.
- **API Structure**: RESTful endpoints under `/api`, using session-based authentication.
- **Authentication Flow**: Email+password for web dashboard, with initial user creation and password management handled via WhatsApp interaction.
- **AI Processing Pipeline**: Processes WhatsApp messages (transcription, OCR), extracts financial data using GPT-5, and records transactions with confidence scores.
- **Rate Limiting**: Implemented for WhatsApp messages (10 messages/minute per phone number).
- **Analytics Functions**: Provides endpoints for `period-summary`, `monthly-comparison`, `expenses-by-category`, `income-by-category`, and `yearly-evolution`, all user-scoped and returning calculated financial insights.

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