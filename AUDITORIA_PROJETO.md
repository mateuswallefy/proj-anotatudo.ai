# 🔍 AUDITORIA COMPLETA - AnotaTudo.AI

**Data:** 29 de Novembro de 2025
**Ambiente:** Replit (DEV + PROD)
**Status:** Em Desenvolvimento

---

## 📋 RESUMO EXECUTIVO

**AnotaTudo.AI** é uma plataforma SaaS de gestão financeira que usa IA para transformar mensagens do WhatsApp (texto, áudio, fotos, vídeos) em registros financeiros estruturados. Oferece um dashboard abrangente com visualização de renda, despesas, cartões de crédito, metas e tendências financeiras.

---

## 🏗️ ARQUITETURA DO PROJETO

### Estrutura Geral
```
workspace/ (DEV)
├── server/                 # Backend Express + TypeScript
├── client/src/             # Frontend React + Vite
├── shared/                 # Schemas compartilhados (Drizzle)
├── public/                 # Assets estáticos
├── .replit                 # Configuração Replit
├── package.json            # Dependencies
├── vite.config.ts          # Configuração Vite
├── drizzle.config.ts       # Configuração ORM
└── tsconfig.json           # Configuração TypeScript
```

### Workflow DEV/PROD (Implementado em 28/11/2025)
```
DEV (eumateus3435/workspace)
  └─ ep-shy-recipe-aco7vd4h (Neon DB)
       ↓ git push
GitHub (proj-anotatudo.ai.git)
       ↓ git pull
PROD (eumateus3435/prod)
  └─ ep-plain-art-acnjwa7b (Neon DB)
```

**Importante:** Cada ambiente tem seu próprio banco de dados Neon isolado. O código fica sincronizado via Git, mas os dados nunca são sincronizados entre ambientes.

---

## 🛠️ TECH STACK

### Backend
- **Runtime:** Node.js 20
- **Framework:** Express.js 4.21.2
- **Linguagem:** TypeScript 5.6.3
- **Banco de Dados:** PostgreSQL Neon (Serverless)
- **ORM:** Drizzle 0.39.1
- **Validação:** Zod + Drizzle-Zod
- **Autenticação:** Session-based (Express-session + Passport)
- **IA:** OpenAI API
- **Upload de Arquivos:** Multer

### Frontend
- **Framework:** React 18.3.1
- **Build Tool:** Vite 5.4.20
- **Styling:** TailwindCSS 3.4.17
- **UI Components:** Shadcn UI (Radix UI primitives)
- **Forms:** React Hook Form 7.55.0
- **Query Management:** TanStack React Query 5.60.5
- **Roteamento:** Wouter 3.3.5
- **Ícones:** Lucide React + React Icons
- **Temas:** Next Themes 0.4.6
- **Animações:** Framer Motion 11.13.1

### DevDependencies
- **Bundler:** esbuild 0.25.0
- **Linter:** TypeScript Compiler
- **Database Tool:** Drizzle Kit 0.31.4
- **Build:** Concurrently, Cross-env

---

## 📁 ESTRUTURA DE PASTAS

### Server
```
server/
├── index.ts                    # Entry point Express
├── routes.ts                   # API routes principais
├── vite.ts                     # Middleware Vite (dev)
├── db.ts                       # Conexão com banco
├── storage.ts                  # Interface de armazenamento
├── auth.ts                     # Autenticação sessions
├── magic-link.ts               # Magic link para WhatsApp
├── ai.ts                       # Pipeline GPT/IA
├── analytics.ts                # Dados de analytics
├── clientLogger.ts             # Logs do cliente
├── adminRootProtection.ts      # Proteção de rota admin
├── replitAuth.ts               # Auth Replit
├── scripts/                    # Scripts utilitários
└── schemas/                    # Drizzle schemas (tables)
```

### Client
```
client/src/
├── pages/                      # Páginas da aplicação
│   ├── auth.tsx                # Login/Register
│   ├── landing.tsx             # Landing page
│   ├── dashboard.tsx           # Dashboard principal
│   ├── transacoes.tsx          # Gerenciar transações
│   ├── cartoes.tsx             # Cartões de crédito
│   ├── economias.tsx           # Metas de poupança
│   ├── orcamento.tsx           # Orçamento
│   ├── metas.tsx               # Metas financeiras
│   ├── insights.tsx            # Insights IA
│   ├── configuracoes.tsx       # Configurações
│   ├── admin/                  # Páginas admin
│   │   ├── index.tsx           # Dashboard admin
│   │   ├── clientes.tsx        # Gerenciamento de clientes
│   │   ├── assinaturas.tsx     # Assinaturas
│   │   ├── eventos.tsx         # Eventos de sistema
│   │   ├── webhooks.tsx        # Webhooks
│   │   ├── health.tsx          # Health check
│   │   └── testes.tsx          # Testes admin
│   └── not-found.tsx           # 404
├── components/
│   ├── ui/                     # Componentes Shadcn (Button, Card, etc)
│   ├── design-system/          # Componentes custom
│   ├── admin/                  # Componentes admin específicos
│   ├── NavBar.tsx              # Barra de navegação
│   ├── BottomNavigation.tsx    # Navegação mobile
│   └── theme-toggle.tsx        # Seletor de tema
├── hooks/
│   ├── useAuth.ts              # Hook de autenticação
│   ├── use-toast.ts            # Toast notifications
│   └── others
├── contexts/
│   ├── PeriodContext.tsx       # Contexto de período
│   ├── TabContext.tsx          # Contexto de abas
│   └── others
├── lib/
│   ├── queryClient.ts          # Config React Query
│   ├── utils.ts                # Funções utilitárias
│   └── others
├── App.tsx                     # Entry point React
├── main.tsx                    # Main index
└── index.css                   # Estilos globais
```

