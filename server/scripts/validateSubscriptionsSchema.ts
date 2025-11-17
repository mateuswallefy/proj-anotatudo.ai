/**
 * Script para validar se a estrutura da tabela subscriptions no banco
 * está 100% compatível com o schema do Drizzle
 * 
 * Uso:
 *   DATABASE_URL=<url_producao> npx tsx server/scripts/validateSubscriptionsSchema.ts
 * 
 * Requisitos:
 *   - DATABASE_URL configurada (banco de produção)
 *   - Acesso ao banco PostgreSQL
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Schema esperado do Drizzle (snake_case no banco)
const EXPECTED_COLUMNS = {
  id: { type: 'character varying', nullable: false, hasDefault: true },
  user_id: { type: 'character varying', nullable: false, hasDefault: false },
  provider: { type: 'character varying', nullable: false, hasDefault: true },
  provider_subscription_id: { type: 'character varying', nullable: false, hasDefault: true },
  plan_name: { type: 'character varying', nullable: false, hasDefault: false },
  price_cents: { type: 'integer', nullable: false, hasDefault: false },
  currency: { type: 'character varying', nullable: false, hasDefault: true },
  billing_interval: { type: 'character varying', nullable: false, hasDefault: false },
  interval: { type: 'character varying', nullable: false, hasDefault: true },
  status: { type: 'character varying', nullable: false, hasDefault: false },
  trial_ends_at: { type: 'timestamp without time zone', nullable: true, hasDefault: false },
  current_period_end: { type: 'timestamp without time zone', nullable: true, hasDefault: false },
  cancel_at: { type: 'timestamp without time zone', nullable: true, hasDefault: false },
  meta: { type: 'jsonb', nullable: true, hasDefault: false },
  created_at: { type: 'timestamp without time zone', nullable: false, hasDefault: true },
  updated_at: { type: 'timestamp without time zone', nullable: false, hasDefault: true },
};

async function validateSubscriptionsSchema() {
  const client = await pool.connect();
  
  try {
    console.log(`[Validate Subscriptions] Iniciando validação...`);
    console.log(`[Validate Subscriptions] Conectado ao banco: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')}`);
    
    // 1. Verificar se a tabela existe
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'subscriptions'
      );
    `;
    
    const tableExistsResult = await client.query(checkTableQuery);
    const tableExists = tableExistsResult.rows[0].exists;
    
    if (!tableExists) {
      console.log(`[Validate Subscriptions] ❌ Tabela 'subscriptions' NÃO existe no banco!`);
      console.log(`[Validate Subscriptions] Execute o script rebuildSubscriptionsProduction.ts primeiro.`);
      process.exit(1);
    }
    
    console.log(`[Validate Subscriptions] ✅ Tabela 'subscriptions' existe.`);
    
    // 2. Ler estrutura atual da tabela
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
    const actualColumns: Record<string, any> = {};
    
    columnsResult.rows.forEach((col: any) => {
      actualColumns[col.column_name] = {
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
        hasDefault: !!col.column_default,
        maxLength: col.character_maximum_length,
      };
    });
    
    console.log(`[Validate Subscriptions] Estrutura atual: ${Object.keys(actualColumns).length} colunas encontradas.`);
    
    // 3. Comparar com schema esperado
    const missingColumns: string[] = [];
    const extraColumns: string[] = [];
    const wrongTypeColumns: Array<{ column: string; expected: string; actual: string }> = [];
    const wrongNullableColumns: Array<{ column: string; expected: boolean; actual: boolean }> = [];
    
    // Verificar colunas esperadas
    for (const [columnName, expected] of Object.entries(EXPECTED_COLUMNS)) {
      if (!actualColumns[columnName]) {
        missingColumns.push(columnName);
      } else {
        const actual = actualColumns[columnName];
        
        // Verificar tipo (normalizar variações)
        const normalizedExpected = expected.type.replace(/ without time zone/g, '');
        const normalizedActual = actual.type.replace(/ without time zone/g, '');
        
        if (normalizedExpected !== normalizedActual && 
            !(normalizedExpected === 'character varying' && normalizedActual === 'character varying')) {
          wrongTypeColumns.push({
            column: columnName,
            expected: expected.type,
            actual: actual.type,
          });
        }
        
        // Verificar nullable
        if (expected.nullable !== actual.nullable) {
          wrongNullableColumns.push({
            column: columnName,
            expected: expected.nullable,
            actual: actual.nullable,
          });
        }
      }
    }
    
    // Verificar colunas extras (que não deveriam existir)
    for (const columnName of Object.keys(actualColumns)) {
      if (!EXPECTED_COLUMNS[columnName as keyof typeof EXPECTED_COLUMNS]) {
        extraColumns.push(columnName);
      }
    }
    
    // 4. Verificar foreign keys
    const fkQuery = `
      SELECT 
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      LEFT JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'subscriptions' 
        AND tc.table_schema = 'public'
        AND tc.constraint_type = 'FOREIGN KEY';
    `;
    
    const fkResult = await client.query(fkQuery);
    const hasUserFk = fkResult.rows.some((fk: any) => 
      fk.column_name === 'user_id' && 
      fk.foreign_table_name === 'users' && 
      fk.foreign_column_name === 'id'
    );
    
    // 5. Exibir resultados
    console.log(`\n[Validate Subscriptions] ========================================`);
    console.log(`[Validate Subscriptions] RESULTADO DA VALIDAÇÃO`);
    console.log(`[Validate Subscriptions] ========================================\n`);
    
    if (missingColumns.length === 0 && 
        extraColumns.length === 0 && 
        wrongTypeColumns.length === 0 && 
        wrongNullableColumns.length === 0 &&
        hasUserFk) {
      console.log(`[Validate Subscriptions] ✅ OK - Tudo sincronizado!`);
      console.log(`[Validate Subscriptions] ✅ Todas as ${Object.keys(EXPECTED_COLUMNS).length} colunas estão presentes`);
      console.log(`[Validate Subscriptions] ✅ Tipos de dados corretos`);
      console.log(`[Validate Subscriptions] ✅ Constraints de nullable corretos`);
      console.log(`[Validate Subscriptions] ✅ Foreign key para users(id) presente`);
      console.log(`\n[Validate Subscriptions] A tabela está 100% compatível com o schema do Drizzle.`);
      process.exit(0);
    } else {
      console.log(`[Validate Subscriptions] ❌ DIFERENÇAS ENCONTRADAS\n`);
      
      if (missingColumns.length > 0) {
        console.log(`🔹 COLUNAS FALTANDO (${missingColumns.length}):`);
        missingColumns.forEach(col => {
          const expected = EXPECTED_COLUMNS[col as keyof typeof EXPECTED_COLUMNS];
          console.log(`   - ${col} (${expected.type}, ${expected.nullable ? 'NULL' : 'NOT NULL'})`);
        });
        console.log('');
      }
      
      if (extraColumns.length > 0) {
        console.log(`🔹 COLUNAS SOBRANDO (${extraColumns.length}):`);
        extraColumns.forEach(col => {
          console.log(`   - ${col} (não existe no schema Drizzle)`);
        });
        console.log('');
      }
      
      if (wrongTypeColumns.length > 0) {
        console.log(`🔹 COLUNAS COM TIPO ERRADO (${wrongTypeColumns.length}):`);
        wrongTypeColumns.forEach(({ column, expected, actual }) => {
          console.log(`   - ${column}: esperado ${expected}, encontrado ${actual}`);
        });
        console.log('');
      }
      
      if (wrongNullableColumns.length > 0) {
        console.log(`🔹 COLUNAS COM NULLABLE ERRADO (${wrongNullableColumns.length}):`);
        wrongNullableColumns.forEach(({ column, expected, actual }) => {
          console.log(`   - ${column}: esperado ${expected ? 'NULL' : 'NOT NULL'}, encontrado ${actual ? 'NULL' : 'NOT NULL'}`);
        });
        console.log('');
      }
      
      if (!hasUserFk) {
        console.log(`🔹 FOREIGN KEY FALTANDO:`);
        console.log(`   - user_id -> users(id) não encontrada`);
        console.log('');
      }
      
      console.log(`[Validate Subscriptions] ========================================`);
      console.log(`[Validate Subscriptions] CORREÇÕES NECESSÁRIAS:`);
      console.log(`[Validate Subscriptions] ========================================\n`);
      console.log(`Execute o script rebuildSubscriptionsProduction.ts para corrigir.`);
      console.log(`Ou ajuste manualmente as diferenças listadas acima.\n`);
      
      process.exit(1);
    }
  } catch (error: any) {
    console.error("[Validate Subscriptions] ❌ ERRO:", error.message);
    console.error("[Validate Subscriptions] Stack:", error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar validação
validateSubscriptionsSchema();

