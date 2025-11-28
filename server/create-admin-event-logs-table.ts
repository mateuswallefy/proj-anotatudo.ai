/**
 * Script para criar a tabela admin_event_logs no banco de produção
 * Execute: npx tsx server/create-admin-event-logs-table.ts
 */

import { pool } from './db.js';

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS admin_event_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
`;

const CHECK_TABLE_SQL = `
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'admin_event_logs'
);
`;

const DESCRIBE_TABLE_SQL = `
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'admin_event_logs'
ORDER BY ordinal_position;
`;

async function createAdminEventLogsTable() {
  console.log('🔍 Verificando se a tabela admin_event_logs existe...\n');
  
  try {
    // Verificar se a tabela já existe
    const checkResult = await pool.query(CHECK_TABLE_SQL);
    const tableExists = checkResult.rows[0]?.exists || false;
    
    if (tableExists) {
      console.log('✅ A tabela admin_event_logs já existe!\n');
      
      // Descrever a estrutura da tabela
      console.log('📋 Estrutura da tabela:');
      const describeResult = await pool.query(DESCRIBE_TABLE_SQL);
      describeResult.rows.forEach((row: any) => {
        console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
      });
      
      await pool.end();
      return;
    }
    
    console.log('📝 Criando a tabela admin_event_logs...\n');
    
    // Criar a tabela
    await pool.query(CREATE_TABLE_SQL);
    
    console.log('✅ Tabela admin_event_logs criada com sucesso!\n');
    
    // Verificar novamente
    const verifyResult = await pool.query(CHECK_TABLE_SQL);
    const nowExists = verifyResult.rows[0]?.exists || false;
    
    if (nowExists) {
      console.log('✅ Confirmação: A tabela foi criada e está listada no banco!\n');
      
      // Descrever a estrutura da tabela criada
      console.log('📋 Estrutura da tabela criada:');
      const describeResult = await pool.query(DESCRIBE_TABLE_SQL);
      describeResult.rows.forEach((row: any) => {
        console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
      });
    } else {
      console.error('❌ Erro: A tabela não foi encontrada após a criação!');
    }
    
    await pool.end();
    
  } catch (error: any) {
    console.error('❌ Erro ao criar a tabela:', error.message);
    console.error('Detalhes:', error);
    await pool.end();
    process.exit(1);
  }
}

// Executar
createAdminEventLogsTable()
  .then(() => {
    console.log('\n✅ Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });

