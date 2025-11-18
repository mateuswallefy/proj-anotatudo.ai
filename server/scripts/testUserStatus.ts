/**
 * Script de teste para a rota /api/user-status
 * 
 * Uso:
 *   npx tsx server/scripts/testUserStatus.ts <email>
 * 
 * Exemplo:
 *   npx tsx server/scripts/testUserStatus.ts user@example.com
 */

import { storage } from "../storage.js";

async function testUserStatus(email: string) {
  try {
    console.log(`[Test User Status] Testando email: ${email}\n`);

    // 1. Buscar usuário por email
    console.log(`[Test User Status] 1. Buscando usuário por email...`);
    const user = await storage.getUserByEmail(email);
    
    if (!user) {
      console.log(`[Test User Status] ❌ Usuário não encontrado`);
      console.log(`\nResultado esperado:`);
      console.log(JSON.stringify({
        userExists: false,
        subscriptionStatus: 'none',
        plan: null,
        nextPayment: null,
        whatsappAllowed: false,
      }, null, 2));
      return;
    }

    console.log(`[Test User Status] ✅ Usuário encontrado: ${user.id}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Nome: ${user.firstName} ${user.lastName}`);
    console.log(`   - Billing Status: ${user.billingStatus}`);
    console.log(`   - Plan Label: ${user.planLabel || 'N/A'}`);

    // 2. Verificar status de assinatura
    console.log(`\n[Test User Status] 2. Verificando status de assinatura...`);
    const subscriptionStatus = await storage.getUserSubscriptionStatus(user.id);
    console.log(`[Test User Status] ✅ Status: ${subscriptionStatus}`);

    // 3. Buscar assinaturas ativas
    console.log(`\n[Test User Status] 3. Buscando assinaturas ativas...`);
    const subscriptions = await storage.getSubscriptionsByUserId(user.id);
    console.log(`[Test User Status] ✅ Total de assinaturas: ${subscriptions.length}`);

    const activeSubscription = subscriptions.find(
      sub => (sub.status === 'active' || sub.status === 'trial') && 
      (!sub.currentPeriodEnd || new Date(sub.currentPeriodEnd) > new Date())
    );

    if (activeSubscription) {
      console.log(`[Test User Status] ✅ Assinatura ativa encontrada:`);
      console.log(`   - ID: ${activeSubscription.id}`);
      console.log(`   - Provider: ${activeSubscription.provider}`);
      console.log(`   - Plan: ${activeSubscription.planName}`);
      console.log(`   - Status: ${activeSubscription.status}`);
      console.log(`   - Current Period End: ${activeSubscription.currentPeriodEnd || 'N/A'}`);
    } else {
      console.log(`[Test User Status] ⚠️  Nenhuma assinatura ativa encontrada`);
    }

    // 4. Montar resposta esperada
    const plan = activeSubscription?.planName || user.planLabel || null;
    const nextPayment = activeSubscription?.currentPeriodEnd 
      ? new Date(activeSubscription.currentPeriodEnd).toISOString()
      : null;
    const whatsappAllowed = subscriptionStatus === 'active';

    const result = {
      userExists: true,
      subscriptionStatus,
      plan,
      nextPayment,
      whatsappAllowed,
    };

    console.log(`\n[Test User Status] ========================================`);
    console.log(`[Test User Status] RESULTADO ESPERADO DA API:`);
    console.log(`[Test User Status] ========================================\n`);
    console.log(JSON.stringify(result, null, 2));
    console.log(`\n[Test User Status] ✅ Teste concluído com sucesso!`);

  } catch (error: any) {
    console.error(`[Test User Status] ❌ ERRO:`, error.message);
    console.error(`[Test User Status] Stack:`, error.stack);
    process.exit(1);
  }
}

// Obter email da linha de comando
const email = process.argv[2];

if (!email) {
  console.error(`[Test User Status] ❌ Email é obrigatório`);
  console.error(`\nUso: npx tsx server/scripts/testUserStatus.ts <email>`);
  console.error(`Exemplo: npx tsx server/scripts/testUserStatus.ts user@example.com`);
  process.exit(1);
}

// Executar teste
testUserStatus(email);

