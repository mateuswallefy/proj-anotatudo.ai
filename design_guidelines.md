# AnotaTudo.AI - Design Guidelines

## Design Approach

**System**: Material Design 3 (Material You) com estética sênior moderna
**Rationale**: Dashboard financeiro sofisticado que combina data density com visual refinado. Material 3 fornece base sólida, mas elevamos com gradientes sutis, microinterações suaves e paleta contemporânea.

**Core Principles**:
- **Sofisticação Visual**: Gradientes, sombras e elevação cuidadosamente aplicados
- **Clareza de Dados**: Informação sempre prioritária, mas apresentada belamente
- **Fluidez**: Animações e transições suaves (300-400ms)
- **Modernidade**: Paleta atual, tipografia refinada, componentes com personalidade

---

## Color System - Material 3 Modern Palette

**Primary (Esmeralda)**:
- Base: `#0F9D58` (Green 600)
- Usado para: CTAs principais, estados positivos, receitas, sucesso

**Secondary (Teal)**:
- Base: `#0AA298` (Teal 600)
- Usado para: Destaques secundários, hover states, links

**Accent (Laranja Quente)**:
- Base: `#F2994A` (Orange 500)
- Usado para: Alertas, despesas, urgência moderada

**Neutral Palette (Azulado Sofisticado)**:
- Background: `#FAFBFC` (light) / `#0F1419` (dark)
- Surface: `#FFFFFF` (light) / `#1A1F26` (dark)
- Border: `#E1E8ED` (light) / `#2D333B` (dark)
- Text Primary: `#0F1419` (light) / `#F0F6FC` (dark)
- Text Secondary: `#57606A` (light) / `#8B949E` (dark)
- Text Tertiary: `#8B949E` (light) / `#6E7681` (dark)

**Semantic Colors**:
- Success: `#0F9D58` (Esmeralda)
- Warning: `#F59E0B` (Amber 500)
- Danger: `#DC2626` (Red 600)
- Info: `#0AA298` (Teal)

**Chart Palette** (6 cores harmônicas):
1. `#0F9D58` - Esmeralda (receitas)
2. `#F2994A` - Laranja (despesas)
3. `#0AA298` - Teal (investimentos)
4. `#8B5CF6` - Roxo (lazer)
5. `#EC4899` - Rosa (compras)
6. `#3B82F6` - Azul (saúde)

---

## Typography

**Font Family**: 
- **Primary**: Inter (400, 500, 600, 700) - Geométrica moderna
- **Monospace**: JetBrains Mono (500, 600) - Para valores financeiros
- **Fallback**: system-ui, -apple-system, sans-serif

**Hierarchy**:
- **Page Titles**: text-3xl font-bold tracking-tight (30px)
- **Section Headers**: text-xl font-semibold (20px)
- **Card Titles**: text-lg font-medium (18px)
- **Body Text**: text-base font-normal (16px)
- **Supporting Text**: text-sm font-normal (14px)
- **Captions/Labels**: text-xs font-medium tracking-wide uppercase (12px)
- **Financial Values**: JetBrains Mono text-2xl font-semibold tabular-nums (24px)
  - Use `tabular-nums` para alinhamento perfeito em tabelas
  - Use `font-feature-settings: "tnum"` para números tabulares

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

**Horizontal NavBar** (Lasy.AI style):
- Fixed position at top with subtle shadow/border-bottom
- Height: h-16
- Structure:
  - Logo (left): AnotaTudo.AI wordmark
  - Horizontal tabs (center): Dashboard, Transações, Economias, Orçamento, Metas, Cartões, Insights, Configurações
  - Controls (right): Period selector (month dropdown) + Theme toggle
- Tab Behavior:
  - Active state: border-b-2 border-primary + text-primary
  - Inactive state: text-muted-foreground + hover:text-foreground
  - Zero page reload (all pages mounted, display toggled via TabContext)
  - Smooth instant switching between tabs
- Mobile: Scrollable horizontal tabs or hamburger menu with drawer

### Dashboard Cards

**Monthly Summary Cards (CardsMensais)** (4-column grid on desktop):
- Glassmorphism design with subtle gradients
- Padding: p-6
- Structure: 
  - Header: Icon (lucide-react) + Label (text-xs uppercase tracking-wide)
  - Value: text-3xl font-bold JetBrains Mono tabular-nums
  - Footer: Badge showing % change vs previous month
- Cards: ENTRADAS, DESPESAS, ECONOMIAS, SALDO DO MÊS
- Data source: /api/analytics/period-summary
- Height: h-32
- Colors:
  - ENTRADAS: Success/green tones
  - DESPESAS: Warning/orange tones
  - ECONOMIAS: Info/blue tones
  - SALDO DO MÊS: Primary/emerald tones

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

## Data Visualization - Modern Chart Design

**Philosophy**: Gráficos devem ser **belos E informativos**. Cada elemento visual tem propósito.

### General Chart Principles

