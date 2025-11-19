# 📋 Rotas Admin Encontradas

## 📁 Arquivos com Rotas Admin

### Backend (Server)
1. **`server/routes.ts`** - Contém todas as rotas de API do admin

### Frontend (Client)
1. **`client/src/pages/admin/eventos.tsx`** - Página de eventos (frontend)
2. **`client/src/pages/admin/index.tsx`** - Página principal do admin
3. **`client/src/pages/admin/clientes.tsx`** - Página de clientes
4. **`client/src/pages/admin/clientes-refactored.tsx`** - Versão refatorada de clientes
5. **`client/src/pages/admin/assinaturas.tsx`** - Página de assinaturas
6. **`client/src/pages/admin/health.tsx`** - Página de health center
7. **`client/src/pages/admin/overview.tsx`** - Página de overview
8. **`client/src/components/admin/AdminLayout.tsx`** - Layout do admin
9. **`client/src/components/admin/AdminHeader.tsx`** - Header do admin
10. **`client/src/App.tsx`** - Roteamento principal (define as rotas /admin/*)

---

## 🔌 Rotas de API Backend (`/api/admin/*`)

Todas as rotas estão em: **`server/routes.ts`**

### Rotas Encontradas:

1. **`GET /api/admin/overview`** - Visão geral do admin
2. **`GET /api/admin/users`** - Listar usuários
3. **`GET /api/admin/users/:id`** - Obter usuário específico
4. **`POST /api/admin/users`** - Criar usuário
5. **`PATCH /api/admin/users/:id`** - Atualizar usuário
6. **`DELETE /api/admin/users/:id`** - Deletar usuário
7. **`POST /api/admin/users/:id/suspend`** - Suspender usuário
8. **`POST /api/admin/users/:id/reactivate`** - Reativar usuário
9. **`POST /api/admin/users/:id/logout`** - Fazer logout do usuário
10. **`POST /api/admin/users/:id/reset-password`** - Resetar senha
11. **`POST /api/admin/users/:id/regenerate-password`** - Regenerar senha
12. **`GET /api/admin/subscriptions`** - Listar assinaturas
13. **`GET /api/admin/subscriptions/:id`** - Obter assinatura específica (inclui eventos)
14. **`GET /api/admin/health/overview`** - Health overview
15. **`GET /api/admin/health/logs`** - Logs do sistema
16. **`POST /api/admin/health/test/whatsapp`** - Testar WhatsApp
17. **`POST /api/admin/health/test/ai`** - Testar IA
18. **`POST /api/admin/health/test/check`** - Teste geral

---

## ⚠️ Observação Importante

**A rota `/api/admin/events` NÃO EXISTE!**

A página `/admin/eventos` está tentando usar `/api/admin/subscriptions`, mas isso não retorna eventos diretamente. 

A rota `/api/admin/subscriptions/:id` retorna eventos de uma assinatura específica, mas não há uma rota para listar TODOS os eventos.

---

## 📄 Arquivo da Página de Eventos

**Arquivo:** `client/src/pages/admin/eventos.tsx`

Este arquivo está tentando buscar eventos através de `/api/admin/subscriptions`, mas precisa de uma rota dedicada `/api/admin/events` que retorne todos os eventos de assinatura.

