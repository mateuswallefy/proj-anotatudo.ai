/**
 * Script para adicionar a coluna interval na tabela subscriptions
 * 
 * Uso:
 *   npx tsx server/scripts/fixSubscriptionsIntervalColumn.ts
 * 
 * Requisitos:
 *   - DATABASE_URL configurada (banco de produção)
 *   - Acesso ao banco PostgreSQL
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fixSubscriptionsIntervalColumn() {
  try {
    console.log(`[Fix Subscriptions Interval] Iniciando processo...`);
    console.log(`[Fix Subscriptions Interval] Conectando ao banco de dados...`);
    
    // 1. Verificar se a coluna interval já existe
    console.log(`[Fix Subscriptions Interval] Verificando se a coluna 'interval' existe...`);
    
    const checkColumnQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'subscriptions' AND column_name = 'interval';
    `;
    
    const checkResult = await pool.query(checkColumnQuery);
    const columnExists = checkResult.rows.length > 0;
    
    if (columnExists) {
      console.log(`[Fix Subscriptions Interval] ✅ Coluna 'interval' já existe na tabela 'subscriptions'`);
      console.log(`[Fix Subscriptions Interval] Detalhes da coluna:`);
      checkResult.rows.forEach((row: any) => {
        console.log(`  - Nome: ${row.column_name}`);
        console.log(`  - Tipo: ${row.data_type}`);
        console.log(`  - Nullable: ${row.is_nullable}`);
        console.log(`  - Default: ${row.column_default || 'N/A'}`);
      });
    } else {
      console.log(`[Fix Subscriptions Interval] ⚠️  Coluna 'interval' NÃO existe na tabela 'subscriptions'`);
      console.log(`[Fix Subscriptions Interval] Criando coluna 'interval'...`);
      
      // 2. Adicionar a coluna interval
      const addColumnQuery = `
        ALTER TABLE subscriptions
        ADD COLUMN interval VARCHAR NOT NULL DEFAULT 'monthly';
      `;
      
      await pool.query(addColumnQuery);
      console.log(`[Fix Subscriptions Interval] ✅ Coluna 'interval' criada com sucesso!`);
    }
    
    // 3. Verificar estrutura final
    console.log(`[Fix Subscriptions Interval] Verificando estrutura final da tabela 'subscriptions'...`);
    
    const allColumnsQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'subscriptions'
      ORDER BY ordinal_position;
    `;
    
    const allColumnsResult = await pool.query(allColumnsQuery);
    
    console.log(`[Fix Subscriptions Interval] Estrutura da tabela 'subscriptions' (${allColumnsResult.rows.length} colunas):`);
    allColumnsResult.rows.forEach((row: any, index: number) => {
      console.log(`  ${index + 1}. ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });
    
    // 4. Verificar especificamente a coluna interval
    const intervalCheck = allColumnsResult.rows.find((row: any) => row.column_name === 'interval');
    if (intervalCheck) {
      console.log(`[Fix Subscriptions Interval] ✅ Confirmação: Coluna 'interval' está presente na tabela`);
      console.log(`[Fix Subscriptions Interval] Tipo: ${intervalCheck.data_type}`);
      console.log(`[Fix Subscriptions Interval] Nullable: ${intervalCheck.is_nullable}`);
      console.log(`[Fix Subscriptions Interval] Default: ${intervalCheck.column_default || 'N/A'}`);
    } else {
      throw new Error("Coluna 'interval' não foi encontrada após tentativa de criação!");
    }
    
    // 5. Testar consulta
    console.log(`[Fix Subscriptions Interval] Testando consulta na coluna 'interval'...`);
    const testQuery = await pool.query(`SELECT id, user_id, provider, interval FROM subscriptions LIMIT 5`);
    console.log(`[Fix Subscriptions Interval] ✅ Consulta de teste bem-sucedida!`);
    console.log(`[Fix Subscriptions Interval] Registros encontrados: ${testQuery.rows.length}`);
    
    if (testQuery.rows.length > 0) {
      console.log(`[Fix Subscriptions Interval] Primeiros registros:`);
      testQuery.rows.forEach((row: any, index: number) => {
        console.log(`  ${index + 1}. ID: ${row.id}, Provider: ${row.provider}, Interval: ${row.interval || 'monthly (default)'}`);
      });
    } else {
      console.log(`[Fix Subscriptions Interval] ℹ️  Tabela está vazia (isso é normal se não houver assinaturas ainda)`);
    }
    
    console.log(`[Fix Subscriptions Interval] ✅ Processo concluído com sucesso!`);
    
    // Fechar conexão
    await pool.end();
    console.log(`[Fix Subscriptions Interval] Conexão fechada.`);
    
    process.exit(0);
  } catch (error: any) {
    console.error("[Fix Subscriptions Interval] ❌ ERRO:", error.message);
    console.error("[Fix Subscriptions Interval] Stack:", error.stack);
    
    // Tentar fechar conexão mesmo em caso de erro
    try {
      await pool.end();
    } catch (closeError) {
      // Ignorar erro ao fechar
    }
    
    process.exit(1);
  }
}

// Executar script
fixSubscriptionsIntervalColumn();

