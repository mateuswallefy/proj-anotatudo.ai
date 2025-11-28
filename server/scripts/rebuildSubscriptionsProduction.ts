/**
 * Script para reconstruir a tabela subscriptions no banco de produção
 * 
 * IMPORTANTE: Este script irá DELETAR todos os dados da tabela subscriptions!
 * 
 * Uso:
 *   DATABASE_URL=<url_producao> npx tsx server/scripts/rebuildSubscriptionsProduction.ts
 * 
 * Ou em produção (Vercel):
 *   npx tsx server/scripts/rebuildSubscriptionsProduction.ts
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

async function rebuildSubscriptionsTable() {
  const client = await pool.connect();
  
  try {
    console.log(`[Rebuild Subscriptions Production] Iniciando processo...`);
    console.log(`[Rebuild Subscriptions Production] Conectado ao banco: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')}`);
    
    // 1. Verificar se a tabela existe
    console.log(`[Rebuild Subscriptions Production] Verificando se a tabela 'subscriptions' existe...`);
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'subscriptions'
      );
    `;
    
    const tableExistsResult = await client.query(checkTableQuery);
    const tableExists = tableExistsResult.rows[0].exists;
    
    if (tableExists) {
      console.log(`[Rebuild Subscriptions Production] ⚠️  Tabela 'subscriptions' existe. Será deletada e recriada.`);
      console.log(`[Rebuild Subscriptions Production] ⚠️  ATENÇÃO: Todos os dados serão perdidos!`);
    } else {
      console.log(`[Rebuild Subscriptions Production] Tabela 'subscriptions' não existe. Será criada.`);
    }
    
    // 2. Deletar a tabela se existir (CASCADE remove dependências)
    console.log(`[Rebuild Subscriptions Production] Deletando tabela 'subscriptions' (se existir)...`);
    await client.query('DROP TABLE IF EXISTS subscriptions CASCADE;');
    console.log(`[Rebuild Subscriptions Production] ✅ Tabela deletada (ou não existia).`);
    
    // 3. Criar a tabela com a estrutura EXATA (snake_case)
    console.log(`[Rebuild Subscriptions Production] Criando tabela 'subscriptions' com estrutura correta...`);
    
    const createTableQuery = `
      CREATE TABLE subscriptions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider VARCHAR NOT NULL DEFAULT 'manual',
        provider_subscription_id VARCHAR NOT NULL DEFAULT gen_random_uuid()::text,
        plan_name VARCHAR NOT NULL DEFAULT 'Premium',
        price_cents INTEGER NOT NULL DEFAULT 0,
        currency VARCHAR NOT NULL DEFAULT 'BRL',
        billing_interval VARCHAR NOT NULL DEFAULT 'month',
        interval VARCHAR NOT NULL DEFAULT 'monthly',
        status VARCHAR NOT NULL DEFAULT 'active',
        trial_ends_at TIMESTAMP,
        current_period_end TIMESTAMP,
        cancel_at TIMESTAMP,
        meta JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;
    
    await client.query(createTableQuery);
    console.log(`[Rebuild Subscriptions Production] ✅ Tabela 'subscriptions' criada com sucesso!`);
    
    // 4. Verificar estrutura da tabela criada
    console.log(`[Rebuild Subscriptions Production] Verificando estrutura da tabela...`);
    const columnsQuery = `
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'subscriptions' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    const columnsResult = await client.query(columnsQuery);
    
    console.log(`[Rebuild Subscriptions Production] ✅ Estrutura da tabela (${columnsResult.rows.length} colunas):`);
    columnsResult.rows.forEach((col: any, index: number) => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? `DEFAULT ${col.column_default}` : '';
      const maxLength = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
      console.log(`  ${index + 1}. ${col.column_name} ${col.data_type}${maxLength} ${nullable} ${defaultVal}`);
    });
    
    // 5. Verificar constraints e foreign keys
    console.log(`[Rebuild Subscriptions Production] Verificando constraints...`);
    const constraintsQuery = `
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      LEFT JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'subscriptions' AND tc.table_schema = 'public';
    `;
    
    const constraintsResult = await client.query(constraintsQuery);
    console.log(`[Rebuild Subscriptions Production] Constraints encontrados (${constraintsResult.rows.length}):`);
    constraintsResult.rows.forEach((constraint: any) => {
      if (constraint.constraint_type === 'FOREIGN KEY') {
        console.log(`  - ${constraint.constraint_name}: ${constraint.constraint_type} (${constraint.column_name} -> ${constraint.foreign_table_name}.${constraint.foreign_column_name})`);
      } else {
        console.log(`  - ${constraint.constraint_name}: ${constraint.constraint_type}`);
      }
    });
    
    // 6. Testar SELECT
    console.log(`[Rebuild Subscriptions Production] Testando SELECT...`);
    const testSelectQuery = `SELECT * FROM subscriptions LIMIT 5;`;
    const testResult = await client.query(testSelectQuery);
    console.log(`[Rebuild Subscriptions Production] ✅ SELECT funcionando. ${testResult.rows.length} registros encontrados.`);
    
    if (testResult.rows.length > 0) {
      console.log(`[Rebuild Subscriptions Production] Primeiros registros:`);
      testResult.rows.forEach((row: any, index: number) => {
        console.log(`  ${index + 1}. ${JSON.stringify(row)}`);
      });
    } else {
      console.log(`[Rebuild Subscriptions Production] Tabela vazia (esperado após rebuild).`);
    }
    
    // 7. Verificar índices
    console.log(`[Rebuild Subscriptions Production] Verificando índices...`);
    const indexesQuery = `
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'subscriptions' AND schemaname = 'public';
    `;
    
    const indexesResult = await client.query(indexesQuery);
    console.log(`[Rebuild Subscriptions Production] Índices encontrados (${indexesResult.rows.length}):`);
    indexesResult.rows.forEach((index: any) => {
      console.log(`  - ${index.indexname}: ${index.indexdef}`);
    });
    
    console.log(`[Rebuild Subscriptions Production] ✅ Finalizado com sucesso.`);
    console.log(`[Rebuild Subscriptions Production] ✅ Tabela 'subscriptions' recriada e sincronizada com o schema do Drizzle.`);
    
    process.exit(0);
  } catch (error: any) {
    console.error("[Rebuild Subscriptions Production] ❌ ERRO:", error.message);
    console.error("[Rebuild Subscriptions Production] Stack:", error.stack);
    console.error("[Rebuild Subscriptions Production] Error code:", error.code);
    console.error("[Rebuild Subscriptions Production] Error detail:", error.detail);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar script
rebuildSubscriptionsTable();