### Shared
```
shared/
└── schema.ts                   # Drizzle schemas + Zod types
```

---

## 🔐 AUTENTICAÇÃO & SEGURANÇA

### Tipos de Auth Implementados
1. **Web Auth (Session-based)**
   - Express-session + Passport.js
   - Armazenamento: connect-pg-simple (PostgreSQL)
   - Cookie seguro com HttpOnly

2. **WhatsApp Auth (Magic Link)**
   - Email-based para usuários WhatsApp
   - Tokens temporários

3. **Admin Auth**
   - Proteção de rotas admin
   - Verificação de permissões

### Secrets Gerenciados
- `NEON_DATABASE_URL` (separada por ambiente: DEV vs PROD)
- `OPENAI_API_KEY` (opcional)
- Outras variáveis de configuração

---

## 📊 FUNCIONALIDADES PRINCIPAIS

### Core Features
✅ **Autenticação** - Login/Register com email e WhatsApp
✅ **Dashboard** - Visualização de finanças em tempo real
✅ **Transações** - Adicionar, editar e deletar transações
✅ **Cartões de Crédito** - Gerenciar múltiplos cartões
✅ **Economias** - Rastreamento de metas de poupança
✅ **Orçamento** - Planejamento de despesas
✅ **Metas** - Objetivos financeiros com progresso
✅ **Insights IA** - Recomendações baseadas em IA
✅ **Configurações** - Perfil e preferências do usuário

### Admin Features
✅ **Dashboard Admin** - Overview de sistema
✅ **Gerenciamento de Clientes** - CRUD completo
✅ **Assinaturas** - Controle de planos
✅ **Eventos** - Log de atividades
✅ **Webhooks** - Integração com sistemas externos
✅ **Health Check** - Monitoramento de sistema
✅ **Testes** - Ferramentas de debug

### Funcionalidades Técnicas
✅ **WhatsApp Integration** - Webhooks de mensagens
✅ **IA Pipeline** - Processamento com GPT
✅ **Multi-idioma** - Suporte para português
✅ **Dark Mode** - Tema claro/escuro (padrão: LIGHT)
✅ **Responsive** - Mobile-first design
✅ **Offline Support** - Dados em cache local

---

## 💾 BANCO DE DADOS

### Neon (Serverless PostgreSQL)

#### Ambientes Separados
- **DEV:** `ep-shy-recipe-aco7vd4h`
- **PROD:** `ep-plain-art-acnjwa7b`

#### Principais Tabelas
1. **users** - Dados de usuários
2. **transactions** - Transações financeiras
3. **credit_cards** - Cartões de crédito
4. **spending_limits** - Limites de gasto
5. **savings_goals** - Metas de poupança
6. **subscriptions** - Planos de assinatura
7. **webhook_events** - Eventos de webhooks
8. **admin_event_logs** - Logs de ações admin
9. Mais de 15 tabelas no total

#### ORM: Drizzle
- **Versão:** 0.39.1
- **Benefícios:** Type-safe queries, migrações, relations
- **Migrações:** Via `npm run db:push`

---

## 🚀 EXECUTANDO O PROJETO

### Desenvolvimento
```bash
npm run dev:server
```
- Backend Express roda em `localhost:5000`
- Frontend Vite roda em Vite middleware
- Acesso via Replit Preview

### Build
```bash
npm run build:server  # Compila server com esbuild
npm run build:client  # Compila cliente com Vite
```

### Production
```bash
npm run start
```

### Outros Scripts
```bash
npm run check         # Type checking
npm run db:push      # Drizzle migrations
npm run kill-all-dev # Mata todos os processos dev
```

---

## 🔧 CONFIGURAÇÃO CRÍTICA

### .replit
```
modules = ["nodejs-20"]
run = "npm run dev:server"

[[ports]]
localPort = 5000      # Backend
externalPort = 5000

[[ports]]
localPort = 5173      # Vite (development)
externalPort = 80
```

### vite.config.ts
- Aliases: `@assets`, `@components`, `@lib`, etc.
- Vite middleware para Express
- Plugin React automático (JSX)

### drizzle.config.ts
- Neon serverless driver
- Migrações via Drizzle Kit

---

