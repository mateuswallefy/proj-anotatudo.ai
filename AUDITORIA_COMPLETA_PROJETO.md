# AUDITORIA COMPLETA - AnotaTudo.AI

## FASE 0 - RESUMO DA ARQUITETURA ATUAL

### 📁 Estrutura do Frontend (client/src)

#### Páginas (`pages/`)
- **dashboard.tsx**: Dashboard premium com componentes novos (DashboardShell, DashboardKpis, DashboardMainChart, etc)
- **transacoes.tsx**: Lista de transações com criação/edição, busca básica, filtro por período
- **economias.tsx**: Visualização de economias, criação de economia vinculada a meta
- **metas.tsx**: CRUD de metas, visualização de progresso
- **orcamento.tsx**: Orçamentos por categoria (spending limits), criação/edição
- **cartoes.tsx**: Lista de cartões de crédito, criação, visualização de faturas
- **insights.tsx**: Visualização de insights gerados por IA, botão para gerar novos
- **configuracoes.tsx**: Perfil, senha, notificações, membros compartilhados, tema
- **admin/**: Páginas administrativas (clientes, assinaturas, eventos, webhooks, health)

#### Componentes (`components/`)
- **dashboard/**: Componentes premium do dashboard (KpiCard, DashboardMainChart, DashboardGoals, etc)
- **ui/**: Componentes shadcn/ui (Button, Dialog, Form, etc)
- **design-system/**: Componentes de design system (AppCard, PageHeader, PremiumButton, etc)
- **cards/**: Cards reutilizáveis (MetricCard, StatCard, ProgressCard)
- **layout/**: Componentes de layout (MobileHeader, PeriodSelectorBar)

#### Contexts (`contexts/`)
- **PeriodContext.tsx**: Gerencia período ativo (YYYY-MM), sincronizado com URL
- **TabContext.tsx**: Gerencia aba ativa (dashboard, transacoes, etc)
- **ThemeContext.tsx**: Gerencia tema claro/escuro

#### Hooks (`hooks/`)
- **useAuth.ts**: Hook de autenticação
- **use-toast.ts**: Hook para toasts
- **use-mobile.tsx**: Hook para detectar mobile

### 🔌 Principais Rotas do Backend (`server/routes.ts`)

#### Transações
- `GET /api/transacoes?period=YYYY-MM` - Lista transações do período
- `POST /api/transacoes` - Cria transação
- `PATCH /api/transacoes/:id` - Atualiza transação
- `DELETE /api/transacoes/:id` - Deleta transação

#### Metas (Goals)
- `GET /api/goals` - Lista todas as metas do usuário
- `POST /api/goals` - Cria meta
- `PATCH /api/goals/:id` - Atualiza meta
- `PATCH /api/goals/:id/status` - Atualiza status da meta
- `DELETE /api/goals/:id` - Deleta meta

#### Orçamentos (Spending Limits)
- `GET /api/spending-limits?period=YYYY-MM` - Lista orçamentos do período
- `POST /api/spending-limits` - Cria orçamento
- `PATCH /api/spending-limits/:id` - Atualiza orçamento
- `DELETE /api/spending-limits/:id` - Deleta orçamento

#### Cartões de Crédito
- `GET /api/cartoes` - Lista cartões
- `POST /api/cartoes` - Cria cartão
- `PATCH /api/cartoes/:id` - Atualiza cartão
- `DELETE /api/cartoes/:id` - Deleta cartão
- `GET /api/credit-cards/overview?year=X&month=Y` - Overview dos cartões

#### Analytics
- `GET /api/analytics/period-summary?period=YYYY-MM` - Resumo do período
- `GET /api/analytics/expenses-by-category?period=YYYY-MM` - Despesas por categoria
- `GET /api/analytics/income-by-category?period=YYYY-MM` - Receitas por categoria
- `GET /api/analytics/monthly-comparison` - Comparação mensal
- `GET /api/analytics/yearly-evolution` - Evolução anual

#### Dashboard
- `GET /api/dashboard/overview?year=X&month=Y` - Overview do dashboard (KPIs)

#### Insights
- `GET /api/insights-ai` - Lista insights gerados
- `POST /api/insights-ai/generate` - Gera novos insights (se existir)

#### Configurações
- `GET /api/notification-preferences` - Preferências de notificação
- `POST /api/notification-preferences` - Atualiza preferências
- `POST /api/user/change-password` - Altera senha
- `POST /api/user/upload-avatar` - Upload de avatar

### 🗄️ Principais Entidades do Banco (`shared/schema.ts`)

#### Transações (`transacoes`)
- id, userId, tipo ('entrada' | 'saida' | 'economia')
- categoria, valor, dataReal, dataRegistro
- origem ('texto' | 'audio' | 'foto' | 'video' | 'manual')
- descricao, mediaUrl
- cartaoId (FK), goalId (FK)

#### Metas (`goals`)
- id, userId, nome, descricao
- valorAlvo, valorAtual
- dataInicio, dataFim
- prioridade ('baixa' | 'media' | 'alta')
- status ('ativa' | 'concluida' | 'cancelada')

#### Orçamentos (`spending_limits`)
- id, userId, tipo ('mensal_total' | 'mensal_categoria')
- categoria (nullable), valorLimite
- mes, ano (nullable para permanente)
- ativo ('sim' | 'nao')

#### Cartões (`cartoes`)
- id, userId, nomeCartao
- limiteTotal, limiteUsado
- diaFechamento, diaVencimento
- bandeira ('visa' | 'mastercard' | 'elo' | 'american-express' | 'outro')

#### Faturas (`faturas`)
- id, cartaoId, mes, ano
- valorFechado, status ('aberta' | 'paga' | 'vencida')
- dataFechamento, dataPagamento

#### Economias Mensais (`monthly_savings`)
- id, userId, year, month
- targetAmount, savedAmount

#### Insights (`insights`)
- id, userId, tipoInsight
- titulo, descricao
- valorImpacto, percentualImpacto
- acaoSugerida, relevancia

---

## 📋 ANÁLISE POR PÁGINA

### 1. DASHBOARD (`pages/dashboard.tsx`)

**O que faz hoje:**
- Exibe KPIs (entradas, despesas, economias, saldo) via `/api/dashboard/overview`
- Gráfico principal (DashboardMainChart) - tenta buscar `/api/dashboard/chart-data` (pode não existir)
- Metas ativas via `/api/goals`
- Orçamentos via `/api/budgets?year=X&month=Y`
- Cartões via `/api/credit-cards/overview`
- Insights via `/api/insights-ai`
- Últimas transações via `/api/transacoes?period=YYYY-MM`

**Problemas identificados:**
- ❌ Dados mockados no DashboardMainChart (fallback quando API não existe)
- ❌ DashboardInsights usa dados mock se API retornar null
- ❌ Não há cálculo inteligente em memória (depende 100% do backend)
- ❌ KPIs não são clicáveis para filtrar
- ❌ Não há transação rápida direto do dashboard
- ❌ Não há interação com metas (adicionar aporte)
- ❌ Layout mobile pode melhorar (já tem DashboardShell responsivo)

### 2. TRANSAÇÕES (`pages/transacoes.tsx`)

**O que faz hoje:**
- Lista transações do período atual
- Busca por texto (client-side)
- Criação de transação (dialog)
- Edição de transação (dialog)
- Exibição em cards/lista

**Problemas identificados:**
- ❌ Filtros limitados (apenas período via PeriodContext e busca texto)
- ❌ Falta filtro por tipo (entrada/despesa/economia)
- ❌ Falta filtro por categoria
- ❌ Falta filtro por conta/cartão
- ❌ Falta filtro por valor (min/max)
- ❌ Não há paginação ou infinite scroll
- ❌ Layout mobile pode melhorar (cards empilhados)
- ❌ Empty state básico
- ❌ Não há exportação

### 3. ECONOMIAS (`pages/economias.tsx`)

**O que faz hoje:**
- Visualiza economias (transações tipo 'economia')
- Cria economia vinculada a meta
- Mostra gráficos de receitas/despesas por categoria
- Resumo do período

**Problemas identificados:**
- ⚠️ Mistura conceitos: "economias" são transações tipo 'economia', mas também há metas
- ❌ Não há separação clara entre "potes de economia" e "metas"
- ❌ Falta visualização de aportes recentes
- ❌ Layout pode melhorar no mobile

### 4. METAS (`pages/metas.tsx`)

**O que faz hoje:**
- CRUD completo de metas
- Visualização de progresso
- Filtro por status (ativa/concluida/cancelada)

**Problemas identificados:**
- ❌ Não há forma de adicionar aporte direto na página
- ❌ Não há lista de aportes recentes por meta
- ❌ Layout pode melhorar no mobile

### 5. ORÇAMENTO (`pages/orcamento.tsx`)

**O que faz hoje:**
- Lista orçamentos por categoria do período
- Criação de orçamento por categoria
- Visualização de % usado vs limite
- Cards de resumo (disponível, gasto, excedido)

**Problemas identificados:**
- ✅ Funciona bem, mas pode melhorar:
  - ❌ Não há edição de orçamento existente
  - ❌ Não há exclusão de orçamento
  - ❌ Layout mobile pode melhorar

### 6. CARTÕES (`pages/cartoes.tsx`)

**O que faz hoje:**
- Lista cartões
- Criação de cartão
- Visualização de limite usado vs total

**Problemas identificados:**
- ❌ Não há edição de cartão
- ❌ Não há exclusão de cartão
- ❌ Não há visualização detalhada de fatura
- ❌ Não há adição de despesa vinculada ao cartão
- ❌ Layout mobile pode melhorar

### 7. INSIGHTS (`pages/insights.tsx`)

**O que faz hoje:**
- Lista insights via `/api/insights-ai`
- Botão para gerar novos (mas endpoint pode não existir)
- Filtro por tipo de insight
- Cards de métricas

**Problemas identificados:**
- ⚠️ Endpoint `POST /api/insights-ai/generate` pode não existir
- ❌ Não há empty state quando não há insights
- ❌ Layout mobile pode melhorar

### 8. CONFIGURAÇÕES (`pages/configuracoes.tsx`)

**O que faz hoje:**
- Upload de avatar
- Alteração de senha
- Preferências de notificação
- Membros compartilhados
- Tema

**Problemas identificados:**
- ❌ Falta configurações financeiras (moeda, início do mês, etc)
- ❌ Falta configurações de exibição (se saldo considera economias, etc)
- ❌ Layout mobile pode melhorar

### 9. ADMIN

**Status:** Funcional, não será alterado nesta refatoração.

---

## 🎯 PRÓXIMOS PASSOS

1. **FASE 1**: Alinhar tipos/interfaces e garantir APIs REST completas
2. **FASE 2**: Criar hook `useDashboardData` centralizado
3. **FASE 3**: Adicionar interações diretas no dashboard
4. **FASE 4**: Reestruturar Transações com filtros avançados
5. **FASE 5**: Reestruturar Economias, Metas, Orçamento, Cartões
6. **FASE 6**: Completar Insights
7. **FASE 7**: Reformular Configurações
8. **FASE 8**: Mobile-first e performance
9. **FASE 9**: Relatório final

