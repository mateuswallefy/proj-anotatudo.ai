# Instruções - Reset de Senha do Admin

## 📋 Informações

**Email do Admin:** `matheus.wallefy@gmail.com`  
**Nova Senha:** `82556682.com`  
**Arquivo do Script:** `server/scripts/resetAdminPassword.ts`

---

## 🚀 Comando para Executar

### No Replit (Terminal):

```bash
NODE_ENV=production npx tsx server/scripts/resetAdminPassword.ts
```

### Ou simplesmente:

```bash
npx tsx server/scripts/resetAdminPassword.ts
```

---

## ✅ O que o Script Faz

1. ✅ Busca o usuário pelo email `matheus.wallefy@gmail.com`
2. ✅ Gera hash bcrypt para a nova senha `82556682.com` (usando `hashPassword()` existente)
3. ✅ Atualiza **APENAS** o campo `passwordHash` na tabela `users`
4. ✅ **NÃO altera** metadata, billingStatus, assinatura, id, logs, ou qualquer outro campo
5. ✅ Verifica se a atualização foi bem-sucedida
6. ✅ Imprime "Senha redefinida com sucesso" no console

---

## 🔒 Segurança

- ✅ Usa a função `hashPassword()` existente (bcrypt com salt rounds 10)
- ✅ Senha nunca é salva em texto puro
- ✅ Apenas o campo `passwordHash` é atualizado
- ✅ Todos os outros dados do usuário permanecem intactos

---

## 📝 Saída Esperada

```
[Reset Admin Password] Iniciando processo...
[Reset Admin Password] Email: matheus.wallefy@gmail.com
[Reset Admin Password] Buscando usuário pelo email...
[Reset Admin Password] ✅ Usuário encontrado: <user-id>
[Reset Admin Password] Nome: <nome>
[Reset Admin Password] Role: admin
[Reset Admin Password] Gerando hash bcrypt para a nova senha...
[Reset Admin Password] ✅ Hash gerado com sucesso
[Reset Admin Password] Atualizando passwordHash no banco de dados...
[Reset Admin Password] ✅ Senha redefinida com sucesso
[Reset Admin Password] ✅ Usuário ID: <user-id>
[Reset Admin Password] ✅ Email: matheus.wallefy@gmail.com
[Reset Admin Password] ✅ Role: admin
[Reset Admin Password] ✅ Nova senha aplicada: 82556682.com
[Reset Admin Password] ✅ Hash salvo no banco: $2a$10$...
```

---

## ⚠️ Avisos

- O script verifica se está em modo production, mas continua mesmo se não estiver
- Se o usuário não tiver role 'admin', o script avisa mas continua
- Se o usuário não for encontrado, o script para com erro

---

## ✅ Verificação Pós-Execução

Após executar o script, você pode verificar:

1. Fazer login com:
   - Email: `matheus.wallefy@gmail.com`
   - Senha: `82556682.com`

2. Verificar no banco (opcional):
   ```sql
   SELECT id, email, role, password_hash 
   FROM users 
   WHERE email = 'matheus.wallefy@gmail.com';
   ```

---

**Status:** ✅ Script criado e pronto para uso

