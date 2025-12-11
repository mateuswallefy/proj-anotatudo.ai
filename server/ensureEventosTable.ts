import { db } from "./db.js";
import { sql } from "drizzle-orm";

/**
 * Garante que a tabela eventos existe no banco de dados
 * Esta função deve ser chamada na inicialização do servidor
 */
export async function ensureEventosTable(): Promise<void> {
  try {
    console.log("[EVENTOS] Verificando existência da tabela eventos...");
    
    // Verificar se a tabela eventos existe
    const eventosExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'eventos'
      );
    `);

    const exists = (eventosExists.rows[0] as any)?.exists || false;

    if (!exists) {
      // Tabela não existe, criar
      console.log("[EVENTOS] ⚠️  Tabela eventos não encontrada. Criando...");
      
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS eventos (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          titulo VARCHAR NOT NULL,
          descricao TEXT,
          data DATE NOT NULL,
          hora VARCHAR,
          lembrete_minutos INTEGER,
          origem VARCHAR NOT NULL DEFAULT 'manual',
          whatsapp_message_id VARCHAR,
          notificado BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);

      // Criar índices
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS IDX_eventos_user_id ON eventos(user_id);
      `);
      
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS IDX_eventos_data ON eventos(data);
      `);
      
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS IDX_eventos_notificado ON eventos(notificado);
      `);

      console.log("[EVENTOS] ✅ Tabela eventos criada com sucesso!");
    } else {
      console.log("[EVENTOS] ✅ Tabela eventos já existe");
    }
  } catch (error) {
    console.error("[EVENTOS] ❌ Erro ao verificar/criar tabela eventos:", error);
    throw error;
  }
}

