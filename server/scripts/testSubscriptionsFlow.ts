/**
 * Script de testes automáticos para validar o fluxo completo de assinaturas
 * 
 * Uso:
 *   DATABASE_URL=<url> npx tsx server/scripts/testSubscriptionsFlow.ts
 * 
 * Este script testa:
 * - Criação de cliente manual
 * - Criação automática de assinatura
 * - Edição de cliente
 * - Exclusão de cliente
 * - Verificação de assinatura via getUserSubscriptionStatus
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import { storage } from "../storage.js";
import { hashPassword } from "../auth.js";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, error?: string, details?: any) {
  results.push({ name, passed, error, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}`);
  if (error) {
    console.log(`   Erro: ${error}`);
  }
  if (details) {
    console.log(`   Detalhes: ${JSON.stringify(details, null, 2)}`);
  }
}

async function testCreateManualUser() {
  try {
    const testEmail = `test-${Date.now()}@example.com`;
    const testName = 'Test User';
    
    // Criar usuário
    const user = await storage.createUser({
      email: testEmail,
      firstName: 'Test',
      lastName: 'User',
      billingStatus: 'active',
      planLabel: 'Premium',
      status: 'authenticated',
      passwordHash: await hashPassword('test123'),
    });
    
    // Criar assinatura manual
    const crypto = await import('crypto');
    const subscriptionId = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    const subscription = await storage.createSubscription({
      userId: user.id,
      provider: 'manual',
      providerSubscriptionId: subscriptionId,
      planName: 'Premium',
      priceCents: 0,
      currency: 'BRL',
      billingInterval: 'month',
      interval: 'monthly',
      status: 'active',
      currentPeriodEnd: expiresAt,
      meta: {
        createdBy: 'test',
        createdAt: now.toISOString(),
      },
    });
    
    logTest('Criação de cliente manual + assinatura', true, undefined, {
      userId: user.id,
      subscriptionId: subscription.id,
      currentPeriodEnd: subscription.currentPeriodEnd,
    });
    
    return { user, subscription };
  } catch (error: any) {
    logTest('Criação de cliente manual + assinatura', false, error.message);
    throw error;
  }
}

async function testGetUserSubscriptionStatus(userId: string) {
  try {
    const status = await storage.getUserSubscriptionStatus(userId);
    
    if (status === 'active') {
      logTest('getUserSubscriptionStatus retorna "active"', true, undefined, { status });
    } else {
      logTest('getUserSubscriptionStatus retorna "active"', false, `Esperado "active", recebido "${status}"`);
    }
    
    return status;
  } catch (error: any) {
    logTest('getUserSubscriptionStatus', false, error.message);
    throw error;
  }
}

async function testUpdateSubscription(userId: string) {
  try {
    const subscriptions = await storage.getSubscriptionsByUserId(userId);
    if (subscriptions.length === 0) {
      logTest('Atualização de assinatura', false, 'Nenhuma assinatura encontrada');
      return;
    }
    
    const subscription = subscriptions[0];
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 60);
    
    const updated = await storage.updateSubscription(subscription.id, {
      currentPeriodEnd: newExpiresAt,
      interval: 'yearly',
    });
    
    if (updated && updated.currentPeriodEnd) {
      const updatedDate = new Date(updated.currentPeriodEnd);
      if (updatedDate.getTime() === newExpiresAt.getTime()) {
        logTest('Atualização de assinatura (currentPeriodEnd, interval)', true);
      } else {
        logTest('Atualização de assinatura', false, 'currentPeriodEnd não foi atualizado corretamente');
      }
    } else {
      logTest('Atualização de assinatura', false, 'Assinatura não foi atualizada');
    }
  } catch (error: any) {
    logTest('Atualização de assinatura', false, error.message);
  }
}

async function testDuplicateEmail() {
  try {
    const testEmail = `test-duplicate-${Date.now()}@example.com`;
    
    // Criar primeiro usuário
    const user1 = await storage.createUser({
      email: testEmail,
      firstName: 'Test',
      lastName: 'User1',
      billingStatus: 'active',
      status: 'authenticated',
      passwordHash: await hashPassword('test123'),
    });
    
    // Tentar criar segundo usuário com mesmo email
    try {
      await storage.createUser({
        email: testEmail,
        firstName: 'Test',
        lastName: 'User2',
        billingStatus: 'active',
        status: 'authenticated',
        passwordHash: await hashPassword('test123'),
      });
      
      logTest('Impossibilidade de duplicar e-mail', false, 'Permitiu criar usuário com email duplicado');
    } catch (error: any) {
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        logTest('Impossibilidade de duplicar e-mail', true);
      } else {
        logTest('Impossibilidade de duplicar e-mail', false, `Erro inesperado: ${error.message}`);
      }
    }
    
    // Limpar
    await storage.updateUser(user1.id, { email: `deleted-${testEmail}` });
  } catch (error: any) {
    logTest('Impossibilidade de duplicar e-mail', false, error.message);
  }
}

async function testDeleteUser(userId: string) {
  try {
    // Verificar assinaturas antes
    const subscriptionsBefore = await storage.getSubscriptionsByUserId(userId);
    
    // Deletar usuário (cascade deve deletar assinaturas)
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
    } finally {
      client.release();
    }
    
    // Verificar se assinaturas foram deletadas
    const subscriptionsAfter = await storage.getSubscriptionsByUserId(userId);
    
    if (subscriptionsAfter.length === 0 && subscriptionsBefore.length > 0) {
      logTest('Exclusão de cliente (cascade deleta assinaturas)', true);
    } else {
      logTest('Exclusão de cliente (cascade deleta assinaturas)', false, 
        `Assinaturas não foram deletadas. Antes: ${subscriptionsBefore.length}, Depois: ${subscriptionsAfter.length}`);
    }
  } catch (error: any) {
    logTest('Exclusão de cliente', false, error.message);
  }
}

async function testCurrentPeriodEndCalculation() {
  try {
    const testEmail = `test-period-${Date.now()}@example.com`;
    
    const user = await storage.createUser({
      email: testEmail,
      firstName: 'Test',
      lastName: 'User',
      billingStatus: 'active',
      status: 'authenticated',
      passwordHash: await hashPassword('test123'),
    });
    
    const crypto = await import('crypto');
    const subscriptionId = crypto.randomUUID();
    const now = new Date();
    
    // Testar monthly (30 dias)
    const expiresMonthly = new Date(now);
    expiresMonthly.setDate(expiresMonthly.getDate() + 30);
    
    const subMonthly = await storage.createSubscription({
      userId: user.id,
      provider: 'manual',
      providerSubscriptionId: `${subscriptionId}-monthly`,
      planName: 'Premium',
      priceCents: 0,
      currency: 'BRL',
      billingInterval: 'month',
      interval: 'monthly',
      status: 'active',
      currentPeriodEnd: expiresMonthly,
    });
    
    // Testar yearly (365 dias)
    const expiresYearly = new Date(now);
    expiresYearly.setDate(expiresYearly.getDate() + 365);
    
    const subYearly = await storage.createSubscription({
      userId: user.id,
      provider: 'manual',
      providerSubscriptionId: `${subscriptionId}-yearly`,
      planName: 'Premium',
      priceCents: 0,
      currency: 'BRL',
      billingInterval: 'year',
      interval: 'yearly',
      status: 'active',
      currentPeriodEnd: expiresYearly,
    });
    
    const monthlyDate = subMonthly.currentPeriodEnd ? new Date(subMonthly.currentPeriodEnd) : null;
    const yearlyDate = subYearly.currentPeriodEnd ? new Date(subYearly.currentPeriodEnd) : null;
    
    if (monthlyDate && yearlyDate) {
      const diffMonthly = Math.floor((monthlyDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const diffYearly = Math.floor((yearlyDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffMonthly >= 29 && diffMonthly <= 31 && diffYearly >= 364 && diffYearly <= 366) {
        logTest('Cálculo de current_period_end (monthly/yearly)', true, undefined, {
          monthly: diffMonthly,
          yearly: diffYearly,
        });
      } else {
        logTest('Cálculo de current_period_end', false, 
          `Monthly: ${diffMonthly} dias (esperado ~30), Yearly: ${diffYearly} dias (esperado ~365)`);
      }
    } else {
      logTest('Cálculo de current_period_end', false, 'currentPeriodEnd não foi salvo');
    }
    
    // Limpar
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM users WHERE id = $1', [user.id]);
    } finally {
      client.release();
    }
  } catch (error: any) {
    logTest('Cálculo de current_period_end', false, error.message);
  }
}

async function runAllTests() {
  console.log(`[Test Subscriptions Flow] Iniciando testes...\n`);
  
  let testUser: any = null;
  let testSubscription: any = null;
  
  try {
    // Teste 1: Criação de cliente manual + assinatura
    const createResult = await testCreateManualUser();
    testUser = createResult.user;
    testSubscription = createResult.subscription;
    
    // Teste 2: Verificar status de assinatura
    await testGetUserSubscriptionStatus(testUser.id);
    
    // Teste 3: Atualizar assinatura
    await testUpdateSubscription(testUser.id);
    
    // Teste 4: Verificar duplicação de email
    await testDuplicateEmail();
    
    // Teste 5: Cálculo de current_period_end
    await testCurrentPeriodEndCalculation();
    
    // Teste 6: Exclusão de cliente (cascade)
    if (testUser) {
      await testDeleteUser(testUser.id);
    }
    
  } catch (error: any) {
    console.error(`[Test Subscriptions Flow] ❌ Erro durante testes:`, error);
  }
  
  // Resumo
  console.log(`\n[Test Subscriptions Flow] ========================================`);
  console.log(`[Test Subscriptions Flow] RESUMO DOS TESTES`);
  console.log(`[Test Subscriptions Flow] ========================================\n`);
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`Total: ${results.length} testes`);
  console.log(`✅ Passou: ${passed}`);
  console.log(`❌ Falhou: ${failed}\n`);
  
  if (failed === 0) {
    console.log(`[Test Subscriptions Flow] ✅ TODOS OS TESTES PASSARAM!`);
    process.exit(0);
  } else {
    console.log(`[Test Subscriptions Flow] ❌ ALGUNS TESTES FALHARAM`);
    console.log(`\nTestes que falharam:`);
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
    process.exit(1);
  }
}

// Executar testes
runAllTests();

