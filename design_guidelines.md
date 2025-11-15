# AnotaTudo.AI - Design Guidelines

## Design Approach

**System**: Material Design 3 (Material You)
**Rationale**: Financial dashboard requiring data-dense layouts, robust component library, and proven patterns for tables, charts, and forms. Material Design provides excellent hierarchy for complex information architecture while maintaining accessibility and modern aesthetics.

**Core Principles**:
- Information clarity over visual flair
- Consistent, predictable interactions
- Data-first presentation
- Professional trustworthiness

---

## Typography

**Font Family**: Inter (via Google Fonts)
- Primary: Inter (400, 500, 600, 700)
- Monospace: JetBrains Mono (for financial values)

**Hierarchy**:
- Page Titles: text-3xl font-bold (30px)
- Section Headers: text-xl font-semibold (20px)
- Card Titles: text-lg font-medium (18px)
- Body Text: text-base font-normal (16px)
- Supporting Text: text-sm font-normal (14px)
- Captions/Labels: text-xs font-medium (12px)
- Financial Values: Use JetBrains Mono, font-semibold

---

## Layout System

**Spacing Primitives**: Tailwind units of **2, 4, 6, 8, 12, 16**
- Component padding: p-4, p-6, p-8
- Section gaps: gap-4, gap-6, gap-8
- Margins: m-2, m-4, m-6
- Card spacing: p-6 standard, p-8 for main containers

**Grid System**:
- Dashboard: 12-column responsive grid
- Desktop (lg): 3-4 column layouts for stat cards
- Tablet (md): 2 column layouts
- Mobile (base): Single column stack

**Container Widths**:
- Main dashboard: max-w-7xl mx-auto
- Full-width sections: w-full with inner constraints
- Forms: max-w-2xl centered

---

## Component Library

### Navigation

**Top App Bar**:
- Fixed position with shadow/border-bottom
- Height: h-16
- Contains: Logo (left), Navigation links (center), User profile + notifications (right)
- Mobile: Hamburger menu with slide-out drawer

**Sidebar** (Desktop only):
- Width: w-64 fixed
- Sections: Dashboard, Transações, Cartões, Adicionar, Configurações
- Active state: filled background with left border accent
- Collapsed state (optional): w-20 with icons only

### Dashboard Cards

**Stat Cards** (4-column grid on desktop):
- Elevated surface (shadow-md)
- Padding: p-6
- Structure: Icon (top-left) + Label (text-sm) + Value (text-2xl font-bold JetBrains Mono) + Change indicator
- Height: h-32

**Chart Cards**:
- Padding: p-8
- Header: Title + period selector (dropdown)
- Use Chart.js or Recharts for visualizations
- Pie chart for categories (6 max visible)
- Line chart for monthly evolution

### Transaction Table

**Table Structure**:
- Sticky header row with sort indicators
- Columns: Data | Categoria | Descrição | Valor | Tipo | Origem | Ações
- Row height: h-14
- Alternating row backgrounds for readability
- Hover state: subtle background shift
- Mobile: Card-based layout (stack columns vertically)

**Filters Bar**:
- Height: h-16
- Contains: Date range picker, Category dropdown, Type radio buttons, Search input
- Sticky below header when scrolling

### Card Management Module

**Card List Item**:
- Horizontal layout: Logo/Icon | Card Name | Limit Bar | Quick Stats | Actions
- Limit Progress Bar: visual indicator of used vs available (rounded-full h-2)
- Expandable to show transaction history
- Height: h-24 collapsed, dynamic expanded

**Card Detail View**:
- Two-column layout (md and up): Card info (left) + Fatura atual (right)
- Limit visualization: Circular progress indicator (large, centered)
- Transaction list within card context

### Forms

**Add Transaction Form**:
- Single column layout, max-w-2xl
- Fields: Tipo (radio), Categoria (select), Valor (number input with R$ prefix), Data (date picker), Descrição (textarea)
- Button placement: right-aligned, primary action prominent
- Field spacing: gap-6 between form groups

**Input Fields**:
- Height: h-12
- Padding: px-4
- Border: border rounded-md
- Label: text-sm font-medium mb-2
- Error states: border-red-500 with text-sm text-red-500 message

### Buttons

**Primary Button**:
- Height: h-10 (compact) or h-12 (standard)
- Padding: px-6
- Font: text-sm font-semibold
- Rounded: rounded-md
- Shadow on hover: hover:shadow-lg

**Secondary/Outline**:
- Same dimensions, border-2 treatment

**Icon Buttons**:
- Size: w-10 h-10
- Rounded: rounded-full
- Centered icon

### Notifications/Alerts

**Toast Notifications**:
- Position: top-right, fixed
- Width: max-w-sm
- Padding: p-4
- Auto-dismiss: 5 seconds
- Types: Success, Error, Warning, Info

**Alert Banner** (for credit limit warnings):
- Full-width below header
- Height: h-12
- Icon + Message + Dismiss button
- Warning style with appropriate urgency

---

## Images

**No hero images required** - this is a dashboard application.

**Supporting Images**:
- Empty states: Illustrations for empty transaction lists, no cards added (use undraw.co style)
- Logo: Clean wordmark + icon in header (h-8)
- Card brand logos: Small icons (w-12 h-8) for Visa, Mastercard, etc.
- User profile: Circular avatar (w-10 h-10)

**Receipt/Invoice Thumbnails**:
- Size: w-16 h-16 or w-20 h-20
- Rounded: rounded-md
- Clickable to expand in modal

---

## Data Visualization

**Charts** (using Chart.js):
- Pie/Doughnut: Category breakdown with legend
- Line: Monthly cash flow (dual-axis for income/expenses)
- Bar: Weekly comparison
- Colors: Use consistent categorical palette (6-8 colors max)

---

## Responsive Behavior

**Breakpoints**:
- Mobile: < 768px (single column, stack all cards)
- Tablet: 768px - 1024px (2 columns for stats, sidebar hidden)
- Desktop: > 1024px (full layout with sidebar)

**Mobile Adaptations**:
- Bottom navigation bar (fixed) replacing sidebar
- Cards stack vertically
- Table becomes card list
- Charts: Reduce height, simplify legends

---

## Animations

**Minimal use only**:
- Page transitions: Simple fade (150ms)
- Dropdown/Modal: Slide and fade (200ms)
- Loading states: Skeleton screens (no spinners)
- Number updates: Count-up animation for financial values (500ms)