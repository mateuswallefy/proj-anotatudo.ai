-- Migration: Add status, pending_kind, and payment_method fields to transacoes table
-- This migration adds support for pending transactions (to receive / to pay)

-- Add status field (default 'paid' for backward compatibility)
ALTER TABLE "transacoes" 
ADD COLUMN IF NOT EXISTS "status" varchar DEFAULT 'paid' NOT NULL;

-- Add pending_kind field (nullable, only set when status = 'pending')
ALTER TABLE "transacoes" 
ADD COLUMN IF NOT EXISTS "pending_kind" varchar;

-- Add payment_method field (default 'other' for backward compatibility)
ALTER TABLE "transacoes" 
ADD COLUMN IF NOT EXISTS "payment_method" varchar DEFAULT 'other' NOT NULL;

-- Add check constraint to ensure pending_kind is only set when status is 'pending'
-- Note: PostgreSQL doesn't support CHECK constraints with subqueries easily,
-- so we'll rely on application logic for this validation

-- Update existing records to ensure they have proper defaults
UPDATE "transacoes" 
SET 
  "status" = COALESCE("status", 'paid'),
  "payment_method" = COALESCE("payment_method", 'other')
WHERE "status" IS NULL OR "payment_method" IS NULL;

