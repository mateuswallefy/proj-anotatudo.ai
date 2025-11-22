-- Migration: Add webhook_logs and webhook_event_headers tables
-- Created: 2025-01-XX
-- Description: Adds support for detailed webhook logs and original headers storage

-- Table: webhook_logs
CREATE TABLE IF NOT EXISTS "webhook_logs" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "webhook_event_id" VARCHAR NOT NULL REFERENCES "webhook_events"("id") ON DELETE CASCADE,
  "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
  "step" TEXT NOT NULL,
  "payload" JSONB,
  "error" TEXT,
  "level" VARCHAR NOT NULL DEFAULT 'info' CHECK ("level" IN ('info', 'warning', 'error'))
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS "webhook_logs_webhook_event_id_idx" ON "webhook_logs"("webhook_event_id");
CREATE INDEX IF NOT EXISTS "webhook_logs_timestamp_idx" ON "webhook_logs"("timestamp");

-- Table: webhook_event_headers
CREATE TABLE IF NOT EXISTS "webhook_event_headers" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "webhook_event_id" VARCHAR NOT NULL REFERENCES "webhook_events"("id") ON DELETE CASCADE,
  "headers" JSONB NOT NULL,
  "saved_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("webhook_event_id")
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS "webhook_event_headers_webhook_event_id_idx" ON "webhook_event_headers"("webhook_event_id");

