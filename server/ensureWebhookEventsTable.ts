import { db } from "./db.js";
import { sql } from "drizzle-orm";

/**
 * Garante que as tabelas de webhook existem no banco de dados
 * Esta função deve ser chamada na inicialização do servidor
 */
export async function ensureWebhookEventsTable(): Promise<void> {
  try {
    console.log("[WEBHOOK-EVENTS] Verificando existência das tabelas de webhook...");
    
    // Verificar se a tabela webhook_events existe
    const webhookEventsExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events'
      );
    `);

    const exists = (webhookEventsExists.rows[0] as any)?.exists || false;

    if (!exists) {
      // Tabela não existe, criar
      console.log("[WEBHOOK-EVENTS] ⚠️  Tabela webhook_events não encontrada. Criando...");
      
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS webhook_events (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          event TEXT NOT NULL,
          type TEXT NOT NULL,
          payload JSONB NOT NULL,
          status VARCHAR NOT NULL DEFAULT 'pending',
          received_at TIMESTAMP NOT NULL DEFAULT NOW(),
          processed_at TIMESTAMP,
          error_message TEXT,
          retry_count INTEGER NOT NULL DEFAULT 0,
          last_retry_at TIMESTAMP,
          processed BOOLEAN NOT NULL DEFAULT false
        );
      `);

      console.log("[WEBHOOK-EVENTS] ✅ Tabela webhook_events criada com sucesso!");
    } else {
      console.log("[WEBHOOK-EVENTS] ✅ Tabela webhook_events já existe");
    }

    // Verificar se a tabela webhook_processed_events existe
    const processedEventsExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_processed_events'
      );
    `);

    const processedExists = (processedEventsExists.rows[0] as any)?.exists || false;

    if (!processedExists) {
      console.log("[WEBHOOK-EVENTS] ⚠️  Tabela webhook_processed_events não encontrada. Criando...");
      
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS webhook_processed_events (
          event_id VARCHAR PRIMARY KEY,
          event_type VARCHAR NOT NULL,
          webhook_event_id VARCHAR NOT NULL,
          processed_at TIMESTAMP NOT NULL DEFAULT NOW(),
          FOREIGN KEY (webhook_event_id) REFERENCES webhook_events(id) ON DELETE CASCADE
        );
      `);

      console.log("[WEBHOOK-EVENTS] ✅ Tabela webhook_processed_events criada com sucesso!");
    } else {
      console.log("[WEBHOOK-EVENTS] ✅ Tabela webhook_processed_events já existe");
    }
    
  } catch (error: any) {
    console.error("[WEBHOOK-EVENTS] ❌ ERRO ao verificar/criar tabelas de webhook:", error);
    console.error("[WEBHOOK-EVENTS] Detalhes do erro:", {
      message: error.message,
      stack: error.stack,
    });
    // Não lançar erro - permitir que o servidor inicie mesmo se houver problema
    // Mas logar como erro crítico
  }
}

