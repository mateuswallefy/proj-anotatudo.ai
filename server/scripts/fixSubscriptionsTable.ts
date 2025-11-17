/**
 * Script para corrigir completamente a tabela subscriptions no banco PostgreSQL
 * 
 * Uso:
 *   npx tsx server/scripts/fixSubscriptionsTable.ts
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

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
}

async function fixSubscriptionsTable() {
  try {
    console.log(`[Fix Subscriptions] Iniciando processo...`);
    console.log(`[Fix Subscriptions] Conectando ao banco de dados...`);
    
    // 1. Verificar se a tabela subscriptions existe
    console.log(`[Fix Subscriptions] Verificando se a tabela 'subscriptions' existe...`);
    
    const checkTableQuery = `SELECT to_regclass('public.subscriptions');`;
    const tableResult = await pool.query(checkTableQuery);
    const tableExists = tableResult.rows[0].to_regclass !== null;
    
    if (!tableExists) {
      console.log(`[Fix Subscriptions] ⚠️  Tabela 'subscriptions' NÃO existe`);
      console.log(`[Fix Subscriptions] Criando tabela 'subscriptions'...`);
      
      // Criar tabela com schema oficial
      const createTableQuery = `
        CREATE TABLE subscriptions (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          provider VARCHAR NOT NULL DEFAULT 'manual',
          status VARCHAR NOT NULL DEFAULT 'active',
          current_period_end TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `;
      
      await pool.query(createTableQuery);
      console.log(`[Fix Subscriptions] ✅ Tabela 'subscriptions' criada com sucesso!`);
    } else {
      console.log(`[Fix Subscriptions] ✅ Tabela 'subscriptions' já existe`);
      console.log(`[Fix Subscriptions] Validando e corrigindo colunas...`);
      
      // 2. Obter informações de todas as colunas existentes
      const columnsQuery = `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'subscriptions'
        ORDER BY ordinal_position;
      `;
      
      const columnsResult = await pool.query(columnsQuery);
      const existingColumns = columnsResult.rows as ColumnInfo[];
      const existingColumnNames = existingColumns.map(col => col.column_name);
      
      console.log(`[Fix Subscriptions] Colunas existentes: ${existingColumnNames.join(', ')}`);
      
      // 3. Definir schema esperado
      const expectedSchema: {
        name: string;
        type: string;
        nullable: boolean;
        default: string | null;
        isPrimary?: boolean;
        isForeignKey?: boolean;
      }[] = [
        {
          name: 'id',
          type: 'character varying',
          nullable: false,
          default: 'gen_random_uuid()',
          isPrimary: true,
        },
        {
          name: 'user_id',
          type: 'character varying',
          nullable: false,
          default: null,
          isForeignKey: true,
        },
        {
          name: 'provider',
          type: 'character varying',
          nullable: false,
          default: "'manual'::character varying",
        },
        {
          name: 'status',
          type: 'character varying',
          nullable: false,
          default: "'active'::character varying",
        },
        {
          name: 'current_period_end',
          type: 'timestamp without time zone',
          nullable: true,
          default: null,
        },
        {
          name: 'created_at',
          type: 'timestamp without time zone',
          nullable: false,
          default: 'now()',
        },
        {
          name: 'updated_at',
          type: 'timestamp without time zone',
          nullable: false,
          default: 'now()',
        },
      ];
      
      // 4. Verificar e corrigir cada coluna
      for (const expectedCol of expectedSchema) {
        const existingCol = existingColumns.find(c => c.column_name === expectedCol.name);
        
        if (!existingCol) {
          // Coluna não existe, criar
          console.log(`[Fix Subscriptions] ⚠️  Coluna '${expectedCol.name}' não existe. Criando...`);
          
          let alterQuery = `ALTER TABLE subscriptions ADD COLUMN ${expectedCol.name} `;
          
          // Tipo
          if (expectedCol.type === 'character varying') {
            alterQuery += `VARCHAR`;
          } else if (expectedCol.type === 'timestamp without time zone') {
            alterQuery += `TIMESTAMP`;
          }
          
          // NOT NULL
          if (!expectedCol.nullable) {
            alterQuery += ` NOT NULL`;
          }
          
          // Default
          if (expectedCol.default) {
            if (expectedCol.default === 'gen_random_uuid()') {
              alterQuery += ` DEFAULT gen_random_uuid()`;
            } else if (expectedCol.default === 'now()') {
              alterQuery += ` DEFAULT NOW()`;
            } else if (expectedCol.default.includes("'manual'")) {
              alterQuery += ` DEFAULT 'manual'`;
            } else if (expectedCol.default.includes("'active'")) {
              alterQuery += ` DEFAULT 'active'`;
            }
          }
          
          await pool.query(alterQuery);
          console.log(`[Fix Subscriptions] ✅ Coluna '${expectedCol.name}' criada com sucesso!`);
        } else {
          // Coluna existe, verificar tipo, nullable e default
          let needsFix = false;
          const fixes: string[] = [];
          
          // Verificar tipo
          const normalizedType = existingCol.data_type === 'character varying' ? 'character varying' : 
                                existingCol.data_type === 'timestamp without time zone' ? 'timestamp without time zone' :
                                existingCol.data_type;
          
          if (normalizedType !== expectedCol.type) {
            needsFix = true;
            fixes.push(`tipo (${existingCol.data_type} → ${expectedCol.type})`);
            
            let typeFix = `ALTER TABLE subscriptions ALTER COLUMN ${expectedCol.name} TYPE `;
            if (expectedCol.type === 'character varying') {
              typeFix += `VARCHAR`;
            } else if (expectedCol.type === 'timestamp without time zone') {
              typeFix += `TIMESTAMP`;
            }
            typeFix += ` USING ${expectedCol.name}::${expectedCol.type === 'character varying' ? 'VARCHAR' : 'TIMESTAMP'};`;
            
            await pool.query(typeFix);
            console.log(`[Fix Subscriptions] ✅ Coluna '${expectedCol.name}': tipo corrigido`);
          }
          
          // Verificar nullable
          const isNullable = existingCol.is_nullable === 'YES';
          if (isNullable !== expectedCol.nullable) {
            needsFix = true;
            fixes.push(`nullable (${isNullable ? 'YES' : 'NO'} → ${expectedCol.nullable ? 'YES' : 'NO'})`);
            
            if (expectedCol.nullable) {
              await pool.query(`ALTER TABLE subscriptions ALTER COLUMN ${expectedCol.name} DROP NOT NULL;`);
            } else {
              await pool.query(`ALTER TABLE subscriptions ALTER COLUMN ${expectedCol.name} SET NOT NULL;`);
            }
            console.log(`[Fix Subscriptions] ✅ Coluna '${expectedCol.name}': nullable corrigido`);
          }
          
          // Verificar default
          const normalizedDefault = existingCol.column_default 
            ? existingCol.column_default.replace(/::.*$/, '').trim()
            : null;
          
          const expectedDefaultNormalized = expectedCol.default 
            ? expectedCol.default.replace(/::.*$/, '').trim()
            : null;
          
          const defaultMatches = 
            (normalizedDefault === expectedDefaultNormalized) ||
            (normalizedDefault === 'gen_random_uuid()' && expectedDefaultNormalized === 'gen_random_uuid()') ||
            (normalizedDefault === 'now()' && expectedDefaultNormalized === 'now()') ||
            (normalizedDefault === "'manual'" && expectedDefaultNormalized?.includes("'manual'")) ||
            (normalizedDefault === "'active'" && expectedDefaultNormalized?.includes("'active'"));
          
          if (!defaultMatches) {
            needsFix = true;
            fixes.push(`default (${normalizedDefault || 'NULL'} → ${expectedDefaultNormalized || 'NULL'})`);
            
            if (expectedDefaultNormalized) {
              if (expectedDefaultNormalized === 'gen_random_uuid()') {
                await pool.query(`ALTER TABLE subscriptions ALTER COLUMN ${expectedCol.name} SET DEFAULT gen_random_uuid();`);
              } else if (expectedDefaultNormalized === 'now()') {
                await pool.query(`ALTER TABLE subscriptions ALTER COLUMN ${expectedCol.name} SET DEFAULT NOW();`);
              } else if (expectedDefaultNormalized.includes("'manual'")) {
                await pool.query(`ALTER TABLE subscriptions ALTER COLUMN ${expectedCol.name} SET DEFAULT 'manual';`);
              } else if (expectedDefaultNormalized.includes("'active'")) {
                await pool.query(`ALTER TABLE subscriptions ALTER COLUMN ${expectedCol.name} SET DEFAULT 'active';`);
              }
            } else {
              await pool.query(`ALTER TABLE subscriptions ALTER COLUMN ${expectedCol.name} DROP DEFAULT;`);
            }
            console.log(`[Fix Subscriptions] ✅ Coluna '${expectedCol.name}': default corrigido`);
          }
          
          if (!needsFix) {
            console.log(`[Fix Subscriptions] ✅ Coluna '${expectedCol.name}': OK`);
          }
        }
      }
      
      // 5. Verificar foreign key user_id
      console.log(`[Fix Subscriptions] Verificando foreign key 'user_id'...`);
      const fkQuery = `
        SELECT 
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          rc.delete_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        JOIN information_schema.referential_constraints AS rc
          ON rc.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'subscriptions'
          AND kcu.column_name = 'user_id';
      `;
      
      const fkResult = await pool.query(fkQuery);
      
      if (fkResult.rows.length === 0) {
        console.log(`[Fix Subscriptions] ⚠️  Foreign key 'user_id' não existe. Criando...`);
        await pool.query(`
          ALTER TABLE subscriptions
          ADD CONSTRAINT subscriptions_user_id_fkey
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        `);
        console.log(`[Fix Subscriptions] ✅ Foreign key 'user_id' criada com sucesso!`);
      } else {
        console.log(`[Fix Subscriptions] ✅ Foreign key 'user_id' já existe`);
      }
      
      // 6. Verificar primary key id
      console.log(`[Fix Subscriptions] Verificando primary key 'id'...`);
      const pkQuery = `
        SELECT 
          tc.constraint_name,
          kcu.column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_name = 'subscriptions'
          AND kcu.column_name = 'id';
      `;
      
      const pkResult = await pool.query(pkQuery);
      
      if (pkResult.rows.length === 0) {
        console.log(`[Fix Subscriptions] ⚠️  Primary key 'id' não existe. Criando...`);
        await pool.query(`ALTER TABLE subscriptions ADD PRIMARY KEY (id);`);
        console.log(`[Fix Subscriptions] ✅ Primary key 'id' criada com sucesso!`);
      } else {
        console.log(`[Fix Subscriptions] ✅ Primary key 'id' já existe`);
      }
    }
    
    // 7. Listar estrutura final da tabela
    console.log(`[Fix Subscriptions] Verificando estrutura final da tabela 'subscriptions'...`);
    
    const finalColumnsQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'subscriptions'
      ORDER BY ordinal_position;
    `;
    
    const finalColumnsResult = await pool.query(finalColumnsQuery);
    
    console.log(`[Fix Subscriptions] Estrutura final da tabela 'subscriptions' (${finalColumnsResult.rows.length} colunas):`);
    finalColumnsResult.rows.forEach((row: any, index: number) => {
      console.log(`  ${index + 1}. ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });
    
    // 8. Testar consulta
    console.log(`[Fix Subscriptions] Testando consulta na tabela 'subscriptions'...`);
    const testQuery = await pool.query(`SELECT * FROM subscriptions LIMIT 5`);
    console.log(`[Fix Subscriptions] ✅ Consulta de teste bem-sucedida!`);
    console.log(`[Fix Subscriptions] Registros encontrados: ${testQuery.rows.length}`);
    
    if (testQuery.rows.length > 0) {
      console.log(`[Fix Subscriptions] Primeiros registros:`);
      testQuery.rows.forEach((row: any, index: number) => {
        console.log(`  ${index + 1}. ID: ${row.id}, User ID: ${row.user_id}, Status: ${row.status}, Provider: ${row.provider}`);
      });
    } else {
      console.log(`[Fix Subscriptions] ℹ️  Tabela está vazia (isso é normal se não houver assinaturas ainda)`);
    }
    
    console.log(`[Fix Subscriptions] ✅ Processo concluído com sucesso!`);
    console.log(`[Fix Subscriptions] ✅ A tabela 'subscriptions' está sincronizada com o schema do Drizzle.`);
    
    // Fechar conexão
    await pool.end();
    console.log(`[Fix Subscriptions] Conexão fechada.`);
    
    process.exit(0);
  } catch (error: any) {
    console.error("[Fix Subscriptions] ❌ ERRO:", error.message);
    console.error("[Fix Subscriptions] Stack:", error.stack);
    
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
fixSubscriptionsTable();

