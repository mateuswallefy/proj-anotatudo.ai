# Instruções - Correção da Tabela subscriptions

## 📋 Problema

A tabela `subscriptions` no banco de produção pode estar:
- Não existir
- Ter colunas faltando
- Ter tipos de dados incorretos
- Ter defaults incorretos
- Estar desincronizada com o schema do Drizzle

Isso pode causar erros ao criar, atualizar ou consultar assinaturas.

## ✅ Solução

Script que corrige completamente a tabela `subscriptions`, garantindo que ela esteja 100% sincronizada com o schema oficial do Drizzle.

---

## 🚀 Como Executar

### No Replit (Terminal):

```bash
npx tsx server/scripts/fixSubscriptionsTable.ts
```

### Requisitos:

- `DATABASE_URL` configurada (banco de produção)
- Acesso ao banco PostgreSQL

---

## 📝 O que o Script Faz

1. ✅ **Conecta ao banco de produção** usando `DATABASE_URL`
2. ✅ **Verifica se a tabela `subscriptions` existe**
3. ✅ **Se não existir, cria a tabela** com o schema oficial:
   - `id` (VARCHAR, PRIMARY KEY, DEFAULT gen_random_uuid())
   - `user_id` (VARCHAR, NOT NULL, FOREIGN KEY users.id ON DELETE CASCADE)
   - `provider` (VARCHAR, NOT NULL, DEFAULT 'manual')
   - `status` (VARCHAR, NOT NULL, DEFAULT 'active')
   - `current_period_end` (TIMESTAMP, nullable)
   - `created_at` (TIMESTAMP, NOT NULL, DEFAULT NOW())
   - `updated_at` (TIMESTAMP, NOT NULL, DEFAULT NOW())
4. ✅ **Se existir, valida cada coluna:**
   - Verifica se todas as colunas existem
   - Verifica tipos de dados
   - Verifica nullable/NOT NULL
   - Verifica defaults
   - Corrige qualquer inconsistência
5. ✅ **Verifica constraints:**
   - Primary key em `id`
   - Foreign key `user_id` → `users.id` com CASCADE
6. ✅ **Lista estrutura final** da tabela
7. ✅ **Testa consulta** fazendo `SELECT * FROM subscriptions LIMIT 5`
8. ✅ **Fecha a conexão** corretamente

---

## 📊 Resultado Esperado

### Se a tabela NÃO existir:

```
[Fix Subscriptions] Iniciando processo...
[Fix Subscriptions] Conectando ao banco de dados...
[Fix Subscriptions] Verificando se a tabela 'subscriptions' existe...
[Fix Subscriptions] ⚠️  Tabela 'subscriptions' NÃO existe
[Fix Subscriptions] Criando tabela 'subscriptions'...
[Fix Subscriptions] ✅ Tabela 'subscriptions' criada com sucesso!
[Fix Subscriptions] Verificando estrutura final da tabela 'subscriptions'...
[Fix Subscriptions] Estrutura final da tabela 'subscriptions' (7 colunas):
  1. id (character varying) NOT NULL DEFAULT gen_random_uuid()
  2. user_id (character varying) NOT NULL
  3. provider (character varying) NOT NULL DEFAULT 'manual'::character varying
  4. status (character varying) NOT NULL DEFAULT 'active'::character varying
  5. current_period_end (timestamp without time zone) NULL
  6. created_at (timestamp without time zone) NOT NULL DEFAULT now()
  7. updated_at (timestamp without time zone) NOT NULL DEFAULT now()
[Fix Subscriptions] Testando consulta na tabela 'subscriptions'...
[Fix Subscriptions] ✅ Consulta de teste bem-sucedida!
[Fix Subscriptions] Registros encontrados: 0
[Fix Subscriptions] ℹ️  Tabela está vazia (isso é normal se não houver assinaturas ainda)
[Fix Subscriptions] ✅ Processo concluído com sucesso!
[Fix Subscriptions] ✅ A tabela 'subscriptions' está sincronizada com o schema do Drizzle.
[Fix Subscriptions] Conexão fechada.
```

### Se a tabela JÁ existir (com correções):

```
[Fix Subscriptions] Iniciando processo...
[Fix Subscriptions] Conectando ao banco de dados...
[Fix Subscriptions] Verificando se a tabela 'subscriptions' existe...
[Fix Subscriptions] ✅ Tabela 'subscriptions' já existe
[Fix Subscriptions] Validando e corrigindo colunas...
[Fix Subscriptions] Colunas existentes: id, user_id, provider, status
[Fix Subscriptions] ⚠️  Coluna 'current_period_end' não existe. Criando...
[Fix Subscriptions] ✅ Coluna 'current_period_end' criada com sucesso!
[Fix Subscriptions] ⚠️  Coluna 'created_at' não existe. Criando...
[Fix Subscriptions] ✅ Coluna 'created_at' criada com sucesso!
[Fix Subscriptions] ⚠️  Coluna 'updated_at' não existe. Criando...
[Fix Subscriptions] ✅ Coluna 'updated_at' criada com sucesso!
[Fix Subscriptions] ✅ Coluna 'id': OK
[Fix Subscriptions] ✅ Coluna 'user_id': OK
[Fix Subscriptions] ✅ Coluna 'provider': default corrigido
[Fix Subscriptions] ✅ Coluna 'status': default corrigido
[Fix Subscriptions] Verificando foreign key 'user_id'...
[Fix Subscriptions] ✅ Foreign key 'user_id' já existe
[Fix Subscriptions] Verificando primary key 'id'...
[Fix Subscriptions] ✅ Primary key 'id' já existe
...
[Fix Subscriptions] ✅ Processo concluído com sucesso!
```

---

## ✅ Confirmar se a Correção Funcionou

Após executar o script:

1. **Verificar no console:**
   - Deve aparecer: `✅ Tabela 'subscriptions' criada com sucesso!` ou `✅ Tabela 'subscriptions' já existe`
   - Deve aparecer: `✅ A tabela 'subscriptions' está sincronizada com o schema do Drizzle.`
   - Deve listar todas as 7 colunas corretas

2. **Verificar estrutura no banco (opcional):**
   ```sql
   SELECT 
     column_name,
     data_type,
     is_nullable,
     column_default
   FROM information_schema.columns
   WHERE table_name = 'subscriptions'
   ORDER BY ordinal_position;
   ```
   
   Deve retornar exatamente 7 colunas:
   - `id` (character varying, NOT NULL, DEFAULT gen_random_uuid())
   - `user_id` (character varying, NOT NULL)
   - `provider` (character varying, NOT NULL, DEFAULT 'manual')
   - `status` (character varying, NOT NULL, DEFAULT 'active')
   - `current_period_end` (timestamp without time zone, NULL)
   - `created_at` (timestamp without time zone, NOT NULL, DEFAULT now())
   - `updated_at` (timestamp without time zone, NOT NULL, DEFAULT now())

3. **Testar criação de assinatura:**
   - O sistema deve conseguir criar novas assinaturas sem erros
   - O sistema deve conseguir atualizar assinaturas existentes
   - O sistema deve conseguir consultar assinaturas

---

## 🔒 Segurança

- ✅ Script **não remove** dados existentes
- ✅ Script **apenas adiciona** colunas faltantes
- ✅ Script **apenas corrige** tipos e defaults
- ✅ Script **não altera** valores existentes
- ✅ Script **preserva** foreign keys e constraints
- ✅ Conexão é **fechada corretamente** após execução

---

## ⚠️ Importante

- Este script **não gera migrations** do Drizzle
- Este script **não altera** o schema em `shared/schema.ts`
- Este script **apenas corrige** o banco de produção para ficar sincronizado com o schema
- O schema já possui a tabela `subscriptions` definida, o banco apenas estava desatualizado

---

## 📋 Schema Oficial (Drizzle)

```typescript
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider").notNull().default("manual"),
  status: varchar("status").notNull().default("active"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: false }),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
});
```

---

## 📁 Arquivos

- **Script:** `server/scripts/fixSubscriptionsTable.ts`
- **Instruções:** `FIX_SUBSCRIPTIONS_INSTRUCOES.md` (este arquivo)

---

**Status:** ✅ Script pronto para execução

