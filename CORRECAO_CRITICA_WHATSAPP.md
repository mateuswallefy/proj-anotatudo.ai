# 🔴 Correção Crítica - Pipeline WhatsApp

## Erros Corrigidos

### ✅ ERRO 1: Coluna `status` não existe na tabela `transacoes`

**Problema:** O schema do Drizzle tinha `status` com enum, mas a migration usa `varchar` simples.

**Correção:**
- Ajustado `shared/schema.ts` para usar `varchar` simples (sem enum) para `status` e `pendingKind`
- Migration `0002_add_transaction_status_fields.sql` já existe e está correta
- Schema agora corresponde à migration do banco

**Arquivos modificados:**
- `shared/schema.ts` - Removido enum de `status` e `pendingKind`

### ✅ ERRO 2: Variável `whatsappLatency` não existe

**Problema:** Código estava usando `whatsappLatency` diretamente do schema em vez de usar métodos do `storage`.

**Correções aplicadas:**

1. **`server/whatsapp.ts`:**
   - ❌ Removido: `import { whatsappLatency } from "../shared/schema.js"`
   - ❌ Removido: `import { db } from "./db.js"` e `import { eq } from "drizzle-orm"`
   - ✅ Adicionado: `import { storage } from "./storage.js"`
   - ✅ Substituído: `db.select().from(whatsappLatency)` → `storage.getWhatsAppLatencyById()`

2. **`server/routes.ts`:**
   - ❌ Removido: `whatsappLatency` dos imports (não estava sendo usado)

3. **`server/storage.ts`:**
   - ✅ Adicionado método: `getWhatsAppLatencyById(id: string)`

## Arquivos Modificados

### 1. `shared/schema.ts`
```diff
- status: varchar("status", { enum: ['paid', 'pending'] }).default('paid').notNull(),
+ status: varchar("status").default('paid').notNull(),
- pendingKind: varchar("pending_kind", { enum: ['to_receive', 'to_pay'] }),
+ pendingKind: varchar("pending_kind"),
```

### 2. `server/whatsapp.ts`
```diff
- import { db } from "./db.js";
- import { whatsappLatency } from "../shared/schema.js";
- import { eq } from "drizzle-orm";
+ import { storage } from "./storage.js";

- const latency = await db.select().from(whatsappLatency).where(eq(whatsappLatency.id, latencyId)).limit(1);
- if (latency[0]?.userId) {
+ const latency = await storage.getWhatsAppLatencyById(latencyId);
+ if (latency?.userId) {
```

### 3. `server/storage.ts`
```diff
+ getWhatsAppLatencyById(id: string): Promise<WhatsAppLatency | undefined>;

+ async getWhatsAppLatencyById(id: string): Promise<WhatsAppLatency | undefined> {
+   const [latency] = await db
+     .select()
+     .from(whatsappLatency)
+     .where(eq(whatsappLatency.id, id))
+     .limit(1);
+   return latency;
+ }
```

### 4. `server/routes.ts`
```diff
- whatsappLatency,
} from "@shared/schema";
```

## Migrations

### Migration Existente: `migrations/0002_add_transaction_status_fields.sql`

A migration já existe e está correta:
```sql
ALTER TABLE "transacoes" 
ADD COLUMN IF NOT EXISTS "status" varchar DEFAULT 'paid' NOT NULL;

ALTER TABLE "transacoes" 
ADD COLUMN IF NOT EXISTS "pending_kind" varchar;

ALTER TABLE "transacoes" 
ADD COLUMN IF NOT EXISTS "payment_method" varchar DEFAULT 'other' NOT NULL;
```

**Status:** ✅ Migration já aplicada ou pronta para aplicar

## Testes do NLP

### ✅ Casos de Teste Esperados:

1. **"Paguei 50 no mercado"**
   - ✅ Deve criar transação `tipo: 'saida'`
   - ✅ Deve usar `status: 'paid'` (default)
   - ✅ Deve registrar latency sem erros

2. **"Recebi 120 do cliente"**
   - ✅ Deve criar transação `tipo: 'entrada'`
   - ✅ Deve usar `status: 'paid'` (default)
   - ✅ Deve registrar latency sem erros

3. **"Reunião amanhã 15h"**
   - ✅ Deve criar evento no calendário
   - ✅ Deve registrar latency sem erros

## Rota Ativa

**POST `/api/whatsapp/webhook`**

✅ Mantida intacta:
- Captura body corretamente
- Passa para `handleWhatsAppWebhook()` (se usar handler)
- Aciona NLP primeiro (linha ~2265)
- Cai no sistema antigo apenas se NLP falhar
- Sempre responde com 200 OK

## Validações

- ✅ Linter: Sem erros
- ✅ Imports: Todos corrigidos
- ✅ Storage: Métodos consistentes
- ✅ Schema: Corresponde à migration
- ✅ Referências: Todas usando storage

## Próximos Passos

1. ✅ Commit das correções
2. ⏳ Push para produção
3. ⏳ Aplicar migration se ainda não aplicada
4. ⏳ Testar mensagens no WhatsApp

