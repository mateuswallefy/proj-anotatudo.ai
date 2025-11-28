# 🔄 RESET HARD COMPLETO DO DEPLOY AUTOSCALE

## ✅ PASSOS JÁ EXECUTADOS

### 1. Limpeza de Diretórios de Deployment
- ✅ Removidos diretórios: `.deployment`, `.config/deployment`, `.replit/deployment`, `.replit/autoscale`, `.config/autoscale`
- ✅ Nenhum arquivo de deployment antigo encontrado

### 2. Recriação do Arquivo .replit
- ✅ Arquivo `.replit` recriado com configuração mínima
- ✅ Removido módulo `postgresql-16` (que pode estar injetando variáveis PG*)
- ✅ Configuração atual:
  ```toml
  modules = ["nodejs-20", "web"]
  run = ["npm", "run", "start"]
  
  [nix]
  channel = "stable-24_05"
  
  [deployment]
  deploymentTarget = "autoscale"
  build = ["npm", "run", "build"]
  run = ["npm", "run", "start"]
  
  [[ports]]
  localPort = 5000
  externalPort = 80
  ```

### 3. Verificação de Workflows
- ✅ Nenhum workflow antigo encontrado no `.replit`

---

## ⚠️ PASSOS QUE PRECISAM SER EXECUTADOS MANUALMENTE NO REPLIT

Como não tenho acesso direto à API do Replit, você precisa executar estes passos na interface:

### PASSO 1: Deletar Deploy Atual

1. **No Replit, vá em: Deploy → Stop**
   - Aguarde o deploy parar completamente

2. **Vá em: Deploy → Settings**
   - Procure por opção "Delete Deployment" ou "Remove Deployment"
   - Clique e confirme a exclusão

3. **Se não houver opção de deletar:**
   - Vá em: Deploy → Settings → Advanced
   - Procure por "Unpublish" ou "Remove"
   - Execute

### PASSO 2: Limpar Cache e Imagens

1. **Vá em: Deploy → Settings**
2. **Procure e execute:**
   - "Clear Cache" ou "Invalidate Cache"
   - "Delete Images" ou "Remove Cached Images"
   - "Reset Metadata" (se disponível)

### PASSO 3: Remover Variáveis PG* dos Secrets

**⚠️ CRÍTICO: Isso deve ser feito ANTES de recriar o deploy!**

1. **Vá em: Tools → Secrets**
2. **Para cada uma das seguintes variáveis, DELETE completamente:**
   - `PGDATABASE`
   - `PGHOST`
   - `PGPORT`
   - `PGUSER`
   - `PGPASSWORD`

3. **Verifique também em: Deploy → Settings → Environment Variables**
   - Delete todas as variáveis PG* que aparecerem lá

### PASSO 4: Configurar DATABASE_URL

1. **Vá em: Tools → Secrets**
2. **Adicione ou atualize:**
   - **Key:** `DATABASE_URL`
   - **Value:** `postgresql://neondb_owner:npg_TlZvP3kd2icV@ep-plain-art-acnjwa7b-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`

### PASSO 5: Criar Novo Deploy do Zero

1. **Vá em: Deploy → Publish** (ou Deploy → Start)
2. **Aguarde o build completar**
3. **Aguarde o deploy iniciar**
4. **Verifique os logs para garantir que não há erros**

---

## ✅ VERIFICAÇÃO FINAL

Após criar o novo deploy, execute no terminal do Replit:

### 1. Verificar Variáveis PG*

```bash
env | grep PG
```

**Resultado esperado:** Nenhuma saída (variáveis PG* não devem existir)

### 2. Verificar DATABASE_URL

```bash
echo $DATABASE_URL
```

**Resultado esperado:**
```
postgresql://neondb_owner:npg_TlZvP3kd2icV@ep-plain-art-acnjwa7b-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### 3. Listar Todas as Variáveis de Ambiente

```bash
env | sort
```

**Me envie este resultado completo para verificação**

### 4. Verificar Apenas Variáveis de Banco

```bash
env | grep -E "^(PG|DATABASE)" | sort
```

**Resultado esperado:**
```
DATABASE_URL=postgresql://neondb_owner:npg_TlZvP3kd2icV@ep-plain-art-acnjwa7b-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**NÃO deve aparecer:**
- `PGDATABASE`
- `PGHOST`
- `PGPORT`
- `PGUSER`
- `PGPASSWORD`

---

## 📋 CHECKLIST FINAL

Após completar todos os passos, confirme:

- [ ] Deploy antigo foi deletado/removido
- [ ] Cache e imagens foram limpos
- [ ] Todas as variáveis PG* foram removidas dos Secrets
- [ ] DATABASE_URL está configurada corretamente (Neon)
- [ ] Novo deploy foi criado (Publish)
- [ ] Deploy está rodando sem erros
- [ ] `env | grep PG` não retorna nada
- [ ] `echo $DATABASE_URL` mostra a URL do Neon
- [ ] Script de verificação confirma que está tudo OK

---

## 🔍 SCRIPT DE VERIFICAÇÃO AUTOMÁTICA

Execute este script após criar o novo deploy:

```bash
bash VERIFICACAO_ENV_VARS.sh
```

Ou:

```bash
npx tsx server/scripts/fixDatabaseConnection.ts
```

---

**Última atualização:** 2025-01-27  
**Status:** Arquivo `.replit` recriado, aguardando ações manuais no Replit


