import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const getDatabaseUrl = () => {
  const databaseUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "NEON_DATABASE_URL must be set. Add it in Replit Secrets.",
    );
  }
  return databaseUrl;
};

async function testTransacoesInsert() {
  const pool = new Pool({ connectionString: getDatabaseUrl() });
  
  try {
    console.log("\n=== TESTANDO INSERÇÕES DE TRANSAÇÕES ===\n");
    
    // Primeiro, precisamos de um user_id válido
    const userResult = await pool.query("SELECT id FROM users LIMIT 1");
    if (userResult.rows.length === 0) {
      throw new Error("Nenhum usuário encontrado no banco. Crie um usuário primeiro.");
    }
    const userId = userResult.rows[0].id;
    console.log(`Usando user_id: ${userId}\n`);
    
    const tests = [
      {
        name: "1. Receita > A receber",
        data: {
          user_id: userId,
          tipo: 'entrada',
          categoria: 'Teste',
          valor: '100.00',
          data_real: new Date().toISOString().split('T')[0],
          origem: 'manual',
          status: 'pending',
          pending_kind: 'to_receive',
          payment_method: 'pix',
        }
      },
      {
        name: "2. Receita > Recebido",
        data: {
          user_id: userId,
          tipo: 'entrada',
          categoria: 'Teste',
          valor: '200.00',
          data_real: new Date().toISOString().split('T')[0],
          origem: 'manual',
          status: 'paid',
          pending_kind: null,
          payment_method: 'cash',
        }
      },
      {
        name: "3. Despesa > A pagar",
        data: {
          user_id: userId,
          tipo: 'saida',
          categoria: 'Teste',
          valor: '50.00',
          data_real: new Date().toISOString().split('T')[0],
          origem: 'manual',
          status: 'pending',
          pending_kind: 'to_pay',
          payment_method: 'credit_card',
        }
      },
      {
        name: "4. Despesa > Pago",
        data: {
          user_id: userId,
          tipo: 'saida',
          categoria: 'Teste',
          valor: '75.00',
          data_real: new Date().toISOString().split('T')[0],
          origem: 'manual',
          status: 'paid',
          pending_kind: null,
          payment_method: 'debit_card',
        }
      },
    ];
    
    const insertedIds: string[] = [];
    
    for (const test of tests) {
      try {
        console.log(`Testando: ${test.name}`);
        console.log(`  Dados:`, JSON.stringify(test.data, null, 2));
        
        const insertQuery = `
          INSERT INTO transacoes (
            user_id, tipo, categoria, valor, data_real, origem,
            status, pending_kind, payment_method
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id, status, pending_kind, payment_method;
        `;
        
        const result = await pool.query(insertQuery, [
          test.data.user_id,
          test.data.tipo,
          test.data.categoria,
          test.data.valor,
          test.data.data_real,
          test.data.origem,
          test.data.status,
          test.data.pending_kind,
          test.data.payment_method,
        ]);
        
        const inserted = result.rows[0];
        insertedIds.push(inserted.id);
        
        console.log(`  ✅ SUCESSO! ID: ${inserted.id}`);
        console.log(`     status: ${inserted.status}`);
        console.log(`     pending_kind: ${inserted.pending_kind || 'NULL'}`);
        console.log(`     payment_method: ${inserted.payment_method}`);
        console.log();
        
      } catch (error: any) {
        console.error(`  ❌ ERRO: ${error.message}`);
        console.error(`     Detalhes:`, error);
        console.log();
        throw error;
      }
    }
    
    // Limpar dados de teste
    console.log("=== LIMPANDO DADOS DE TESTE ===\n");
    if (insertedIds.length > 0) {
      const deleteQuery = `DELETE FROM transacoes WHERE id = ANY($1::varchar[]);`;
      await pool.query(deleteQuery, [insertedIds]);
      console.log(`✅ ${insertedIds.length} transações de teste removidas\n`);
    }
    
    console.log("✅ TODOS OS TESTES PASSARAM!\n");
    console.log("Resumo:");
    console.log("  ✅ Receita > A receber: OK");
    console.log("  ✅ Receita > Recebido: OK");
    console.log("  ✅ Despesa > A pagar: OK");
    console.log("  ✅ Despesa > Pago: OK");
    
  } catch (error: any) {
    console.error("\n❌ Erro nos testes:", error.message);
    console.error(error);
    throw error;
  } finally {
    await pool.end();
  }
}

testTransacoesInsert()
  .then(() => {
    console.log("\n✅ Processo finalizado!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });

