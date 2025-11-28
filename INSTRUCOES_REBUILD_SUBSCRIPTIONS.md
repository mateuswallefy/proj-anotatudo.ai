# Instruções para Rebuild da Tabela Subscriptions em Produção

## ⚠️ ATENÇÃO CRÍTICA

**Este script irá DELETAR TODOS OS DADOS da tabela `subscriptions` no banco de produção!**

Certifique-se de:
- ✅ Fazer backup dos dados antes de executar
- ✅ Executar em horário de baixo tráfego
- ✅ Ter acesso ao banco de produção
- ✅ Ter a `DATABASE_URL` correta configurada

---

## 📋 Pré-requisitos

1. **Acesso ao banco de produção**
   - Você precisa ter a `DATABASE_URL` do banco de produção da Vercel
   - A URL geralmente está no formato: `postgresql://user:password@host:port/database?sslmode=require`

2. **Node.js e dependências instaladas**
   - O projeto deve ter `@neondatabase/serverless` instalado
   - O projeto deve ter `ws` instalado (para WebSocket)

---

## 🚀 Como Executar

### Opção 1: Executar Localmente (Recomendado para Teste)

1. **Obter a DATABASE_URL de produção:**
   ```bash
   # No painel da Vercel, vá em:
   # Settings > Environment Variables > DATABASE_URL
   # Copie o valor
   ```

2. **Executar o script:**
   ```bash
   DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require" \
   npx tsx server/scripts/rebuildSubscriptionsProduction.ts
   ```

   Ou exportar a variável primeiro:
   ```bash
   export DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
   npx tsx server/scripts/rebuildSubscriptionsProduction.ts
   ```

### Opção 2: Executar no Ambiente de Produção (Vercel)

#### Via Vercel CLI (Recomendado)

1. **Instalar Vercel CLI (se não tiver):**
   ```bash
   npm i -g vercel
   ```

2. **Fazer login:**
   ```bash
   vercel login
   ```

3. **Linkar o projeto:**
   ```bash
   vercel link
   ```

4. **Executar o script via Vercel Functions:**
   ```bash
   # O script usará automaticamente a DATABASE_URL do ambiente de produção
   vercel env pull .env.production
   npx tsx server/scripts/rebuildSubscriptionsProduction.ts
   ```

#### Via Vercel Dashboard (SSH/Console)

1. **Acessar o console do projeto na Vercel:**
   - Vá em: `Settings > Functions > Runtime Logs`
   - Ou use o terminal integrado (se disponível)

2. **Executar o script:**
   ```bash
   # A DATABASE_URL já estará disponível no ambiente
   npx tsx server/scripts/rebuildSubscriptionsProduction.ts
   ```

#### Via Vercel CLI com execução remota

```bash
vercel --prod -- npm run rebuild:subscriptions
```

(E adicionar o script no `package.json`)

---

## 📝 Passo a Passo Detalhado

### 1. Backup dos Dados (IMPORTANTE!)

Antes de executar, faça backup:

```bash
# Exportar dados da tabela subscriptions
psql $DATABASE_URL -c "COPY subscriptions TO STDOUT WITH CSV HEADER" > subscriptions_backup_$(date +%Y%m%d_%H%M%S).csv
```

Ou via script SQL:

```sql
-- No console do banco (pgAdmin, DBeaver, etc.)
SELECT * FROM subscriptions;
-- Exportar resultado como CSV
```

### 2. Verificar DATABASE_URL

```bash
# Verificar se a variável está configurada
echo $DATABASE_URL

# Ou no Node.js
node -e "console.log(process.env.DATABASE_URL ? 'OK' : 'MISSING')"
```

### 3. Executar o Script

```bash
npx tsx server/scripts/rebuildSubscriptionsProduction.ts
```

### 4. Verificar Saída

O script deve exibir:

