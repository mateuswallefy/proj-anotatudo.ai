/**
 * Script para executar migrations do Drizzle ORM
 * Compatível com Neon/Postgres usando drizzle-orm/neon-serverless
 */

import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { initializeDatabaseAsync, db } from '../server/db.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigrations() {
  try {
    console.log('🔄 Inicializando conexão com banco de dados...');
    
    // Inicializar conexão do banco
    await initializeDatabaseAsync();
    
    if (!db) {
      throw new Error('Database connection not initialized');
    }

    console.log('📦 Executando migrations...');
    console.log(`📁 Pasta de migrations: ${join(__dirname, '../migrations')}`);
    
    // Executar migrations
    await migrate(db, { 
      migrationsFolder: join(__dirname, '../migrations')
    });
    
    console.log('✅ Migrations aplicadas com sucesso!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro ao executar migrations:', err);
    if (err instanceof Error) {
      console.error('Stack:', err.stack);
    }
    process.exit(1);
  }
}

runMigrations();

