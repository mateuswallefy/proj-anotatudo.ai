# Instruções - Correção da Coluna metadata na Tabela users

## 📋 Problema

O banco de produção não possui a coluna `metadata` na tabela `users`, causando erro 500 no login:

```
column "metadata" does not exist
```

## ✅ Solução

Script que adiciona automaticamente a coluna `metadata` se ela não existir.

---

## 🚀 Como Executar

### No Replit (Terminal):

```bash
npx tsx server/scripts/fixUsersMetadataColumn.ts
```

### Requisitos:

- `DATABASE_URL` configurada (banco de produção)
- Acesso ao banco PostgreSQL

---

## 📝 O que o Script Faz

1. ✅ **Conecta ao banco de produção** usando `DATABASE_URL`
2. ✅ **Verifica se a coluna `metadata` existe** na tabela `users`
3. ✅ **Adiciona a coluna se não existir**:
   ```sql
   ALTER TABLE users
   ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
   ```
4. ✅ **Lista todas as colunas** da tabela `users` para confirmação
5. ✅ **Testa uma consulta** na nova coluna para garantir que funciona
6. ✅ **Fecha a conexão** corretamente

---

## 📊 Resultado Esperado

### Se a coluna NÃO existir:

```
[Fix Users Metadata] Iniciando processo...
[Fix Users Metadata] Conectando ao banco de dados...
[Fix Users Metadata] Verificando se a coluna 'metadata' existe...
[Fix Users Metadata] ⚠️  Coluna 'metadata' NÃO existe na tabela 'users'
[Fix Users Metadata] Criando coluna 'metadata'...
[Fix Users Metadata] ✅ Coluna 'metadata' criada com sucesso!
[Fix Users Metadata] Verificando estrutura completa da tabela 'users'...
[Fix Users Metadata] Estrutura da tabela 'users' (X colunas):
  1. id (character varying) NOT NULL
  2. email (character varying) NULL
  ...
  X. metadata (jsonb) NULL DEFAULT '{}'::jsonb
[Fix Users Metadata] ✅ Confirmação: Coluna 'metadata' está presente na tabela
[Fix Users Metadata] Tipo: jsonb
[Fix Users Metadata] Nullable: YES
[Fix Users Metadata] Default: '{}'::jsonb
[Fix Users Metadata] Testando consulta na coluna 'metadata'...
[Fix Users Metadata] ✅ Consulta de teste bem-sucedida!
[Fix Users Metadata] ✅ Processo concluído com sucesso!
[Fix Users Metadata] ✅ O login voltará a funcionar após esta correção.
[Fix Users Metadata] Conexão fechada.
```

### Se a coluna JÁ existir:

```
[Fix Users Metadata] Iniciando processo...
[Fix Users Metadata] Conectando ao banco de dados...
[Fix Users Metadata] Verificando se a coluna 'metadata' existe...
[Fix Users Metadata] ✅ Coluna 'metadata' já existe na tabela 'users'
[Fix Users Metadata] Detalhes da coluna:
  - Nome: metadata
  - Tipo: jsonb
  - Nullable: YES
  - Default: '{}'::jsonb
[Fix Users Metadata] Verificando estrutura completa da tabela 'users'...
...
[Fix Users Metadata] ✅ Processo concluído com sucesso!
```

---

## ✅ Confirmar se a Correção Funcionou

Após executar o script:

1. **Verificar no console:**
   - Deve aparecer: `✅ Coluna 'metadata' criada com sucesso!` ou `✅ Coluna 'metadata' já existe`
   - Deve aparecer: `✅ O login voltará a funcionar após esta correção.`

2. **Testar o login:**
   - Email: `matheus.wallefy@gmail.com`
   - Senha: `82556682.com`
   - O login deve funcionar sem erro 500

3. **Verificar no banco (opcional):**
   ```sql
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_name = 'users' AND column_name = 'metadata';
   ```
   Deve retornar:
   ```
   column_name | data_type | is_nullable | column_default
   metadata    | jsonb     | YES         | '{}'::jsonb
   ```

---

## 🔒 Segurança

- ✅ Script **não modifica** outras tabelas
- ✅ Script **não altera** dados existentes
- ✅ Script **apenas adiciona** a coluna se não existir
- ✅ Script **não remove** nada
- ✅ Conexão é **fechada corretamente** após execução

---

## ⚠️ Importante

- Este script **não gera migrations** do Drizzle
- Este script **não altera** o schema em `shared/schema.ts`
- Este script **apenas corrige** o banco de produção para ficar sincronizado com o schema
- O schema já possui a coluna `metadata` definida, o banco apenas estava desatualizado

---

## 📁 Arquivos

- **Script:** `server/scripts/fixUsersMetadataColumn.ts`
- **Instruções:** `FIX_METADATA_INSTRUCOES.md` (este arquivo)

---

**Status:** ✅ Script pronto para execução