1. **Gradientes Suaves**: Sempre use gradientes com opacidade 0.6 → 0 (não flat colors)
2. **Animações Fluidas**: 400ms com easing `easeOutQuad` ou `easeInOut`
3. **Grid Discreto**: Linhas de grid 1px com opacidade 0.1 (mal perceptíveis)
4. **Tooltips Custom**: Glassmorphism com `bg-card/80 backdrop-blur-md`
5. **Espaçamento Generoso**: padding interno de 24-32px em cards de gráficos
6. **Valores em Destaque**: JetBrains Mono 24px semibold para números principais

### Component-Specific Guidelines

#### SpendingSpeedometer → RadialGauge
- **Tipo**: RadialBarChart (Recharts)
- **Estrutura**: 
  - Gauge circular com marcador central mostrando % usado
  - Cores dinâmicas: verde (0-50%), amarelo (51-75%), vermelho (76-100%)
  - Background ring suave (opacity 0.1)
  - Gradiente radial no gauge
- **Valores Centrais**: 
  - % principal: 48px JetBrains Mono bold
  - Label "do limite": 14px text-secondary
  - Valor R$: 18px JetBrains Mono medium abaixo
- **Animação**: 600ms com easing custom para "ponteiro" crescer

#### DailyAverageChart → AreaChart com Gradiente
- **Tipo**: AreaChart (Recharts)
- **Estrutura**:
  - Área com gradiente esmeralda (receitas) e laranja (despesas)
  - Curva `monotone` para suavidade
  - Dots animados nos pontos de dados
  - Linha stroke 2-3px
- **Gradiente**: `linearGradient` de cor com alpha 0.6 para alpha 0
- **Grid**: Horizontal apenas, 1px opacity 0.1
- **Tooltip**: Custom glassmorphism mostrando data + valor
- **Animação**: 400ms easeOutQuad

#### WeekdayAnalysis → Bar Chart Material
- **Tipo**: BarChart (Recharts)
- **Estrutura**:
  - Barras arredondadas (radius 8px no topo)
  - Gradiente vertical sutil em cada barra
  - Espaçamento entre barras: 20%
  - Eixo X com labels do dia da semana
- **Cores**: Gradiente de primary para darker primary
- **Hover**: Barra eleva ligeiramente (transform scale 1.05)
- **Animação**: 300ms com stagger effect (uma barra por vez)

#### CategoryRanking → Lista com Sparklines
- **Tipo**: Lista customizada com mini BarChart inline
- **Estrutura**:
  - Cada linha: Ícone circular + Nome + Sparkline + Valor + %
  - Ícone: 40x40px bg tonal (primary/5) com ícone lucide
  - Sparkline: Mini BarChart 80x24px mostrando evolução
  - Barra de progresso sutil mostrando % do total
- **Cores**: Cada categoria tem cor da palette de charts
- **Interação**: Hover eleva linha inteira
- **Badges**: Número de transações em badge pill

#### InsightsCards → Superfícies Tonais
- **Tipo**: Cards customizados
- **Estrutura**:
  - Background tonal (bg-primary/5 ou bg-accent/5)
  - Ícone em container circular 48x48px com shadow-sm
  - Label em uppercase tracking-wide text-xs
  - Valor principal 28px JetBrains Mono bold
  - Badge de variação (+12%) com seta (↑/↓)
- **Variação Badge**:
  - Verde se positivo (receitas) ou negativo (despesas)
  - Vermelho se negativo (receitas) ou positivo (despesas)
  - Rounded-full px-2 py-1
- **Borda**: Sutil 1px border-primary/20
- **Hover**: Eleva com shadow-md transition 200ms

### Recharts Configuration Defaults

```typescript
// Animações
animationDuration={400}
animationEasing="ease-out"

// Margens consistentes
margin={{ top: 20, right: 30, left: 20, bottom: 20 }}

// Grid suave
stroke="hsl(var(--border))"
strokeOpacity={0.1}
strokeDasharray="3 3"

// Tooltip custom
content={<CustomTooltip />}
cursor={{ fill: 'hsl(var(--accent) / 0.1)' }}

// ResponsiveContainer sempre
<ResponsiveContainer width="100%" height={350}>
  ...
</ResponsiveContainer>
```

### Gradientes Recharts Template

```typescript
<defs>
  <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stopColor="#0F9D58" stopOpacity={0.6}/>
    <stop offset="95%" stopColor="#0F9D58" stopOpacity={0}/>
  </linearGradient>
  <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stopColor="#F2994A" stopOpacity={0.6}/>
    <stop offset="95%" stopColor="#F2994A" stopOpacity={0}/>
  </linearGradient>
</defs>
```

---

## Responsive Behavior

**Breakpoints**:
- Mobile: < 768px (single column, stack all cards)
- Tablet: 768px - 1024px (2 columns for stats, sidebar hidden)
- Desktop: > 1024px (full layout with sidebar)

**Mobile Adaptations**:
- Horizontal tabs become scrollable or hamburger menu
- Cards stack vertically (1 column)
- Table becomes card list
- Charts: Reduce height, simplify legends
- Period selector moves to top of page on mobile

---

## Animations

**Minimal use only**:
- Page transitions: Simple fade (150ms)
- Dropdown/Modal: Slide and fade (200ms)
- Loading states: Skeleton screens (no spinners)
- Number updates: Count-up animation for financial values (500ms)