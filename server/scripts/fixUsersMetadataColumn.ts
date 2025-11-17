/**
 * Script para adicionar a coluna metadata na tabela users se ela não existir
 * 
 * Uso:
 *   npx tsx server/scripts/fixUsersMetadataColumn.ts
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

async function fixUsersMetadataColumn() {
  try {
    console.log(`[Fix Users Metadata] Iniciando processo...`);
    console.log(`[Fix Users Metadata] Conectando ao banco de dados...`);
    
    // 1. Verificar se a coluna metadata já existe
    console.log(`[Fix Users Metadata] Verificando se a coluna 'metadata' existe...`);
    
    const checkColumnQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'metadata';
    `;
    
    const checkResult = await pool.query(checkColumnQuery);
    const columnExists = checkResult.rows.length > 0;
    
    if (columnExists) {
      console.log(`[Fix Users Metadata] ✅ Coluna 'metadata' já existe na tabela 'users'`);
      console.log(`[Fix Users Metadata] Detalhes da coluna:`);
      checkResult.rows.forEach((row: any) => {
        console.log(`  - Nome: ${row.column_name}`);
        console.log(`  - Tipo: ${row.data_type}`);
        console.log(`  - Nullable: ${row.is_nullable}`);
        console.log(`  - Default: ${row.column_default || 'N/A'}`);
      });
    } else {
      console.log(`[Fix Users Metadata] ⚠️  Coluna 'metadata' NÃO existe na tabela 'users'`);
      console.log(`[Fix Users Metadata] Criando coluna 'metadata'...`);
      
      // 2. Adicionar a coluna metadata
      const addColumnQuery = `
        ALTER TABLE users
        ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
      `;
      
      await pool.query(addColumnQuery);
      console.log(`[Fix Users Metadata] ✅ Coluna 'metadata' criada com sucesso!`);
    }
    
    // 3. Confirmar com SELECT de todas as colunas
    console.log(`[Fix Users Metadata] Verificando estrutura completa da tabela 'users'...`);
    
    const allColumnsQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `;
    
    const allColumnsResult = await pool.query(allColumnsQuery);
    
    console.log(`[Fix Users Metadata] Estrutura da tabela 'users' (${allColumnsResult.rows.length} colunas):`);
    allColumnsResult.rows.forEach((row: any, index: number) => {
      console.log(`  ${index + 1}. ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });
    
    // 4. Verificar especificamente a coluna metadata
    const metadataCheck = allColumnsResult.rows.find((row: any) => row.column_name === 'metadata');
    if (metadataCheck) {
      console.log(`[Fix Users Metadata] ✅ Confirmação: Coluna 'metadata' está presente na tabela`);
      console.log(`[Fix Users Metadata] Tipo: ${metadataCheck.data_type}`);
      console.log(`[Fix Users Metadata] Nullable: ${metadataCheck.is_nullable}`);
      console.log(`[Fix Users Metadata] Default: ${metadataCheck.column_default || 'N/A'}`);
    } else {
      throw new Error("Coluna 'metadata' não foi encontrada após tentativa de criação!");
    }
    
    // 5. Testar se a coluna pode ser consultada
    console.log(`[Fix Users Metadata] Testando consulta na coluna 'metadata'...`);
    const testQuery = await pool.query(`SELECT id, email, metadata FROM users LIMIT 1`);
    console.log(`[Fix Users Metadata] ✅ Consulta de teste bem-sucedida!`);
    if (testQuery.rows.length > 0) {
      console.log(`[Fix Users Metadata] Exemplo de registro:`, {
        id: testQuery.rows[0].id,
        email: testQuery.rows[0].email,
        metadata: testQuery.rows[0].metadata || '{}',
      });
    }
    
    console.log(`[Fix Users Metadata] ✅ Processo concluído com sucesso!`);
    console.log(`[Fix Users Metadata] ✅ O login voltará a funcionar após esta correção.`);
    
    // Fechar conexão
    await pool.end();
    console.log(`[Fix Users Metadata] Conexão fechada.`);
    
    process.exit(0);
  } catch (error: any) {
    console.error("[Fix Users Metadata] ❌ ERRO:", error.message);
    console.error("[Fix Users Metadata] Stack:", error.stack);
    
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
fixUsersMetadataColumn();

