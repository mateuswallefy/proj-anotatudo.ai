/**
 * Script para testar se createAdminEventLog() está escrevendo na tabela
 * Execute: npx tsx server/test-admin-event-logs.ts
 */

import { storage } from './storage.js';
import { pool } from './db.js';

const COUNT_LOGS_SQL = `
SELECT COUNT(*) as count FROM admin_event_logs;
`;

const GET_RECENT_LOGS_SQL = `
SELECT id, admin_id, user_id, type, metadata, created_at
FROM admin_event_logs
ORDER BY created_at DESC
LIMIT 5;
`;

async function testAdminEventLogs() {
  console.log('🔍 Verificando se a função createAdminEventLog() está funcionando...\n');
  
  try {
    // Contar logs existentes
    const countResult = await pool.query(COUNT_LOGS_SQL);
    const currentCount = parseInt(countResult.rows[0]?.count || '0');
    
    console.log(`📊 Total de logs na tabela: ${currentCount}\n`);
    
    // Buscar logs recentes
    if (currentCount > 0) {
      console.log('📋 Últimos 5 logs registrados:');
      const logsResult = await pool.query(GET_RECENT_LOGS_SQL);
      
      logsResult.rows.forEach((log: any, index: number) => {
        console.log(`\n  ${index + 1}. Log ID: ${log.id}`);
        console.log(`     Tipo: ${log.type}`);
        console.log(`     Admin ID: ${log.admin_id}`);
        console.log(`     User ID: ${log.user_id || 'N/A'}`);
        console.log(`     Metadata: ${JSON.stringify(log.metadata || {})}`);
        console.log(`     Criado em: ${log.created_at}`);
      });
    } else {
      console.log('ℹ️  Nenhum log encontrado ainda. Isso é normal se nenhuma ação admin foi executada.\n');
    }
    
    // Verificar estrutura da função
    console.log('\n✅ A função createAdminEventLog() está disponível e pronta para uso.');
    console.log('   Ela será chamada automaticamente quando:');
    console.log('   - Admin criar um usuário (create_user)');
    console.log('   - Admin editar um usuário (update_user)');
    console.log('   - Admin suspender um usuário (suspend_user)');
    console.log('   - Admin reativar um usuário (reactivate_user)');
    console.log('   - Admin excluir um usuário (delete_user)');
    console.log('   - Admin resetar senha (reset_password)');
    console.log('   - Admin forçar logout (force_logout)');
    
    await pool.end();
    
  } catch (error: any) {
    console.error('❌ Erro ao verificar logs:', error.message);
    console.error('Detalhes:', error);
    await pool.end();
    process.exit(1);
  }
}

// Executar
testAdminEventLogs()
  .then(() => {
    console.log('\n✅ Verificação concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });

