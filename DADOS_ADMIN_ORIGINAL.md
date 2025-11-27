# 📋 DADOS EXATOS DO ADMIN ORIGINAL

Este documento contém os dados EXATOS do admin original do banco de dados atual.

## ⚠️ IMPORTANTE

**SEM O `password_hash`, o admin NÃO conseguirá fazer login no ambiente novo!**

---

## 1️⃣ ID do Admin

```
a8fdb8b9-b787-4d20-a07c-4d086326ec7e
```

**Tabela:** `users.id`

---

## 2️⃣ Email do Admin

```
matheus.wallefy@gmail.com
```

**Tabela:** `users.email`

---

## 3️⃣ Password Hash

⚠️ **NÃO é a senha, é o HASH que está na coluna `password_hash`**

```
$2b$10$U/072iS2uzPGeHyg0Ls0ueuFIbwwPfSTcN9V4MbFe1MM8MMz8PZty
```

**Tabela:** `users.password_hash`  
**Tamanho:** 60 caracteres  
**Tipo:** bcrypt hash

---

## 4️⃣ Campos Obrigatórios

### Role
```
admin
```
**Tabela:** `users.role`

### Status
```
authenticated
```
**Tabela:** `users.status`

### Billing Status
```
active
```
**Tabela:** `users.billing_status`

### Plano
```
premium
```
**Tabela:** `users.plano`

### Created At
```
2025-11-15T23:30:48.698Z
```
**Tabela:** `users.created_at`

### Updated At
```
2025-11-20T19:15:15.709Z
```
**Tabela:** `users.updated_at`

---

## 5️⃣ Campos Extras (Opcionais)

### First Name
```
Mateus
```
**Tabela:** `users.first_name`

### Last Name
```
NULL
```
**Tabela:** `users.last_name`

### Telefone
```
559183139299
```
**Tabela:** `users.telefone`

### WhatsApp Number
```
NULL
```
**Tabela:** `users.whatsapp_number`

### Profile Image URL
```
NULL
```
**Tabela:** `users.profile_image_url`

### Plan Label
```
NULL
```
**Tabela:** `users.plan_label`

### Metadata
```json
{}
```
**Tabela:** `users.metadata` (JSONB)

---

## 📝 SQL INSERT para Criar o Admin no Novo Ambiente

```sql
INSERT INTO users (
  id, 
  email, 
  password_hash, 
  role, 
  status, 
  billing_status, 
  plano, 
  created_at, 
  updated_at, 
  first_name, 
  telefone, 
  metadata
) VALUES (
  'a8fdb8b9-b787-4d20-a07c-4d086326ec7e', 
  'matheus.wallefy@gmail.com', 
  '$2b$10$U/072iS2uzPGeHyg0Ls0ueuFIbwwPfSTcN9V4MbFe1MM8MMz8PZty', 
  'admin', 
  'authenticated', 
  'active', 
  'premium', 
  '2025-11-15T23:30:48.698Z', 
  '2025-11-20T19:15:15.709Z', 
  'Mateus', 
  '559183139299', 
  '{}'::jsonb
);
```

---

## 📋 Dados em Formato JSON

```json
{
  "id": "a8fdb8b9-b787-4d20-a07c-4d086326ec7e",
  "email": "matheus.wallefy@gmail.com",
  "passwordHash": "$2b$10$U/072iS2uzPGeHyg0Ls0ueuFIbwwPfSTcN9V4MbFe1MM8MMz8PZty",
  "role": "admin",
  "status": "authenticated",
  "billingStatus": "active",
  "plano": "premium",
  "createdAt": "2025-11-15T23:30:48.698Z",
  "updatedAt": "2025-11-20T19:15:15.709Z",
  "firstName": "Mateus",
  "lastName": null,
  "telefone": "559183139299",
  "whatsappNumber": null,
  "profileImageUrl": null,
  "planLabel": null,
  "metadata": {}
}
```

---

## 🔄 Como Re-executar a Exportação

Se precisar exportar novamente os dados do admin:

```bash
npx tsx server/scripts/exportAdminData.ts
```

O script irá:
1. Buscar o admin pelo email `matheus.wallefy@gmail.com`
2. Se não encontrar, buscará por `role='admin'`
3. Exibirá todos os dados necessários
4. Gerará o SQL INSERT e JSON para uso

---

## ✅ Checklist para Criar o Admin no Novo Ambiente

- [ ] ID: `a8fdb8b9-b787-4d20-a07c-4d086326ec7e`
- [ ] Email: `matheus.wallefy@gmail.com`
- [ ] Password Hash: `$2b$10$U/072iS2uzPGeHyg0Ls0ueuFIbwwPfSTcN9V4MbFe1MM8MMz8PZty`
- [ ] Role: `admin`
- [ ] Status: `authenticated`
- [ ] Billing Status: `active`
- [ ] Plano: `premium`
- [ ] Created At: `2025-11-15T23:30:48.698Z`
- [ ] Updated At: `2025-11-20T19:15:15.709Z`
- [ ] First Name: `Mateus`
- [ ] Telefone: `559183139299`
- [ ] Metadata: `{}`

---

**Última atualização:** 2025-01-27  
**Script de exportação:** `server/scripts/exportAdminData.ts`

