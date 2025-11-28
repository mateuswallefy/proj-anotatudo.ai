# 🔧 CORREÇÃO DO BANCO DE DADOS EM PRODUÇÃO

## ❌ PROBLEMA DETECTADO

O banco de produção ainda está apontando para o PostgreSQL interno do Replit devido às variáveis PG* que estão definidas no ambiente.

**Variáveis problemáticas encontradas:**
- `PGDATABASE=heliumdb`
- `PGHOST=helium`
- `PGPORT=5432`
- `PGUSER=postgres`
- `PGPASSWORD=password`

**Variável correta (já existe):**
- `DATABASE_URL=postgresql://neondb_owner:npg_TlZvP3kd2icV@ep-plain-art-acnjwa7b-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`

---

## 📋 PASSO 1: Listar TODAS as Variáveis de Ambiente

### 1.1 App Secrets (Tools → Secrets)

1. No Replit, vá em **Tools** → **Secrets**
2. Anote TODAS as variáveis que aparecem lá
3. Procure especificamente por:
   - `PGDATABASE`
   - `PGHOST`
   - `PGPORT`
   - `PGUSER`
   - `PGPASSWORD`
   - `DATABASE_URL`

### 1.2 Deploy Env Vars (Deploy → Settings)

1. No Replit, vá em **Deploy** → **Settings**
2. Procure por uma seção **"Environment Variables"** ou **"Env Vars"**
3. Anote TODAS as variáveis que aparecem lá
4. Procure especificamente por variáveis PG*

### 1.3 Account Secrets (se tiver acesso)

1. No Replit, vá em **Account Settings** → **Secrets** (se disponível)
2. Anote quaisquer variáveis PG* que aparecerem

---

## 🗑️ PASSO 2: Apagar Variáveis PG*

### 2.1 Apagar em App Secrets

1. Vá em **Tools** → **Secrets**
2. Para cada uma das seguintes variáveis, **DELETE completamente**:
   - `PGDATABASE`
   - `PGHOST`
   - `PGPORT`
   - `PGUSER`
   - `PGPASSWORD`

   **Como deletar:**
   - Clique na variável
   - Clique no botão de deletar (lixeira) ou "Remove"
   - Confirme a exclusão

   **⚠️ Se não conseguir deletar:**
   - Sobrescreva com valor vazio: `""`
   - Ou sobrescreva com um valor inválido: `null`

### 2.2 Apagar em Deploy Env Vars

1. Vá em **Deploy** → **Settings**
2. Procure por **"Environment Variables"**
3. Delete todas as variáveis PG* que aparecerem lá

### 2.3 Verificar Account Secrets

1. Se tiver acesso a Account Secrets, delete variáveis PG* de lá também

---

## ✅ PASSO 3: Garantir que Apenas DATABASE_URL Existe

### 3.1 Verificar DATABASE_URL em App Secrets

1. Vá em **Tools** → **Secrets**
2. Verifique se existe `DATABASE_URL`
3. Se não existir, **ADICIONE** com este valor:

```
postgresql://neondb_owner:npg_TlZvP3kd2icV@ep-plain-art-acnjwa7b-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

4. Se existir mas estiver diferente, **ATUALIZE** para o valor acima

### 3.2 Verificar em Deploy Env Vars

1. Vá em **Deploy** → **Settings**
2. Verifique se `DATABASE_URL` está lá
3. Se estiver, garanta que tem o valor correto do Neon

---

## 🔄 PASSO 4: Reset Completo do Autoscale

### 4.1 Parar o Deploy Atual

1. Vá em **Deploy** → **Stop** (ou clique no botão de parar)
2. Aguarde até o deploy parar completamente (pode levar alguns segundos)
3. Verifique que o status mostra "Stopped" ou "Not Running"

### 4.2 Limpar Cache e Imagens

1. Vá em **Deploy** → **Settings**
2. Procure por opções de:
   - **"Clear Cache"** ou **"Invalidate Cache"** → Clique
   - **"Delete Images"** ou **"Clean Images"** → Clique (se disponível)

### 4.3 Verificar Configuração do Build

1. Vá em **Deploy** → **Settings**
2. Verifique que está configurado:
   - **Build Command:** `npm run build`
   - **Run Command:** `npm run start`
   - **Deployment Target:** `autoscale`

3. Se algo estiver diferente, **CORRIJA** para os valores acima

### 4.4 Recriar o Deploy

1. Vá em **Deploy** → **Publish** (ou **Deploy** → **Start**)
2. Aguarde o build completar
3. Aguarde o deploy iniciar
4. Verifique os logs para garantir que não há erros

---

## ✅ PASSO 5: Verificar Após o Reset

### 5.1 Executar Script de Verificação

No terminal do Replit (ou via SSH), execute:

```bash
npx tsx server/scripts/fixDatabaseConnection.ts
```

### 5.2 Verificar Variáveis no Container

Execute no terminal:

```bash
env | grep -E "^(PG|DATABASE)" | sort
```

**Resultado esperado:**
```
DATABASE_URL=postgresql://neondb_owner:npg_TlZvP3kd2icV@ep-plain-art-acnjwa7b-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**❌ NÃO deve aparecer:**
- `PGDATABASE`
- `PGHOST`
- `PGPORT`
- `PGUSER`
- `PGPASSWORD`

### 5.3 Testar Conexão com o Banco

Execute no terminal:

```bash
npx tsx -e "import { db } from './server/db.js'; import { sql } from 'drizzle-orm'; (async () => { try { const result = await db.execute(sql\`SELECT 1 as test\`); console.log('✅ Conexão com Neon OK:', result); } catch(e) { console.error('❌ Erro:', e.message); } })()"
```

---

## 📊 RELATÓRIO FINAL

Após completar todos os passos, me informe:

### ✅ Variáveis de Ambiente no Container Novo

Execute e me envie o resultado:

```bash
env | grep -E "^(PG|DATABASE)" | sort
```

### ✅ DATABASE_URL em Uso

Execute e me envie o resultado:

```bash
echo $DATABASE_URL
```

### ✅ Status das Variáveis PG*

Execute e me envie o resultado:

```bash
for var in PGDATABASE PGHOST PGPORT PGUSER PGPASSWORD; do
  if [ -n "${!var}" ]; then
    echo "❌ $var=${!var}"
  else
    echo "✅ $var não está definida"
  fi
done
```

---

## 🔍 TROUBLESHOOTING

### Se as variáveis PG* ainda aparecerem após deletar:

1. **Verifique se há múltiplas definições:**
   - App Secrets
   - Deploy Env Vars
   - Account Secrets
   - Arquivo `.replit` (seção `[env]`)

2. **Sobrescreva com valores vazios:**
   - Em vez de deletar, defina como string vazia: `""`

3. **Verifique o arquivo `.replit`:**
   ```bash
   cat .replit | grep -A 10 "\[env\]"
   ```
   - Se houver variáveis PG* na seção `[env]`, remova-as

4. **Force um rebuild completo:**
   - Delete o deploy
   - Aguarde 30 segundos
   - Recrie do zero

---

## 📝 CHECKLIST FINAL

- [ ] Listei todas as variáveis de ambiente (App Secrets, Deploy Env Vars, Account Secrets)
- [ ] Deletei `PGDATABASE` de todos os lugares
- [ ] Deletei `PGHOST` de todos os lugares
- [ ] Deletei `PGPORT` de todos os lugares
- [ ] Deletei `PGUSER` de todos os lugares
- [ ] Deletei `PGPASSWORD` de todos os lugares
- [ ] Verifiquei que `DATABASE_URL` está correta (Neon)
- [ ] Parei o deploy atual
- [ ] Limpei cache e imagens
- [ ] Verifiquei configuração do build (build: `npm run build`, run: `npm run start`)
- [ ] Recriei o deploy (Publish)
- [ ] Executei script de verificação
- [ ] Confirmei que variáveis PG* não aparecem mais
- [ ] Testei conexão com o banco Neon

---

**Última atualização:** 2025-01-27  
**Script de verificação:** `server/scripts/fixDatabaseConnection.ts`


