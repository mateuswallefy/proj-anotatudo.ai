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

async function checkTransacoesTable() {
  const pool = new Pool({ connectionString: getDatabaseUrl() });
  
  try {
    const query = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'transacoes'
      ORDER BY ordinal_position;
    `;
    
    const result = await pool.query(query);
    
    console.log("\n=== ESTRUTURA DA TABELA transacoes ===\n");
    console.log("column_name | data_type | is_nullable | column_default");
    console.log("------------|-----------|-------------|----------------");
    
    for (const row of result.rows) {
      console.log(
        `${row.column_name.padEnd(12)} | ${row.data_type.padEnd(9)} | ${row.is_nullable.padEnd(11)} | ${row.column_default || 'NULL'}`
      );
    }
    
    console.log(`\nTotal de colunas: ${result.rows.length}\n`);
    
    // Verificar constraints
    const constraintsQuery = `
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        cc.check_clause
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      LEFT JOIN information_schema.check_constraints cc
        ON tc.constraint_name = cc.constraint_name
      WHERE tc.table_name = 'transacoes'
      ORDER BY tc.constraint_type, tc.constraint_name;
    `;
    
    const constraintsResult = await pool.query(constraintsQuery);
    
    if (constraintsResult.rows.length > 0) {
      console.log("\n=== CONSTRAINTS DA TABELA transacoes ===\n");
      for (const row of constraintsResult.rows) {
        console.log(`${row.constraint_type}: ${row.constraint_name}`);
        if (row.column_name) {
          console.log(`  Column: ${row.column_name}`);
        }
        if (row.check_clause) {
          console.log(`  Check: ${row.check_clause}`);
        }
        console.log();
      }
    }
    
  } catch (error: any) {
    console.error("Erro ao verificar tabela:", error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

checkTransacoesTable()
  .then(() => {
    console.log("\n✅ Verificação concluída!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro:", error);
    process.exit(1);
  });

