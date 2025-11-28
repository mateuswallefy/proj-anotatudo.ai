-- SQL para inserir usuário admin no banco Neon
-- Execute este script no SQL Editor do Neon

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

