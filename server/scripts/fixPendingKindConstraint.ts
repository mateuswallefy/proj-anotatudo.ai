import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const getDatabaseUrl = () => {
  const databaseUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "NEON_DATABASE_URL must be set. Add it in Replit Secrets.",
    );
  }
  return databaseUrl;
};

async function fixPendingKindConstraint() {
  const pool = new Pool({ connectionString: getDatabaseUrl() });
  
  try {
    console.log("\n=== CORRIGINDO CONSTRAINT DE pending_kind ===\n");
    
    // Remover constraint antiga se existir
    console.log("[1/2] Removendo constraint antiga (se existir)...");
    try {
      await pool.query(`
        ALTER TABLE transacoes
        DROP CONSTRAINT IF EXISTS transacoes_pending_kind_check;
      `);
      console.log("✅ Constraint antiga removida (ou não existia)");
    } catch (error: any) {
      console.log("⚠️  Erro ao remover constraint (pode não existir):", error.message);
    }
    
    // Adicionar nova constraint que permite NULL
    console.log("\n[2/2] Adicionando nova constraint que permite NULL...");
    await pool.query(`
      ALTER TABLE transacoes
      ADD CONSTRAINT transacoes_pending_kind_check
      CHECK (pending_kind IS NULL OR pending_kind IN ('to_receive', 'to_pay'));
    `);
    console.log("✅ Nova constraint adicionada com sucesso!");
    
    // Verificar constraint
    const checkResult = await pool.query(`
      SELECT check_clause
      FROM information_schema.check_constraints
      WHERE constraint_name = 'transacoes_pending_kind_check';
    `);
    
    if (checkResult.rows.length > 0) {
      console.log("\n✅ Constraint verificada:");
      console.log(`   ${checkResult.rows[0].check_clause}`);
    }
    
    console.log("\n✅ Correção concluída!\n");
    
  } catch (error: any) {
    console.error("\n❌ Erro:", error.message);
    console.error(error);
    throw error;
  } finally {
    await pool.end();
  }
}

fixPendingKindConstraint()
  .then(() => {
    console.log("✅ Processo finalizado!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });

