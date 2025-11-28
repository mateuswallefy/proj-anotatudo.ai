/**
 * Script para corrigir conexão do banco de dados em produção
 * Remove variáveis PG* e garante que apenas DATABASE_URL (Neon) seja usada
 */

console.log("=".repeat(80));
console.log("🔧 CORREÇÃO DE CONEXÃO DO BANCO DE DADOS");
console.log("=".repeat(80));
console.log("");

// Verificar variáveis atuais
console.log("📋 VARIÁVEIS DE AMBIENTE ATUAIS:");
console.log("");

const pgVars = ['PGDATABASE', 'PGHOST', 'PGPORT', 'PGUSER', 'PGPASSWORD'];
const allVars: Record<string, string | undefined> = {};

// Verificar cada variável PG*
for (const varName of pgVars) {
  const value = process.env[varName];
  allVars[varName] = value;
  if (value) {
    console.log(`   ⚠️  ${varName}=${value}`);
  } else {
    console.log(`   ✅ ${varName} não está definida`);
  }
}

console.log("");
const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl) {
  // Mascarar senha na URL
  const maskedUrl = databaseUrl.replace(/:[^:@]+@/, ':****@');
  console.log(`   ✅ DATABASE_URL=${maskedUrl}`);
} else {
  console.log(`   ❌ DATABASE_URL não está definida!`);
}

console.log("");
console.log("=".repeat(80));
console.log("📝 INSTRUÇÕES PARA CORRIGIR:");
console.log("=".repeat(80));
console.log("");

console.log("1️⃣  NO REPLIT, VÁ EM: Tools → Secrets");
console.log("");
console.log("2️⃣  PROCURE E DELETE (ou sobrescreva com valor vazio) os seguintes secrets:");
pgVars.forEach(v => console.log(`   - ${v}`));
console.log("");
console.log("3️⃣  GARANTA QUE APENAS ESTE SECRET EXISTA:");
console.log(`   DATABASE_URL = postgresql://neondb_owner:npg_TlZvP3kd2icV@ep-plain-art-acnjwa7b-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`);
console.log("");
console.log("4️⃣  NO REPLIT, VÁ EM: Deploy → Settings");
console.log("   - Verifique se há variáveis de ambiente PG* lá");
console.log("   - Delete todas as variáveis PG*");
console.log("");
console.log("5️⃣  RESETE O AUTOSCALE:");
console.log("   - Vá em Deploy → Stop (parar deploy atual)");
console.log("   - Aguarde alguns segundos");
console.log("   - Vá em Deploy → Publish (recriar deploy)");
console.log("");
console.log("6️⃣  APÓS O RESET, EXECUTE ESTE SCRIPT NOVAMENTE PARA VERIFICAR:");
console.log("   npx tsx server/scripts/fixDatabaseConnection.ts");
console.log("");

// Verificar se há variáveis PG* definidas
const hasPgVars = pgVars.some(v => process.env[v]);
if (hasPgVars) {
  console.log("=".repeat(80));
  console.log("❌ PROBLEMA DETECTADO!");
  console.log("=".repeat(80));
  console.log("");
  console.log("As variáveis PG* ainda estão definidas no ambiente.");
  console.log("Elas precisam ser removidas dos Secrets do Replit.");
  console.log("");
  console.log("⚠️  ATENÇÃO: Essas variáveis podem estar em:");
  console.log("   - App Secrets (Tools → Secrets)");
  console.log("   - Deploy Env Vars (Deploy → Settings → Environment Variables)");
  console.log("   - Account Secrets (se você tiver acesso)");
  console.log("");
  process.exit(1);
} else {
  console.log("=".repeat(80));
  console.log("✅ VARIÁVEIS PG* NÃO ENCONTRADAS!");
  console.log("=".repeat(80));
  console.log("");
  console.log("As variáveis PG* não estão mais definidas.");
  console.log("Apenas DATABASE_URL está sendo usada.");
  console.log("");
  if (databaseUrl && databaseUrl.includes('neon.tech')) {
    console.log("✅ DATABASE_URL está apontando para Neon (correto)");
  } else {
    console.log("⚠️  DATABASE_URL não está apontando para Neon!");
  }
  console.log("");
  process.exit(0);
}


