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

async function migrateTransacoesTable() {
  const pool = new Pool({ connectionString: getDatabaseUrl() });
  
  try {
    console.log("\n=== INICIANDO MIGRATION DA TABELA transacoes ===\n");
    
    // Verificar se as colunas já existem
    const checkQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'transacoes'
      AND column_name IN ('status', 'pending_kind', 'payment_method');
    `;
    
    const existingColumns = await pool.query(checkQuery);
    const existingNames = existingColumns.rows.map((r: any) => r.column_name);
    
    console.log("Colunas existentes:", existingNames.length > 0 ? existingNames.join(", ") : "nenhuma");
    
    // 1. Adicionar coluna status
    if (!existingNames.includes('status')) {
      console.log("\n[1/3] Adicionando coluna 'status'...");
      await pool.query(`
        ALTER TABLE transacoes
        ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'paid'
        CHECK (status IN ('paid', 'pending'));
      `);
      console.log("✅ Coluna 'status' adicionada com sucesso!");
    } else {
      console.log("\n[1/3] Coluna 'status' já existe. Verificando constraint...");
      // Verificar se tem a constraint correta
      const statusCheck = await pool.query(`
        SELECT check_clause
        FROM information_schema.check_constraints
        WHERE constraint_name LIKE '%status%'
        AND table_name = 'transacoes';
      `);
      
      if (statusCheck.rows.length === 0) {
        console.log("   Adicionando constraint CHECK para status...");
        await pool.query(`
          ALTER TABLE transacoes
          ADD CONSTRAINT transacoes_status_check
          CHECK (status IN ('paid', 'pending'));
        `);
        console.log("✅ Constraint CHECK adicionada para 'status'!");
      } else {
        console.log("✅ Constraint CHECK já existe para 'status'!");
      }
    }
    
    // 2. Adicionar coluna pending_kind
    if (!existingNames.includes('pending_kind')) {
      console.log("\n[2/3] Adicionando coluna 'pending_kind'...");
      await pool.query(`
        ALTER TABLE transacoes
        ADD COLUMN pending_kind VARCHAR(20) NULL
        CHECK (pending_kind IN ('to_receive', 'to_pay'));
      `);
      console.log("✅ Coluna 'pending_kind' adicionada com sucesso!");
    } else {
      console.log("\n[2/3] Coluna 'pending_kind' já existe. Verificando se aceita NULL...");
      // Verificar se aceita NULL
      const pendingKindInfo = await pool.query(`
        SELECT is_nullable
        FROM information_schema.columns
        WHERE table_name = 'transacoes'
        AND column_name = 'pending_kind';
      `);
      
      if (pendingKindInfo.rows[0]?.is_nullable !== 'YES') {
        console.log("   Alterando para aceitar NULL...");
        await pool.query(`
          ALTER TABLE transacoes
          ALTER COLUMN pending_kind DROP NOT NULL;
        `);
        console.log("✅ Coluna 'pending_kind' agora aceita NULL!");
      } else {
        console.log("✅ Coluna 'pending_kind' já aceita NULL!");
      }
      
      // Verificar constraint
      const pendingKindCheck = await pool.query(`
        SELECT check_clause
        FROM information_schema.check_constraints
        WHERE constraint_name LIKE '%pending_kind%'
        AND table_name = 'transacoes';
      `);
      
      if (pendingKindCheck.rows.length === 0) {
        console.log("   Adicionando constraint CHECK para pending_kind...");
        await pool.query(`
          ALTER TABLE transacoes
          ADD CONSTRAINT transacoes_pending_kind_check
          CHECK (pending_kind IS NULL OR pending_kind IN ('to_receive', 'to_pay'));
        `);
        console.log("✅ Constraint CHECK adicionada para 'pending_kind'!");
      } else {
        console.log("✅ Constraint CHECK já existe para 'pending_kind'!");
      }
    }
    
    // 3. Adicionar coluna payment_method
    if (!existingNames.includes('payment_method')) {
      console.log("\n[3/3] Adicionando coluna 'payment_method'...");
      await pool.query(`
        ALTER TABLE transacoes
        ADD COLUMN payment_method VARCHAR(20) NOT NULL DEFAULT 'other'
        CHECK (payment_method IN ('cash', 'pix', 'transfer', 'credit_card', 'debit_card', 'boleto', 'other'));
      `);
      console.log("✅ Coluna 'payment_method' adicionada com sucesso!");
    } else {
      console.log("\n[3/3] Coluna 'payment_method' já existe. Verificando constraint...");
      // Verificar se tem a constraint correta
      const paymentMethodCheck = await pool.query(`
        SELECT check_clause
        FROM information_schema.check_constraints
        WHERE constraint_name LIKE '%payment_method%'
        AND table_name = 'transacoes';
      `);
      
      if (paymentMethodCheck.rows.length === 0) {
        console.log("   Adicionando constraint CHECK para payment_method...");
        await pool.query(`
          ALTER TABLE transacoes
          ADD CONSTRAINT transacoes_payment_method_check
          CHECK (payment_method IN ('cash', 'pix', 'transfer', 'credit_card', 'debit_card', 'boleto', 'other'));
        `);
        console.log("✅ Constraint CHECK adicionada para 'payment_method'!");
      } else {
        console.log("✅ Constraint CHECK já existe para 'payment_method'!");
      }
    }
    
    // Verificar estrutura final
    console.log("\n=== VERIFICANDO ESTRUTURA FINAL ===\n");
    const finalCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'transacoes'
      AND column_name IN ('status', 'pending_kind', 'payment_method')
      ORDER BY column_name;
    `);
    
    console.log("Colunas adicionadas/modificadas:");
    for (const row of finalCheck.rows) {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    }
    
    console.log("\n✅ Migration concluída com sucesso!\n");
    
  } catch (error: any) {
    console.error("\n❌ Erro na migration:", error.message);
    console.error(error);
    throw error;
  } finally {
    await pool.end();
  }
}

migrateTransacoesTable()
  .then(() => {
    console.log("✅ Processo finalizado!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });

