import { storage } from "../storage.js";
import { handleWebhookEvent } from "./processSubscriptionEvent.js";

/**
 * Extrai o eventId único do payload para idempotência
 */
function extractEventId(payload: any): string | null {
  // Tentar diferentes formatos de ID
  if (payload.data?.subscription?.id) {
    return `subscription_${payload.data.subscription.id}`;
  }
  if (payload.data?.order?.id) {
    return `order_${payload.data.order.id}`;
  }
  if (payload.data?.customer?.id) {
    return `customer_${payload.data.customer.id}`;
  }
  // Fallback: usar event + timestamp se não houver ID único
  return `${payload.event}_${Date.now()}`;
}

/**
 * Processa um webhook de forma completa e profissional
 */
export async function processWebhook(webhookId: string, payload: any): Promise<void> {
  console.log(`[WEBHOOK-PROCESSOR] ========================================`);
  console.log(`[WEBHOOK-PROCESSOR] Iniciando processamento do webhook: ${webhookId}`);
  console.log(`[WEBHOOK-PROCESSOR] Evento: ${payload.event}`);
  console.log(`[WEBHOOK-PROCESSOR] ========================================`);

  try {
    // 1. Verificar idempotência
    const eventId = extractEventId(payload);
    if (eventId) {
      const alreadyProcessed = await storage.checkEventProcessed(eventId);
      if (alreadyProcessed) {
        console.log(`[WEBHOOK-PROCESSOR] ⚠️  Evento já processado anteriormente: ${eventId}`);
        console.log(`[WEBHOOK-PROCESSOR] Processado em: ${alreadyProcessed.processedAt}`);
        
        // Marcar webhook como processado (já foi processado antes)
        await storage.updateWebhookStatus(webhookId, {
          status: 'processed',
          processedAt: new Date(),
          errorMessage: null,
        });
        
        console.log(`[WEBHOOK-PROCESSOR] ✅ Webhook marcado como processado (idempotência): ${webhookId}`);
        return; // Não processar novamente
      }
    }

    // 2. Processar o evento
    console.log(`[WEBHOOK-PROCESSOR] Processando evento: ${payload.event}`);
    
    // Extrair informações para logs
    const subscriptionId = payload.data?.subscription?.id;
    const customerEmail = payload.data?.customer?.email;
    
    console.log(`[WEBHOOK-PROCESSOR] ID da assinatura: ${subscriptionId || 'N/A'}`);
    console.log(`[WEBHOOK-PROCESSOR] Email do cliente: ${customerEmail || 'N/A'}`);

    // Processar usando o processador existente
    await handleWebhookEvent({
      event: payload.event,
      data: payload.data,
    });

    // 3. Marcar evento como processado (idempotência)
    if (eventId) {
      await storage.markEventProcessed({
        eventId,
        eventType: payload.event,
        webhookEventId: webhookId,
      });
    }

    // 4. Marcar webhook como processado com sucesso
    await storage.updateWebhookStatus(webhookId, {
      status: 'processed',
      processedAt: new Date(),
      errorMessage: null,
    });

    console.log(`[WEBHOOK-PROCESSOR] ✅ Webhook processado com sucesso: ${webhookId}`);
    console.log(`[WEBHOOK-PROCESSOR] Evento: ${payload.event}`);
    console.log(`[WEBHOOK-PROCESSOR] Cliente: ${customerEmail || 'N/A'}`);
    console.log(`[WEBHOOK-PROCESSOR] Assinatura: ${subscriptionId || 'N/A'}`);

  } catch (error: any) {
    console.error(`[WEBHOOK-PROCESSOR] ❌ Erro ao processar webhook ${webhookId}:`, error);
    console.error(`[WEBHOOK-PROCESSOR] Stack:`, error.stack);
    console.error(`[WEBHOOK-PROCESSOR] Payload:`, JSON.stringify(payload, null, 2));

    // Obter webhook atual para incrementar retry_count
    const webhook = await storage.getWebhookEventById(webhookId);
    const currentRetryCount = webhook?.retryCount || 0;

    // Marcar webhook como falhado
    await storage.updateWebhookStatus(webhookId, {
      status: 'failed',
      errorMessage: error.stack || error.message || 'Erro desconhecido',
      retryCount: currentRetryCount + 1,
      lastRetryAt: new Date(),
    });

    console.log(`[WEBHOOK-PROCESSOR] ❌ Webhook marcado como falhado: ${webhookId}`);
    console.log(`[WEBHOOK-PROCESSOR] Retry count: ${currentRetryCount + 1}`);
    
    // Re-lançar erro para que o endpoint possa logar mas ainda retornar 200
    throw error;
  }
}

/**
 * Reprocessa webhooks falhados (função de retry)
 */
export async function retryFailedWebhooks(maxRetries: number = 5): Promise<void> {
  console.log(`[WEBHOOK-RETRY] ========================================`);
  console.log(`[WEBHOOK-RETRY] Iniciando retry de webhooks falhados`);
  console.log(`[WEBHOOK-RETRY] Max retries: ${maxRetries}`);
  console.log(`[WEBHOOK-RETRY] ========================================`);

  try {
    const failedWebhooks = await storage.getFailedWebhooks(maxRetries);
    
    console.log(`[WEBHOOK-RETRY] Encontrados ${failedWebhooks.length} webhooks para reprocessar`);

    for (const webhook of failedWebhooks) {
      try {
        console.log(`[WEBHOOK-RETRY] Reprocessando webhook: ${webhook.id} (tentativa ${webhook.retryCount + 1}/${maxRetries})`);
        
        // Atualizar last_retry_at
        await storage.updateWebhookStatus(webhook.id, {
          status: 'pending',
          lastRetryAt: new Date(),
        });

        // Processar novamente
        const payload = {
          event: webhook.event || webhook.type,
          data: webhook.payload,
        };

        await processWebhook(webhook.id, payload);

        console.log(`[WEBHOOK-RETRY] ✅ Webhook ${webhook.id} reprocessado com sucesso`);

      } catch (error: any) {
        console.error(`[WEBHOOK-RETRY] ❌ Erro ao reprocessar webhook ${webhook.id}:`, error);
        
        // Atualizar status como falhado novamente
        const currentRetryCount = webhook.retryCount || 0;
        await storage.updateWebhookStatus(webhook.id, {
          status: 'failed',
          errorMessage: error.stack || error.message || 'Erro desconhecido',
          retryCount: currentRetryCount + 1,
          lastRetryAt: new Date(),
        });
      }
    }

    console.log(`[WEBHOOK-RETRY] ✅ Retry concluído`);
    console.log(`[WEBHOOK-RETRY] Processados: ${failedWebhooks.length} webhooks`);

  } catch (error: any) {
    console.error(`[WEBHOOK-RETRY] ❌ Erro crítico no retry:`, error);
    throw error;
  }
}

