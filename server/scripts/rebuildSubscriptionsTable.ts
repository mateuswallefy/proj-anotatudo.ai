/**
 * Script para recriar completamente a tabela subscriptions
 * 
 * ⚠️ ATENÇÃO: Este script irá APAGAR todos os dados da tabela subscriptions!
 * 
 * Uso:
 *   npx tsx server/scripts/rebuildSubscriptionsTable.ts
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
  try {
    console.log(`[Rebuild Subscriptions] Iniciando processo...`);
    console.log(`[Rebuild Subscriptions] Conectando ao banco de dados...`);
    
    // 1. Verificar se a tabela existe e contar registros
    console.log(`[Rebuild Subscriptions] Verificando tabela 'subscriptions' existente...`);
    
    const checkTableQuery = `SELECT to_regclass('public.subscriptions');`;
    const tableResult = await pool.query(checkTableQuery);
    const tableExists = tableResult.rows[0].to_regclass !== null;
    
    if (tableExists) {
      const countQuery = await pool.query(`SELECT COUNT(*) as count FROM subscriptions;`);
      const recordCount = countQuery.rows[0].count;
      console.log(`[Rebuild Subscriptions] ⚠️  Tabela 'subscriptions' existe com ${recordCount} registros`);
      console.log(`[Rebuild Subscriptions] ⚠️  ATENÇÃO: Todos os dados serão apagados!`);
    } else {
      console.log(`[Rebuild Subscriptions] ℹ️  Tabela 'subscriptions' não existe ainda`);
    }
    
    // 2. Dropar a tabela existente (CASCADE remove dependências)
    console.log(`[Rebuild Subscriptions] Removendo tabela 'subscriptions' existente (se houver)...`);
    
    const dropTableQuery = `DROP TABLE IF EXISTS subscriptions CASCADE;`;
    await pool.query(dropTableQuery);
    console.log(`[Rebuild Subscriptions] ✅ Tabela removida com sucesso!`);
    
    // 3. Criar nova tabela com estrutura simplificada (camelCase)
    console.log(`[Rebuild Subscriptions] Criando nova tabela 'subscriptions'...`);
    
    const createTableQuery = `
      CREATE TABLE subscriptions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider VARCHAR NOT NULL DEFAULT 'manual',
        status VARCHAR NOT NULL DEFAULT 'active',
        interval VARCHAR NOT NULL DEFAULT 'monthly',
        "currentPeriodEnd" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;
    
    await pool.query(createTableQuery);
    console.log(`[Rebuild Subscriptions] ✅ Tabela 'subscriptions' criada com sucesso!`);
    
    // 4. Verificar estrutura final
    console.log(`[Rebuild Subscriptions] Verificando estrutura final da tabela 'subscriptions'...`);
    
    const columnsQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'subscriptions'
      ORDER BY ordinal_position;
    `;
    
    const columnsResult = await pool.query(columnsQuery);
    
    console.log(`[Rebuild Subscriptions] Estrutura da tabela 'subscriptions' (${columnsResult.rows.length} colunas):`);
    columnsResult.rows.forEach((row: any, index: number) => {
      console.log(`  ${index + 1}. ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });
    
    // 5. Verificar constraints
    console.log(`[Rebuild Subscriptions] Verificando constraints...`);
    
    const constraintsQuery = `
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'subscriptions'
      ORDER BY tc.constraint_type, kcu.ordinal_position;
    `;
    
    const constraintsResult = await pool.query(constraintsQuery);
    
    if (constraintsResult.rows.length > 0) {
      console.log(`[Rebuild Subscriptions] Constraints encontradas:`);
      constraintsResult.rows.forEach((row: any) => {
        console.log(`  - ${row.constraint_type}: ${row.constraint_name} (coluna: ${row.column_name})`);
      });
    }
    
    // 6. Testar consulta
    console.log(`[Rebuild Subscriptions] Testando consulta na tabela 'subscriptions'...`);
    const testQuery = await pool.query(`SELECT * FROM subscriptions LIMIT 5;`);
    console.log(`[Rebuild Subscriptions] ✅ Consulta de teste bem-sucedida!`);
    console.log(`[Rebuild Subscriptions] Registros encontrados: ${testQuery.rows.length}`);
    
    if (testQuery.rows.length > 0) {
      console.log(`[Rebuild Subscriptions] Primeiros registros:`);
      testQuery.rows.forEach((row: any, index: number) => {
        console.log(`  ${index + 1}. ID: ${row.id}, User ID: ${row.userId}, Provider: ${row.provider}, Status: ${row.status}, Interval: ${row.interval}`);
      });
    } else {
      console.log(`[Rebuild Subscriptions] ℹ️  Tabela está vazia (isso é normal após recriação)`);
    }
    
    // 7. Mensagem final
    console.log(`[Rebuild Subscriptions] ✅ Tabela recriada com sucesso e sincronizada com o schema do Drizzle.`);
    console.log(`[Rebuild Subscriptions] 📌 Próximos passos:`);
    console.log(`[Rebuild Subscriptions]   1. Criar um cliente manual novamente`);
    console.log(`[Rebuild Subscriptions]   2. Ele deve aparecer na aba "Assinaturas"`);
    console.log(`[Rebuild Subscriptions]   3. WhatsApp deve reconhecer imediatamente`);
    console.log(`[Rebuild Subscriptions]   4. Painel admin deve permitir excluir, pausar, editar`);
    console.log(`[Rebuild Subscriptions]   5. A assinatura será salva corretamente`);
    
    // Fechar conexão
    await pool.end();
    console.log(`[Rebuild Subscriptions] Conexão fechada.`);
    
    process.exit(0);
  } catch (error: any) {
    console.error("[Rebuild Subscriptions] ❌ ERRO:", error.message);
    console.error("[Rebuild Subscriptions] Stack:", error.stack);
    
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
rebuildSubscriptionsTable();