## 🌐 ROTAS PRINCIPAIS

### API Endpoints
```
POST   /api/auth/register           - Registrar usuário
POST   /api/auth/login              - Login
POST   /api/auth/logout             - Logout

GET    /api/dashboard               - Data do dashboard
GET    /api/transacoes              - Listar transações
POST   /api/transacoes              - Criar transação
PATCH  /api/transacoes/:id          - Editar transação
DELETE /api/transacoes/:id          - Deletar transação

GET    /api/cartoes                 - Listar cartões
GET    /api/contas                  - Contas do usuário
GET    /api/goals                   - Metas financeiras
GET    /api/insights-ai             - Insights IA

GET    /api/admin/users             - Admin: listar usuários
PATCH  /api/admin/users/:id         - Admin: editar usuário
DELETE /api/admin/users/:id         - Admin: deletar usuário
POST   /api/admin/users/:id/suspend - Admin: suspender usuário

POST   /webhook/whatsapp            - Webhook WhatsApp
```

---

## ⚙️ CONFIGURAÇÕES IMPORTANTES

### Tema (Default: LIGHT MODE)
- Armazenado em `localStorage`
- Usuário clica manualmente para Dark Mode
- **Mudança recente:** Removido `prefers-color-scheme` do sistema

### Performance
- React Query com cache inteligente
- Lazy loading de páginas
- Otimização de bundle com Vite

### SEO
- Meta tags dinâmicas
- Open Graph para compartilhamento social
- Títulos e descrições únicas por página

---

## 🐛 PROBLEMAS CONHECIDOS & RECENTES

### Corrigido em 29/11/2025
- ✅ Espaçamento bugado na tabela de clientes (coluna AÇÕES)
- ✅ Tema padrão sendo Dark Mode (agora Light)
- ✅ Mensagem de boas-vindas personalizada ("Bem-vindo Mateus lindão")

### Em Desenvolvimento
- WhatsApp integration ainda em progresso
- Alguns webhooks podem precisar ajustes
- Cache de analytics pode precisar otimização

### Possíveis Issues
- Ordem de coluna "hidden md:table-cell" pode causar layout issues em mobile
- Tipagem de alguns contextos pode ser mais strict
- Performance em tabelas muito grandes

---

## 📝 GIT & VERSIONAMENTO

### Workflow Implementado
1. Editar no DEV
2. `git push origin main`
3. No PROD: `git pull origin main`
4. Cada ambiente tem seu próprio `.env` com NEON_DATABASE_URL

### Commits Recentes
```
a413192 Set the dashboard to always start in light mode
1638642 Add a simple script to revert the last commit
8b09771 Add a script to easily revert the last code change
835dc4c Update welcome message on the login page
```

### Revert Script
Existe `revert.sh` para reverter último commit facilmente:
```bash
bash revert.sh
```

---

## 📦 DEPENDÊNCIAS CRÍTICAS

### Core
- `express@4.21.2` - Backend framework
- `react@18.3.1` - Frontend framework
- `drizzle-orm@0.39.1` - ORM
- `@tanstack/react-query@5.60.5` - State management
- `zod@3.24.2` - Validação schemas

### UI/UX
- `@radix-ui/*` - 20+ componentes base
- `tailwindcss@3.4.17` - CSS framework
- `lucide-react@0.453.0` - Ícones
- `shadcn/ui` - Componentes estilizados

### Autenticação/Segurança
- `passport@0.7.0` - Estratégias auth
- `express-session@1.18.1` - Sessions
- `bcryptjs@3.0.3` - Hash de senhas
- `connect-pg-simple@10.0.0` - Session store

---

## 🎯 PRÓXIMOS PASSOS RECOMENDADOS

1. **Resolver problemas de tabela mobile**
   - Ajustar responsividade de colunas
   - Testar em diferentes tamanhos de tela

2. **Completar integração WhatsApp**
   - Finalizar webhook handlers
   - Testar com usuários reais

3. **Otimização de Performance**
   - Implementar virtual scrolling em tabelas grandes
   - Cache estratégico de dados

4. **Testes Automatizados**
   - Unit tests para lógica crítica
   - E2E tests para fluxos principais

5. **Documentação**
   - API documentation
   - Guia de desenvolvimento
   - Troubleshooting guide

---

## 📞 CONTATO & SUPORTE

**Desenvolvedor:** Mateus
**Status:** Em Desenvolvimento Ativo
**Última Atualização:** 29 de Novembro de 2025

---

## ⚠️ NOTAS IMPORTANTES

- **NUNCA modificar .replit ou vite.config.ts** sem aprovação
- **NUNCA editar package.json manualmente** - usar packager tool
- **NUNCA fazer force push** para main branch
- **Sempre testar em DEV antes de enviar para PROD**
- **Banco de dados isolado por ambiente** - respeitar essa separação
- **Tema padrão é LIGHT** - usuário clica manualmente para Dark

---

Pronto! Este documento tem todas as informações que você precisa para compartilhar com ChatGPT! 🎉
