import { db } from "./db.js";
import { sql } from "drizzle-orm";

/**
 * Garante que a tabela webhook_events existe no banco de dados
 * Esta função deve ser chamada na inicialização do servidor
 */
export async function ensureWebhookEventsTable(): Promise<void> {
  try {
    console.log("[WEBHOOK-EVENTS] Verificando existência da tabela webhook_events...");
    
    // Verificar se a tabela existe
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events'
      );
    `);

    const exists = (tableExists.rows[0] as any)?.exists || false;

    if (exists) {
      console.log("[WEBHOOK-EVENTS] ✅ Tabela webhook_events já existe");
      return;
    }

    // Tabela não existe, criar
    console.log("[WEBHOOK-EVENTS] ⚠️  Tabela webhook_events não encontrada. Criando...");
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS webhook_events (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        type TEXT NOT NULL,
        payload JSONB NOT NULL,
        received_at TIMESTAMP NOT NULL DEFAULT NOW(),
        processed BOOLEAN NOT NULL DEFAULT false
      );
    `);

    console.log("[WEBHOOK-EVENTS] ✅ Tabela webhook_events criada com sucesso!");
    
  } catch (error: any) {
    console.error("[WEBHOOK-EVENTS] ❌ ERRO ao verificar/criar tabela webhook_events:", error);
    console.error("[WEBHOOK-EVENTS] Detalhes do erro:", {
      message: error.message,
      stack: error.stack,
    });
    // Não lançar erro - permitir que o servidor inicie mesmo se houver problema
    // Mas logar como erro crítico
  }
}

