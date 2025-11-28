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
    // 0. Salvar headers do webhook (se existirem)
    if (payload._headers) {
      try {
        await storage.saveWebhookHeaders(webhookId, payload._headers);
        console.log(`[WEBHOOK-PROCESSOR] Headers salvos para webhook: ${webhookId}`);
      } catch (headerError) {
        console.warn(`[WEBHOOK-PROCESSOR] Erro ao salvar headers:`, headerError);
      }
    }

    // Registrar log inicial
    try {
      await storage.saveWebhookLog({
        webhookEventId: webhookId,
        step: "Iniciando processamento",
        level: "info",
        timestamp: new Date(),
        payload: { event: payload.event },
      });
    } catch (logError) {
      console.warn(`[WEBHOOK-PROCESSOR] Erro ao salvar log inicial:`, logError);
    }

    // 1. Verificar idempotência (apenas em produção)
    const isProd = process.env.NODE_ENV === "production";
    const eventId = extractEventId(payload);
    
    if (eventId) {
      if (isProd) {
        // Em produção: idempotência ATIVADA
        const alreadyProcessed = await storage.checkEventProcessed(eventId);
        if (alreadyProcessed) {
          console.log(`[WEBHOOK-PROCESSOR] [IDEMPOTÊNCIA] Evento já processado → bloqueado (PROD)`);
          console.log(`[WEBHOOK-PROCESSOR] Evento: ${eventId}`);
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
      } else {
        // Em desenvolvimento: idempotência DESATIVADA
        console.log(`[WEBHOOK-PROCESSOR] [IDEMPOTÊNCIA] DEV MODE → repetição permitida`);
        console.log(`[WEBHOOK-PROCESSOR] Evento: ${eventId}`);
      }
    }

    // 2. Processar o evento
    console.log(`[WEBHOOK-PROCESSOR] Processando evento: ${payload.event}`);
    
    // Extrair informações para logs
    const subscriptionId = payload.data?.subscription?.id;
    const customerEmail = payload.data?.customer?.email;
    
    console.log(`[WEBHOOK-PROCESSOR] ID da assinatura: ${subscriptionId || 'N/A'}`);
    console.log(`[WEBHOOK-PROCESSOR] Email do cliente: ${customerEmail || 'N/A'}`);

    // Registrar log antes de processar
    if (subscriptionId) {
      try {
        await storage.saveWebhookLog({
          webhookEventId: webhookId,
          step: "Assinatura encontrada no payload",
          level: "info",
          payload: { subscriptionId },
        });
      } catch (logError) {
        console.warn(`[WEBHOOK-PROCESSOR] Erro ao salvar log:`, logError);
      }
    }

    // Processar usando o processador existente
    await handleWebhookEvent({
      event: payload.event,
      data: payload.data,
    });

    // Registrar log de sucesso
    try {
      await storage.saveWebhookLog({
        webhookEventId: webhookId,
        step: "Webhook processado com sucesso",
        level: "info",
        payload: { event: payload.event, subscriptionId, customerEmail },
      });
    } catch (logError) {
      console.warn(`[WEBHOOK-PROCESSOR] Erro ao salvar log de sucesso:`, logError);
    }

    // 3. Marcar evento como processado (idempotência) - apenas em produção
    if (eventId && isProd) {
      await storage.markEventProcessed({
        eventId,
        eventType: payload.event,
        webhookEventId: webhookId,
      });
      console.log(`[WEBHOOK-PROCESSOR] [IDEMPOTÊNCIA] Evento marcado como processado: ${eventId}`);
    } else if (eventId && !isProd) {
      console.log(`[WEBHOOK-PROCESSOR] [IDEMPOTÊNCIA] DEV MODE → evento não marcado como processado (permite repetição)`);
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

    // Registrar log de erro
    try {
      await storage.saveWebhookLog({
        webhookEventId: webhookId,
        step: "Erro ao processar webhook",
        level: "error",
        error: error.message || error.toString(),
        payload: { 
          event: payload.event,
          errorStack: error.stack,
        },
      });
    } catch (logError) {
      console.warn(`[WEBHOOK-PROCESSOR] Erro ao salvar log de erro:`, logError);
    }

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

