/**
 * Script para verificar qual banco de dados está sendo usado
 * Use em produção para diagnosticar problemas de conexão
 */

import { Pool } from '@neondatabase/serverless';

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ DATABASE_URL não definida!');
  process.exit(1);
}

// Mascarar a senha
const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
console.log(`📍 DATABASE_URL: ${maskedUrl}`);

// Verificar qual servidor é
if (dbUrl.includes('neon')) {
  console.log('✅ CORRETO: Está conectando ao Neon (banco externo)');
} else if (dbUrl.includes('replit') || dbUrl.includes('localhost')) {
  console.log('❌ ERRO: Está conectando ao Replit (banco antigo)');
} else {
  console.log('❓ Banco desconhecido');
}

// Tentar conectar
const pool = new Pool({ connectionString: dbUrl });
pool.query('SELECT NOW() as current_time, version() as pg_version', (err, res) => {
  if (err) {
    console.error('❌ Erro na conexão:', err.message);
  } else {
    console.log('✅ Conexão bem-sucedida!');
    console.log('   Hora do banco:', res.rows[0].current_time);
    console.log('   PostgreSQL:', res.rows[0].pg_version.split(',')[0]);
  }
  process.exit(err ? 1 : 0);
});
