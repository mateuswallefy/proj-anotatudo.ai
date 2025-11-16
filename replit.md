# AnotaTudo.AI - Replit Development Guide

## Overview
AnotaTudo.AI is a SaaS financial management platform that transforms WhatsApp messages into structured financial records using AI. It allows users to send financial data via WhatsApp (text, audio, photos, videos) which is then categorized and organized into a comprehensive financial dashboard. The platform provides tools for visualizing income, expenses, credit cards, and financial trends, alongside manual transaction management. The project aims to provide a seamless and intuitive financial tracking experience, leveraging AI for automatic data processing.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Technology Stack**: React with TypeScript, Vite, TailwindCSS, Shadcn UI (Radix UI primitives).
- **Component System**: Utilizes Shadcn UI, adhering to Material Design 3 principles for financial layouts. Responsive design is mobile-first.
- **State Management**: TanStack Query (React Query) for server state, custom hooks for authentication and UI state, React Hook Form with Zod for form management.
- **Routing**: Wouter for client-side routing, with protected routes based on authentication.
- **Design System**: HSL-based CSS variables for theming, Inter for primary typography, JetBrains Mono for financial values, with full dark mode support.
- **Instant Tab Navigation**: Pages remain mounted, using `display: none/block` for switching, eliminating loading states and prefetching data with React Query.
- **Material Design 3 Dashboard Redesign**: Features a modern color palette (Emerald, Teal, Orange), enhanced typography, and redesigned components like SpendingSpeedometer, DailyAverageChart, WeekdayAnalysis, CategoryRanking, and InsightsCards, incorporating glassmorphism and smooth animations.

## Premium Analytics Dashboard (November 16, 2025)

### New Analytics Endpoints
- **`/api/analytics/period-summary`**: Returns total income, total expenses, and period balance with month-over-month percentage variations. Aggregates current month vs previous month.
- **`/api/analytics/monthly-comparison`**: Provides 12-month comparison of revenues vs expenses with Portuguese month names (e.g., "Jan/25"). Each entry includes `mes`, `receitas`, `despesas`, and `saldo`.
- **`/api/analytics/expenses-by-category`**: Category breakdown with totals, percentages, transaction counts, and assigned colors. Top categories sorted by total amount.
- **`/api/analytics/income-by-category`**: Income source distribution with same structure as expenses.
- **`/api/analytics/yearly-evolution`**: Monthly progression for the current year showing revenues, expenses, and balance evolution.

### Premium Dashboard Components

#### PeriodSummaryCards
Three large cards displaying Total Income, Total Expenses, and Period Balance.
- Material Design 3 gradients: emerald (#0F9D58), orange (#F2994A), teal/red (#0AA298 / #EF4444)
- Tonal surfaces with HSL alpha 0.05-0.15
- Circular icons (48px: DollarSign, Wallet, PiggyBank)
- Month-over-month variation with TrendingUp/Down icons
- Hover elevation effects (hover-elevate, active-elevate-2)
- Data-testid: `period-summary-cards`, `summary-card-{index}`

#### MonthlyComparisonChart
Dual-bar chart comparing income vs expenses over 12 months.
- Vertical gradients: emerald for income, orange for expenses (5%→95% opacity)
- 8px rounded bar tops
- Glassmorphism tooltip showing receitas, despesas, and calculated saldo
- Currency-formatted Y-axis (R$ x.xxx)
- Legend with circle icons
- 600ms ease-out animations
- Data-testid: `monthly-comparison-chart`

#### ExpensesByCategoryChart
PieChart with percentage distribution and color-coded categories.
- Custom color per category (12-color palette, modulo for overflow)
- Percentage labels on slices (only shown if >5%)
- Glassmorphism tooltip: total, percentage, transaction count
- Legend with abbreviated percentages
- Bottom grid showing top 4 categories with color dots
- 800ms ease-out animation
- Data-testid: `expenses-by-category-chart`

#### IncomeByCategoryChart
DonutChart with centered total display.
- Inner radius: 90px, outer radius: 140px, padding angle: 2px
- Centered total amount in emerald color (#0F9D58)
- Full category breakdown grid below chart
- Glassmorphism tooltip with all metrics
- 800ms ease-out animation
- Data-testid: `income-by-category-chart`

#### YearlyEvolutionChart
ComposedChart with dual areas and trend line.
- Dual area charts: emerald (#0F9D58) for income, orange (#F2994A) for expenses
- Gradient fills (60%→0% opacity)
- 3px stroke width for areas
- Dashed trend line for balance (teal #0AA298, 2px stroke, 5-5 dash)
- Month abbreviations on X-axis (Jan, Fev, Mar...)
- Glassmorphism tooltip with receitas, despesas, and calculated saldo
- 800-1000ms staggered animations
- Data-testid: `yearly-evolution-chart`

### Dashboard Layout
1. Period summary cards at top (3-column grid: `grid-cols-1 md:grid-cols-3`)
2. Monthly comparison chart (full width)
3. Category charts side-by-side (2-column grid: `grid-cols-1 lg:grid-cols-2`)
4. Yearly evolution chart (full width)
5. Legacy insights and analysis components below
6. Responsive: mobile (1 col), tablet (2 col), desktop (3 col)

## Mobile UX Enhancements (November 16, 2025)

### Navigation Improvements
- **SidebarTrigger**: Enlarged to 44x44px on mobile (h-11 w-11) vs 36x36px desktop for better tap targets
- **Header Logo**: "AnotaTudo.AI" text visible in header when sidebar is closed (md:hidden)
- **Menu Items**: Increased to 48px height (h-12), icons 20px (w-5 h-5), text-base font
- **Avatar**: Sized at 48px (h-12 w-12)
- **Logout Button**: Sized at 44px (h-11 w-11) for adequate tap target

### Transaction List Responsive Design
- **Desktop (≥md)**: Table layout maintained with 7 columns including new "Ações" column
- **Mobile (<md)**: Card layout with optimized spacing:
  - Icon + badge at top left
  - Value prominently displayed at top right
  - Description truncated with line-clamp-2
  - Date + origin badge at bottom
  - Edit button positioned absolute (top-2 right-2, h-8 w-8)
  - Cards separated with space-y-3
- **Badges**: Reduced to text-xs px-2 py-0.5 for mobile compactness

### Floating Action Button (FAB)
- **Component**: fab.tsx with wouter navigation
- **Position**: Rendered once in App.tsx (outside route display:none wrappers) to ensure consistent visibility
- **Size**: 56x56px (h-14 w-14) exceeding WCAG 44px minimum
- **Styling**: Inline styles (position: fixed, bottom: 24px, right: 24px, zIndex: 50, pointerEvents: 'auto') to prevent Shadcn Button overrides
- **Visibility**: Visible on all screen sizes (mobile and desktop) for quick transaction creation
- **Target**: Routes to /adicionar
- **Data-testid**: button-fab
- **Accessibility**: Always clickable even with sidebar/dialogs open (pointerEvents: 'auto')

### Transaction CRUD System
**Storage Layer (server/storage.ts):**
- `updateTransacao(id, userId, updates)`: User-scoped update with AND clause
- `deleteTransacao(id, userId)`: User-scoped delete with AND clause

**Backend Routes (server/routes.ts):**
- `PATCH /api/transacoes/:id`: Validates Zod schema, enforces userId ownership
- `DELETE /api/transacoes/:id`: User-scoped deletion with 404 for non-existent/unauthorized

**Frontend Component (edit-transaction-dialog.tsx):**
- Full form with tipo, categoria, valor, descrição, dataReal
- Update mutation invalidates: /api/transacoes, /api/insights, and all 5 analytics endpoints
- Delete confirmation via AlertDialog
- Data-testids: form-edit-transaction, button-update-transaction, button-delete-transaction, button-confirm-delete

**UI Integration:**
- Desktop: Edit button in "Ações" column (data-testid="button-edit-transaction-{id}")
- Mobile: Edit button absolute positioned in cards (data-testid="button-edit-transaction-mobile-{id}")

### Layout Fixes
- Added `w-full` to `<main>` and route wrapper divs in App.tsx to fix mobile rendering issues with instant tab navigation

### Backend Analytics Functions (server/analytics.ts)
- **`getPeriodSummary(userId)`**: Aggregates transactions from current month and previous month. Calculates totals and percentage variations with zero-safe guards.
- **`getMonthlyComparison(userId)`**: Fetches last 12 months of transactions, groups by month, formats with Portuguese names.
- **`getExpensesByCategory(userId)`**: Filters expense transactions, groups by category, assigns colors from palette, calculates percentages.
- **`getIncomeByCategory(userId)`**: Same as expenses but for income transactions.
- **`getYearlyEvolution(userId)`**: Groups transactions by month for current year, includes full month names.
- All functions: user-scoped (WHERE userId = $1), zero-safe calculations, predefined 12-color palette.

### Backend
- **Technology Stack**: Express.js with TypeScript.
- **API Structure**: RESTful endpoints under `/api`, using session-based authentication with `connect-pg-simple`.
- **Authentication Flow**:
    - **Email+Password Only**: Traditional login for web dashboard access. No phone-based login.
    - **WhatsApp-to-Database Pipeline**: Initial user creation and password generation occur via WhatsApp interaction.
    - **Password Management**: Initial passwords are cryptographically secure and sent via WhatsApp. Password resets are also handled via WhatsApp for authenticated users.
- **AI Processing Pipeline**: Receives messages from WhatsApp, determines type, processes content (transcription, OCR), extracts structured financial data using GPT-5, and records transactions with a confidence score.
- **Rate Limiting**: Implemented for WhatsApp messages (10 messages/minute per phone number).

### Data Storage
- **Database**: PostgreSQL via Neon (serverless) with Drizzle ORM.
- **Schema**:
    - `users`: User profiles with WhatsApp-based authentication and plan status.
    - `purchases`: Records from Caktos payment platform, linking purchases to users.
    - `transacoes`: Financial transactions (income/expense) with categories, origin tracking, and AI confidence scores.
    - `cartoes`: Credit card details, including limits and billing cycles.
    - `faturas`: Invoices linked to credit cards, tracking status and amounts.
    - `cartao_transacoes`: Links transactions to invoices and manages installments.
    - `sessions`: Stores authentication sessions.
- **Data Access**: Storage abstraction layer with user-scoped queries and transactional operations.

### Authentication and Authorization
- **Replit Auth Integration**: OAuth 2.0 / OpenID Connect flow with PostgreSQL session storage and HTTPS-only cookies.
- **User Session Management**: Sessions stored in the database, user info cached, with token refresh and automatic user creation/update.
- **Authorization**: Route-level protection via `isAuthenticated` middleware, ensuring all queries are scoped to the authenticated user's ID.

## External Dependencies
- **OpenAI API**: Utilized for AI-powered financial transaction classification and data extraction (GPT-5).
- **WhatsApp Business API**: Planned integration for message reception, processing, and media handling.
- **Neon Database**: Serverless PostgreSQL hosting.
- **Recharts**: For rendering financial visualizations.
- **date-fns**: For date formatting and calculations.
- **Zod**: For schema validation.
- **Radix UI**: Primitives for UI components.
- **Vite & esbuild**: For frontend and backend bundling, respectively.