```
[Rebuild Subscriptions Production] Iniciando processo...
[Rebuild Subscriptions Production] Conectado ao banco: postgresql://****
[Rebuild Subscriptions Production] Verificando se a tabela 'subscriptions' existe...
[Rebuild Subscriptions Production] ⚠️  Tabela 'subscriptions' existe. Será deletada e recriada.
[Rebuild Subscriptions Production] Deletando tabela 'subscriptions' (se existir)...
[Rebuild Subscriptions Production] ✅ Tabela deletada (ou não existia).
[Rebuild Subscriptions Production] Criando tabela 'subscriptions' com estrutura correta...
[Rebuild Subscriptions Production] ✅ Tabela 'subscriptions' criada com sucesso!
[Rebuild Subscriptions Production] Verificando estrutura da tabela...
[Rebuild Subscriptions Production] Estrutura da tabela (8 colunas):
  1. id VARCHAR NULL NOT NULL DEFAULT gen_random_uuid()
  2. user_id VARCHAR NULL NOT NULL
  3. provider VARCHAR NULL NOT NULL DEFAULT 'manual'
  4. status VARCHAR NULL NOT NULL DEFAULT 'active'
  5. interval VARCHAR NULL NOT NULL DEFAULT 'monthly'
  6. current_period_end TIMESTAMP NULL
  7. created_at TIMESTAMP NULL NOT NULL DEFAULT NOW()
  8. updated_at TIMESTAMP NULL NOT NULL DEFAULT NOW()
[Rebuild Subscriptions Production] Verificando constraints...
[Rebuild Subscriptions Production] Constraints encontrados (2):
  - subscriptions_pkey: PRIMARY KEY
  - subscriptions_user_id_fkey: FOREIGN KEY (user_id -> users.id)
[Rebuild Subscriptions Production] Testando SELECT...
[Rebuild Subscriptions Production] ✅ SELECT funcionando. 0 registros encontrados.
[Rebuild Subscriptions Production] Tabela vazia (esperado após rebuild).
[Rebuild Subscriptions Production] ✅ Finalizado com sucesso.
[Rebuild Subscriptions Production] ✅ Tabela 'subscriptions' recriada e sincronizada com o schema do Drizzle.
```

### 5. Verificar no Banco

Após executar, verifique no banco:

```sql
-- Verificar estrutura
\d subscriptions

-- Verificar dados
SELECT * FROM subscriptions LIMIT 10;

-- Verificar constraints
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'subscriptions';
```

---

## 🔧 Troubleshooting

### Erro: "DATABASE_URL must be set"

**Solução:**
```bash
# Verificar se a variável está exportada
echo $DATABASE_URL

# Se não estiver, exportar:
export DATABASE_URL="sua_url_aqui"
```

### Erro: "Connection refused" ou "Timeout"

**Solução:**
- Verificar se a `DATABASE_URL` está correta
- Verificar se o banco permite conexões externas
- Verificar firewall/VPC settings na Vercel

### Erro: "permission denied" ou "insufficient privileges"

**Solução:**
- Verificar se o usuário do banco tem permissões de `DROP TABLE` e `CREATE TABLE`
- Verificar se está usando o usuário correto (não um usuário read-only)

### Erro: "relation 'users' does not exist"

**Solução:**
- Verificar se a tabela `users` existe no banco
- Verificar se está no schema correto (`public`)

### Erro: "column 'xxx' does not exist" após rebuild

**Solução:**
- Verificar se o Drizzle está usando os nomes corretos (camelCase no código)
- O Drizzle mapeia automaticamente: `currentPeriodEnd` → `current_period_end`
- Verificar o schema em `shared/schema.ts`

---

## ✅ Checklist Pós-Execução

Após executar o script, verifique:

- [ ] Tabela `subscriptions` foi criada
- [ ] Todas as 15 colunas estão presentes (id, user_id, provider, provider_subscription_id, plan_name, price_cents, currency, billing_interval, interval, status, trial_ends_at, current_period_end, cancel_at, meta, created_at, updated_at)
- [ ] Foreign key para `users(id)` está funcionando
- [ ] Constraints estão corretos
- [ ] SELECT funciona sem erros
- [ ] Drizzle consegue ler/escrever na tabela
- [ ] Painel admin consegue listar assinaturas

---

## 🔄 Restaurar Dados (Se Necessário)

Se você fez backup antes e precisa restaurar:

```bash
# Importar dados do CSV
psql $DATABASE_URL -c "COPY subscriptions FROM STDIN WITH CSV HEADER" < subscriptions_backup_YYYYMMDD_HHMMSS.csv
```

Ou via script SQL:

```sql
-- Inserir dados manualmente
INSERT INTO subscriptions (id, user_id, provider, status, interval, current_period_end, created_at, updated_at)
VALUES (...);
```

---

## 📞 Suporte

Se encontrar problemas:

1. Verificar logs do script (todos os erros são logados)
2. Verificar logs do servidor (console.log do backend)
3. Verificar logs da Vercel (Runtime Logs)
4. Verificar estrutura da tabela no banco diretamente

---

## 🎯 Resultado Esperado

Após executar com sucesso:

- ✅ Tabela `subscriptions` recriada com estrutura correta
- ✅ **15 colunas** criadas (todas em snake_case):
  - `id`, `user_id`, `provider`, `provider_subscription_id`
  - `plan_name`, `price_cents`, `currency`, `billing_interval`
  - `interval`, `status`, `trial_ends_at`, `current_period_end`
  - `cancel_at`, `meta`, `created_at`, `updated_at`
- ✅ Foreign key para `users(id)` funcionando
- ✅ Drizzle consegue mapear corretamente (camelCase → snake_case)
- ✅ Painel admin consegue criar/listar assinaturas
- ✅ WhatsApp consegue verificar status de assinatura
- ✅ Todas as colunas do schema Drizzle presentes

---

**Data:** 2024-11-17  
**Versão do Script:** 1.0.0

