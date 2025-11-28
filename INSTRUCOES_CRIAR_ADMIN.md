# Instruções - Criar Usuário Admin no Neon

## 📋 Dados do Admin

- **Email:** `matheus.wallefy@gmail.com`
- **Senha:** `82556682`
- **Role:** `admin`
- **Status:** `authenticated`
- **Plano:** `premium`
- **Billing Status:** `active`

---

## 🔐 Hash da Senha

O hash da senha `82556682` gerado com bcrypt (salt rounds 10):

```
$2b$10$GSJAuUEGn0.NyWhSsF8gne45m9LZb9.MLGPRGBTRCG7w/jEVAFu6e
```

---

## 1️⃣ SQL Final (INSERT)

O SQL completo está no arquivo `INSERT_ADMIN_USER.sql`.

**SQL para copiar e colar:**

```sql
INSERT INTO users (
  id,
  email,
  password_hash,
  role,
  status,
  plano,
  billing_status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'matheus.wallefy@gmail.com',
  '$2b$10$GSJAuUEGn0.NyWhSsF8gne45m9LZb9.MLGPRGBTRCG7w/jEVAFu6e',
  'admin',
  'authenticated',
  'premium',
  'active',
  NOW(),
  NOW()
);
```

---

## 3️⃣ Onde Executar no Neon

1. Acesse o **Neon Console** (https://console.neon.tech)
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral)
4. Cole o SQL do arquivo `INSERT_ADMIN_USER.sql`
5. Clique em **Run** ou pressione `Ctrl+Enter` (ou `Cmd+Enter` no Mac)
6. Verifique se o usuário foi criado com sucesso

---

## 4️⃣ Rota Temporária (Alternativa)

Se preferir criar via browser, use a rota temporária:

**URL:** `https://seu-dominio.com/api/admin/create-super-admin`

**Método:** `POST`

**Como usar:**
1. Abra o browser
2. Acesse a URL acima (ou use Postman/curl)
3. A rota criará o admin automaticamente
4. **IMPORTANTE:** Apague a rota depois de usar!

**Exemplo com curl:**
```bash
curl -X POST https://seu-dominio.com/api/admin/create-super-admin
```

---

## ✅ Verificação

Após executar, verifique se o usuário foi criado:

```sql
SELECT id, email, role, status, plano, billing_status 
FROM users 
WHERE email = 'matheus.wallefy@gmail.com';
```

---

## ⚠️ Importante

- O hash foi gerado com a mesma função `hashPassword()` do backend (bcrypt, salt rounds 10)
- A senha em texto puro é: `82556682`
- Após criar o admin, você pode fazer login normalmente

