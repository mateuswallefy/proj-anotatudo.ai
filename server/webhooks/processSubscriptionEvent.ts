import { storage } from "../storage.js";
import { SubscriptionEventTypes } from "./subscriptionEventTypes.js";

/**
 * Tipos de eventos suportados da Cakto
 */
type CaktoEvent = 
  | "subscription_created"
  | "subscription_updated"
  | "subscription_canceled"
  | "subscription_suspended"
  | "subscription_resumed"
  | "subscription_expired"
  | "subscription_trial_ended"
  | "payment_succeeded"
  | "payment_failed"
  | "payment_refunded"
  | "payment_chargeback";

/**
 * Payload da Cakto
 */
interface CaktoPayload {
  event: CaktoEvent;
  data: {
    subscription?: {
      id: string;
      status: string;
      offer_id?: string;
      product_id?: string;
      amount?: number;
      trial_days?: number;
      next_payment_date?: string;
      current_period?: string;
      recurrence_period?: number | string; // Pode ser número (1, 30, 90, 365) ou string
      payment_method?: string;
      created_at?: string;
      updated_at?: string;
    };
    customer?: {
      name?: string;
      email: string;
      phone?: string;
      doc_number?: string;
      status?: string;
    };
    order?: {
      id: string;
      amount?: number;
      status?: string;
      paid_at?: string;
      due_date?: string;
      payment_method?: string;
      installments?: number;
      card_brand?: string;
      card_last_digits?: string;
      boleto_barcode?: string;
      pix_qr_code?: string;
      picpay_qr_code?: string;
    };
  };
}

/**
 * Mapeia status da Cakto para status interno
 */
function mapSubscriptionStatus(caktoStatus: string): 'trial' | 'active' | 'paused' | 'canceled' | 'overdue' {
  const statusMap: Record<string, 'trial' | 'active' | 'paused' | 'canceled' | 'overdue'> = {
    'active': 'active',
    'trial': 'trial',
    'canceled': 'canceled',
    'suspended': 'paused',
    'overdue': 'overdue',
    'paused': 'paused',
    'resumed': 'active',
  };
  return statusMap[caktoStatus.toLowerCase()] || 'active';
}

/**
 * Mapeia status de order da Cakto para status interno
 */
function mapOrderStatus(caktoStatus: string): 'paid' | 'failed' | 'refunded' | 'chargeback' {
  const statusMap: Record<string, 'paid' | 'failed' | 'refunded' | 'chargeback'> = {
    'paid': 'paid',
    'failed': 'failed',
    'refunded': 'refunded',
    'chargeback': 'chargeback',
  };
  return statusMap[caktoStatus.toLowerCase()] || 'failed';
}

/**
 * Cria ou atualiza cliente baseado nos dados do webhook
 */
async function upsertCustomer(customerData: CaktoPayload['data']['customer']) {
  if (!customerData?.email) {
    throw new Error("Email do cliente é obrigatório");
  }

  console.log(`[WEBHOOK] Processando cliente: ${customerData.email}`);

  const existingUser = await storage.getUserByEmail(customerData.email);

  const nameParts = (customerData.name || "").split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  // Preservar metadata do customer se presente (importante para testes)
  const customerMetadata = (customerData as any).metadata || {};
  
  const userData = {
    email: customerData.email,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    telefone: customerData.phone || undefined,
    whatsappNumber: customerData.phone || undefined,
    status: 'authenticated' as const,
    role: 'user' as const,
    metadata: {
      docNumber: customerData.doc_number,
      caktoStatus: customerData.status,
      // Preservar metadata do customer (especialmente isTest e createdBy)
      ...customerMetadata,
    },
  };

  if (existingUser) {
    console.log(`[WEBHOOK] Atualizando cliente existente: ${customerData.email}`);
    const updated = await storage.updateUser(existingUser.id, userData);
    return updated;
  } else {
    console.log(`[WEBHOOK] Criando novo cliente: ${customerData.email}`);
    const created = await storage.createUser(userData);
    return created;
  }
}

/**
 * Cria ou atualiza assinatura baseado nos dados do webhook
 */
async function upsertSubscription(
  userId: string,
  subscriptionData: CaktoPayload['data']['subscription']
) {
  if (!subscriptionData?.id) {
    throw new Error("ID da assinatura é obrigatório");
  }

  console.log(`[WEBHOOK] Processando assinatura: ${subscriptionData.id}`);

  // Determinar provider baseado no payload ou usar 'caktos' como padrão
  // Se isTest estiver presente, usar 'manual' para testes
  const isTest = (subscriptionData as any).isTest || false;
  const provider = isTest ? 'manual' : ((subscriptionData as any).provider || 'caktos');
  
  // Extrair meta do payload (pode estar em payload.data.meta)
  const payloadMeta = (subscriptionData as any).meta || {};
  
  const existingSubscription = await storage.getSubscriptionByProviderId(
    provider as 'caktos' | 'manual',
    subscriptionData.id
  );

  const amount = subscriptionData.amount || 0;
  const priceCents = Math.round(amount * 100); // Converter para centavos

  // Determinar billing interval baseado em recurrence_period
  // recurrence_period pode ser número (1, 30, 90, 180, 365) ou string
  let billingInterval: 'month' | 'year' = 'month';
  let interval: 'monthly' | 'yearly' = 'monthly';
  
  if (subscriptionData.recurrence_period !== undefined && subscriptionData.recurrence_period !== null) {
    console.log("Recurrence period recebido:", subscriptionData.recurrence_period, typeof subscriptionData.recurrence_period);
    
    // Se for número, mapear diretamente
    if (typeof subscriptionData.recurrence_period === 'number') {
      const periodDays = subscriptionData.recurrence_period;
      
      if (periodDays === 365 || periodDays === 366) {
        billingInterval = 'year';
        interval = 'yearly';
      } else if (periodDays === 180) {
        // Semestral - tratar como mensal por enquanto
        billingInterval = 'month';
        interval = 'monthly';
      } else if (periodDays === 90) {
        // Trimestral - tratar como mensal por enquanto
        billingInterval = 'month';
        interval = 'monthly';
      } else if (periodDays === 30 || periodDays === 31) {
        billingInterval = 'month';
        interval = 'monthly';
      } else if (periodDays === 1) {
        // Diário - apenas se for trial, senão tratar como mensal
        if (subscriptionData.trial_days && subscriptionData.trial_days > 0) {
          billingInterval = 'month'; // Trial diário ainda é tratado como mensal
          interval = 'monthly';
        } else {
          billingInterval = 'month';
          interval = 'monthly';
        }
      } else {
        // Default para mensal se não reconhecer
        billingInterval = 'month';
        interval = 'monthly';
      }
    } else {
      // Se for string, tratar como antes (compatibilidade)
      const period = String(subscriptionData.recurrence_period).toLowerCase();
      if (period.includes('year') || period.includes('anual')) {
        billingInterval = 'year';
        interval = 'yearly';
      }
    }
  }

  // Calcular trial_ends_at se trial_days existir
  let trialEndsAt: Date | undefined;
  if (subscriptionData.trial_days && subscriptionData.trial_days > 0) {
    trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + subscriptionData.trial_days);
  }

  // Calcular current_period_end baseado em next_payment_date
  let currentPeriodEnd: Date | undefined;
  if (subscriptionData.next_payment_date) {
    currentPeriodEnd = new Date(subscriptionData.next_payment_date);
  }

  const status = mapSubscriptionStatus(subscriptionData.status || 'active');

  const subscriptionDataToSave = {
    userId,
    provider: (provider as 'caktos' | 'manual') || 'caktos' as const,
    providerSubscriptionId: subscriptionData.id,
    planName: subscriptionData.product_id || 'Premium',
    priceCents,
    currency: 'BRL' as const,
    billingInterval,
    interval,
    status,
    trialEndsAt,
    currentPeriodEnd,
    meta: {
      offerId: subscriptionData.offer_id,
      productId: subscriptionData.product_id,
      paymentMethod: subscriptionData.payment_method,
      currentPeriod: subscriptionData.current_period,
      recurrencePeriod: subscriptionData.recurrence_period,
      caktoCreatedAt: subscriptionData.created_at,
      caktoUpdatedAt: subscriptionData.updated_at,
      isTest: (subscriptionData as any).isTest || false,
      createdBy: (subscriptionData as any).isTest 
        ? (payloadMeta.createdBy || 'admin-test')
        : undefined,
      providerId: payloadMeta.providerId,
    },
  };

  if (existingSubscription) {
    console.log(`[WEBHOOK] Atualizando assinatura existente: ${subscriptionData.id}`);
    const updated = await storage.updateSubscription(existingSubscription.id, subscriptionDataToSave);
    return updated;
  } else {
    console.log(`[WEBHOOK] Criando nova assinatura: ${subscriptionData.id}`);
    const created = await storage.createSubscription(subscriptionDataToSave);
    return created;
  }
}

/**
 * Cria order (pedido/cobrança) baseado nos dados do webhook
 */
async function createOrder(
  subscriptionId: string,
  orderData: CaktoPayload['data']['order']
) {
  if (!orderData?.id) {
    throw new Error("ID do pedido é obrigatório");
  }

  console.log(`[WEBHOOK] Processando pedido: ${orderData.id}`);

  // Verificar se order já existe
  // Verificar se order já existe (será atualizado via onConflictDoUpdate)
  const existingOrder = await storage.getOrderById(orderData.id);
  if (existingOrder) {
    console.log(`[WEBHOOK] Pedido já existe, será atualizado: ${orderData.id}`);
  }

  const amount = orderData.amount || 0;
  const amountCents = Math.round(amount * 100); // Converter para centavos

  const status = mapOrderStatus(orderData.status || 'failed');

  let paidAt: Date | undefined;
  if (orderData.paid_at) {
    paidAt = new Date(orderData.paid_at);
  }

  let dueDate: Date | undefined;
  if (orderData.due_date) {
    dueDate = new Date(orderData.due_date);
  }

  const orderToSave = {
    id: orderData.id,
    subscriptionId,
    amount: amountCents,
    status,
    paidAt,
    dueDate,
    paymentMethod: orderData.payment_method || undefined,
    installments: orderData.installments || undefined,
    cardBrand: orderData.card_brand || undefined,
    cardLastDigits: orderData.card_last_digits || undefined,
    boletoBarcode: orderData.boleto_barcode || undefined,
    pixQrCode: orderData.pix_qr_code || undefined,
    picpayQrCode: orderData.picpay_qr_code || undefined,
    meta: {
      rawOrderData: orderData,
    },
  };

  const order = await storage.createOrder(orderToSave);
  console.log(`[WEBHOOK] Pedido ${existingOrder ? 'atualizado' : 'criado'}: ${orderData.id}`);
  return order;
}

/**
 * Processa evento subscription_created
 */
async function processSubscriptionCreated(payload: CaktoPayload) {
  console.log("[WEBHOOK] Processando subscription_created");

  const { subscription, customer, order } = payload.data;

  if (!customer?.email) {
    throw new Error("Email do cliente é obrigatório para subscription_created");
  }

  if (!subscription?.id) {
    throw new Error("ID da assinatura é obrigatório para subscription_created");
  }

  // 1. Criar/atualizar cliente
  const user = await upsertCustomer(customer);

  // 2. Criar/atualizar assinatura (passar meta do payload se disponível)
  const payloadMeta = (payload.data as any).meta || {};
  if (payloadMeta.createdBy || payloadMeta.providerId) {
    // Adicionar meta ao subscription se não estiver presente
    if (!(subscription as any).meta) {
      (subscription as any).meta = {};
    }
    (subscription as any).meta = {
      ...(subscription as any).meta,
      ...payloadMeta,
    };
  }
  const subscriptionRecord = await upsertSubscription(user.id, subscription);

  // 3. Se houver order, criar order
  if (order?.id) {
    await createOrder(subscriptionRecord.id, order);
  }

  // 4. Atualizar status do cliente para active
  await storage.updateUser(user.id, {
    billingStatus: mapSubscriptionStatus(subscription.status || 'active'),
  });

  // 5. Registrar evento de assinatura criada
  try {
    const eventProvider = subscriptionRecord.provider || 'caktos';
    await storage.logSubscriptionEvent({
      subscriptionId: subscriptionRecord.id,
      clientId: user.id,
      type: SubscriptionEventTypes.SUBSCRIPTION_CREATED,
      provider: eventProvider,
      severity: 'info',
      message: `Assinatura criada com sucesso - ${subscription.id}`,
      payload: payload,
      origin: 'webhook',
    });
  } catch (logError) {
    console.error(`[WEBHOOK] Erro ao registrar evento subscription_created:`, logError);
  }

  console.log(`[WEBHOOK] subscription_created processado com sucesso - Cliente: ${customer.email}, Assinatura: ${subscription.id}`);
}

/**
 * Processa evento subscription_updated
 */
async function processSubscriptionUpdated(payload: CaktoPayload) {
  console.log("[WEBHOOK] Processando subscription_updated");

  const { subscription, customer } = payload.data;

  if (!subscription?.id) {
    throw new Error("ID da assinatura é obrigatório para subscription_updated");
  }

  // Buscar assinatura usando findSubscriptionByIdentifier (prioriza providerSubscriptionId)
  const existingSubscription = await (storage as any).findSubscriptionByIdentifier(subscription.id);
  if (!existingSubscription) {
    throw new Error(`Assinatura não encontrada: ${subscription.id}`);
  }

  // Atualizar assinatura
  if (customer?.email) {
    const user = await upsertCustomer(customer);
    await upsertSubscription(user.id, subscription);
    await storage.updateUser(user.id, {
      billingStatus: mapSubscriptionStatus(subscription.status || 'active'),
    });
  } else {
    await upsertSubscription(existingSubscription.userId, subscription);
  }

  // Registrar evento de assinatura atualizada
  try {
    const updatedSubscription = await (storage as any).findSubscriptionByIdentifier(subscription.id);
    if (updatedSubscription) {
      await storage.logSubscriptionEvent({
        subscriptionId: updatedSubscription.id,
        clientId: updatedSubscription.userId,
        type: SubscriptionEventTypes.SUBSCRIPTION_UPDATED,
        provider: updatedSubscription.provider || 'caktos',
        severity: 'info',
        message: `Assinatura atualizada - ${subscription.id}`,
        payload: payload,
        origin: 'webhook',
      });
    }
  } catch (logError) {
    console.error(`[WEBHOOK] Erro ao registrar evento subscription_updated:`, logError);
  }

  console.log(`[WEBHOOK] subscription_updated processado com sucesso - Assinatura: ${subscription.id}`);
}

/**
 * Processa evento payment_succeeded
 */
async function processPaymentSucceeded(payload: CaktoPayload) {
  console.log("[WEBHOOK] Processando payment_succeeded");

  const { subscription, order } = payload.data;

  if (!subscription?.id) {
    throw new Error("ID da assinatura é obrigatório para payment_succeeded");
  }

  if (!order?.id) {
    throw new Error("ID do pedido é obrigatório para payment_succeeded");
  }

  // Buscar assinatura usando findSubscriptionByIdentifier (prioriza providerSubscriptionId)
  const subscriptionRecord = await (storage as any).findSubscriptionByIdentifier(subscription.id);
  if (!subscriptionRecord) {
    throw new Error(`Assinatura não encontrada: ${subscription.id}`);
  }

  // Criar order
  await createOrder(subscriptionRecord.id, order);

  // Atualizar assinatura para active se estava overdue
  if (subscriptionRecord.status === 'overdue') {
    await storage.updateSubscription(subscriptionRecord.id, {
      status: 'active',
    });
  }

  // Registrar evento de pagamento bem-sucedido
  try {
    await storage.logSubscriptionEvent({
      subscriptionId: subscriptionRecord.id,
      clientId: subscriptionRecord.userId,
      type: SubscriptionEventTypes.PAYMENT_SUCCEEDED,
      provider: subscriptionRecord.provider || 'caktos',
      severity: 'info',
      message: `Pagamento confirmado - Pedido: ${order.id}`,
      payload: payload,
      origin: 'webhook',
    });
  } catch (logError) {
    console.error(`[WEBHOOK] Erro ao registrar evento payment_succeeded:`, logError);
  }

  console.log(`[WEBHOOK] payment_succeeded processado com sucesso - Assinatura: ${subscription.id}, Pedido: ${order.id}`);
}

/**
 * Processa evento payment_failed
 */
async function processPaymentFailed(payload: CaktoPayload) {
  console.log("[WEBHOOK] Processando payment_failed");

  const { subscription, order } = payload.data;

  if (!subscription?.id) {
    throw new Error("ID da assinatura é obrigatório para payment_failed");
  }

  // Buscar assinatura usando findSubscriptionByIdentifier (prioriza providerSubscriptionId)
  const subscriptionRecord = await (storage as any).findSubscriptionByIdentifier(subscription.id);
  if (!subscriptionRecord) {
    throw new Error(`Assinatura não encontrada: ${subscription.id}`);
  }

  // Criar order com status failed
  if (order?.id) {
    await createOrder(subscriptionRecord.id, order);
  }

  // Atualizar assinatura para overdue
  await storage.updateSubscription(subscriptionRecord.id, {
    status: 'overdue',
  });

  // Atualizar status do cliente
  const user = await storage.getUser(subscriptionRecord.userId);
  if (user) {
    await storage.updateUser(user.id, {
      billingStatus: 'overdue',
    });
  }

  // Registrar evento de pagamento falhado
  try {
    await storage.logSubscriptionEvent({
      subscriptionId: subscriptionRecord.id,
      clientId: subscriptionRecord.userId,
      type: SubscriptionEventTypes.PAYMENT_FAILED,
      provider: subscriptionRecord.provider || 'caktos',
      severity: 'error',
      message: `Pagamento falhou - Pedido: ${order?.id || 'N/A'}`,
      payload: payload,
      origin: 'webhook',
    });
  } catch (logError) {
    console.error(`[WEBHOOK] Erro ao registrar evento payment_failed:`, logError);
  }

  console.log(`[WEBHOOK] payment_failed processado com sucesso - Assinatura: ${subscription.id}`);
}

/**
 * Processa evento subscription_canceled
 */
async function processSubscriptionCanceled(payload: CaktoPayload) {
  console.log("[WEBHOOK] Processando subscription_canceled");

  const { subscription } = payload.data;

  if (!subscription?.id) {
    throw new Error("ID da assinatura é obrigatório para subscription_canceled");
  }

  // Buscar assinatura usando findSubscriptionByIdentifier (prioriza providerSubscriptionId)
  const subscriptionRecord = await (storage as any).findSubscriptionByIdentifier(subscription.id);
  if (!subscriptionRecord) {
    throw new Error(`Assinatura não encontrada: ${subscription.id}`);
  }

  // Atualizar assinatura para canceled
  await storage.updateSubscription(subscriptionRecord.id, {
    status: 'canceled',
  });

  // Atualizar status do cliente
  const user = await storage.getUser(subscriptionRecord.userId);
  if (user) {
    await storage.updateUser(user.id, {
      billingStatus: 'canceled',
    });
  }

  // Registrar evento de assinatura cancelada
  try {
    await storage.logSubscriptionEvent({
      subscriptionId: subscriptionRecord.id,
      clientId: subscriptionRecord.userId,
      type: SubscriptionEventTypes.SUBSCRIPTION_CANCELED,
      provider: subscriptionRecord.provider || 'caktos',
      severity: 'warning',
      message: `Assinatura cancelada - ${subscription.id}`,
      payload: payload,
      origin: 'webhook',
    });
  } catch (logError) {
    console.error(`[WEBHOOK] Erro ao registrar evento subscription_canceled:`, logError);
  }

  console.log(`[WEBHOOK] subscription_canceled processado com sucesso - Assinatura: ${subscription.id}`);
}

/**
 * Processa evento subscription_suspended
 */
async function processSubscriptionSuspended(payload: CaktoPayload) {
  console.log("[WEBHOOK] Processando subscription_suspended");

  const { subscription } = payload.data;

  if (!subscription?.id) {
    throw new Error("ID da assinatura é obrigatório para subscription_suspended");
  }

  // Buscar assinatura usando findSubscriptionByIdentifier (prioriza providerSubscriptionId)
  const subscriptionRecord = await (storage as any).findSubscriptionByIdentifier(subscription.id);
  if (!subscriptionRecord) {
    throw new Error(`Assinatura não encontrada: ${subscription.id}`);
  }

  // Atualizar assinatura para paused
  await storage.updateSubscription(subscriptionRecord.id, {
    status: 'paused',
  });

  // Atualizar status do cliente
  const user = await storage.getUser(subscriptionRecord.userId);
  if (user) {
    await storage.updateUser(user.id, {
      billingStatus: 'paused',
    });
  }

  // Registrar evento de assinatura pausada
  try {
    await storage.logSubscriptionEvent({
      subscriptionId: subscriptionRecord.id,
      clientId: subscriptionRecord.userId,
      type: SubscriptionEventTypes.SUBSCRIPTION_PAUSED,
      provider: 'caktos',
      severity: 'warning',
      message: `Assinatura pausada - ${subscription.id}`,
      payload: payload,
      origin: 'webhook',
    });
  } catch (logError) {
    console.error(`[WEBHOOK] Erro ao registrar evento subscription_suspended:`, logError);
  }

  console.log(`[WEBHOOK] subscription_suspended processado com sucesso - Assinatura: ${subscription.id}`);
}

/**
 * Processa evento subscription_resumed
 */
async function processSubscriptionResumed(payload: CaktoPayload) {
  console.log("[WEBHOOK] Processando subscription_resumed");

  const { subscription } = payload.data;

  if (!subscription?.id) {
    throw new Error("ID da assinatura é obrigatório para subscription_resumed");
  }

  // Buscar assinatura usando findSubscriptionByIdentifier (prioriza providerSubscriptionId)
  const subscriptionRecord = await (storage as any).findSubscriptionByIdentifier(subscription.id);
  if (!subscriptionRecord) {
    throw new Error(`Assinatura não encontrada: ${subscription.id}`);
  }

  // Atualizar assinatura para active
  await storage.updateSubscription(subscriptionRecord.id, {
    status: 'active',
  });

  // Atualizar status do cliente
  const user = await storage.getUser(subscriptionRecord.userId);
  if (user) {
    await storage.updateUser(user.id, {
      billingStatus: 'active',
    });
  }

  // Registrar evento de assinatura reativada
  try {
    await storage.logSubscriptionEvent({
      subscriptionId: subscriptionRecord.id,
      clientId: subscriptionRecord.userId,
      type: SubscriptionEventTypes.SUBSCRIPTION_REACTIVATED,
      provider: subscriptionRecord.provider || 'caktos',
      severity: 'info',
      message: `Assinatura reativada - ${subscription.id}`,
      payload: payload,
      origin: 'webhook',
    });
  } catch (logError) {
    console.error(`[WEBHOOK] Erro ao registrar evento subscription_resumed:`, logError);
  }

  console.log(`[WEBHOOK] subscription_resumed processado com sucesso - Assinatura: ${subscription.id}`);
}

/**
 * Processa evento payment_refunded
 */
async function processPaymentRefunded(payload: CaktoPayload) {
  console.log("[WEBHOOK] Processando payment_refunded");

  const { order } = payload.data;

  if (!order?.id) {
    throw new Error("ID do pedido é obrigatório para payment_refunded");
  }

  // Buscar order
  const existingOrder = await storage.getOrderById(order.id);
  if (existingOrder) {
    // Atualizar order para refunded (onConflictDoUpdate vai atualizar)
    await storage.createOrder({
      id: existingOrder.id,
      subscriptionId: existingOrder.subscriptionId,
      amount: existingOrder.amount,
      status: 'refunded',
      paidAt: existingOrder.paidAt,
      dueDate: existingOrder.dueDate,
      paymentMethod: existingOrder.paymentMethod,
      installments: existingOrder.installments,
      cardBrand: existingOrder.cardBrand,
      cardLastDigits: existingOrder.cardLastDigits,
      boletoBarcode: existingOrder.boletoBarcode,
      pixQrCode: existingOrder.pixQrCode,
      picpayQrCode: existingOrder.picpayQrCode,
      meta: existingOrder.meta,
    });
  }

  console.log(`[WEBHOOK] payment_refunded processado com sucesso - Pedido: ${order.id}`);
}

/**
 * Processa evento payment_chargeback
 */
async function processPaymentChargeback(payload: CaktoPayload) {
  console.log("[WEBHOOK] Processando payment_chargeback");

  const { order } = payload.data;

  if (!order?.id) {
    throw new Error("ID do pedido é obrigatório para payment_chargeback");
  }

  // Buscar order
  const existingOrder = await storage.getOrderById(order.id);
  if (existingOrder) {
    // Atualizar order para chargeback (onConflictDoUpdate vai atualizar)
    await storage.createOrder({
      id: existingOrder.id,
      subscriptionId: existingOrder.subscriptionId,
      amount: existingOrder.amount,
      status: 'chargeback',
      paidAt: existingOrder.paidAt,
      dueDate: existingOrder.dueDate,
      paymentMethod: existingOrder.paymentMethod,
      installments: existingOrder.installments,
      cardBrand: existingOrder.cardBrand,
      cardLastDigits: existingOrder.cardLastDigits,
      boletoBarcode: existingOrder.boletoBarcode,
      pixQrCode: existingOrder.pixQrCode,
      picpayQrCode: existingOrder.picpayQrCode,
      meta: existingOrder.meta,
    });
  }

  console.log(`[WEBHOOK] payment_chargeback processado com sucesso - Pedido: ${order.id}`);
}

/**
 * Processa evento subscription_trial_ended
 */
async function processSubscriptionTrialEnded(payload: CaktoPayload) {
  console.log("[WEBHOOK] Processando subscription_trial_ended");

  const { subscription } = payload.data;

  if (!subscription?.id) {
    throw new Error("ID da assinatura é obrigatório para subscription_trial_ended");
  }

  // Buscar assinatura usando findSubscriptionByIdentifier (prioriza providerSubscriptionId)
  const subscriptionRecord = await (storage as any).findSubscriptionByIdentifier(subscription.id);
  if (!subscriptionRecord) {
    throw new Error(`Assinatura não encontrada: ${subscription.id}`);
  }

  const now = new Date();
  const trialEndDate = subscription.trial_end_date ? new Date(subscription.trial_end_date) : now;

  // Atualizar assinatura: status para active, trialEndsAt para a data do trial_end_date
  await storage.updateSubscription(subscriptionRecord.id, {
    status: 'active',
    trialEndsAt: trialEndDate,
  });

  // Atualizar status do cliente
  const user = await storage.getUser(subscriptionRecord.userId);
  if (user) {
    await storage.updateUser(user.id, {
      billingStatus: 'active',
    });
  }

  // Registrar evento de trial encerrado
  try {
    await storage.logSubscriptionEvent({
      subscriptionId: subscriptionRecord.id,
      clientId: subscriptionRecord.userId,
      type: SubscriptionEventTypes.SUBSCRIPTION_TRIAL_ENDED,
      provider: subscriptionRecord.provider || 'caktos',
      severity: 'info',
      message: `Trial encerrado - Assinatura ativada`,
      payload: payload,
      origin: 'webhook',
    });
  } catch (logError) {
    console.error(`[WEBHOOK] Erro ao registrar evento subscription_trial_ended:`, logError);
  }

  console.log(`[WEBHOOK] subscription_trial_ended processado com sucesso - Assinatura: ${subscription.id}`);
}

/**
 * Função principal para processar eventos de webhook da Cakto
 */
export async function handleWebhookEvent(payload: CaktoPayload): Promise<void> {
  const { event, data } = payload;

  console.log(`[WEBHOOK] ========================================`);
  console.log(`[WEBHOOK] Evento recebido: ${event}`);
  console.log(`[WEBHOOK] Payload:`, JSON.stringify(data, null, 2));
  console.log(`[WEBHOOK] ========================================`);

  try {
    switch (event) {
      case "subscription_created":
        await processSubscriptionCreated(payload);
        break;
      case "subscription_updated":
        await processSubscriptionUpdated(payload);
        break;
      case "payment_succeeded":
        await processPaymentSucceeded(payload);
        break;
      case "payment_failed":
        await processPaymentFailed(payload);
        break;
      case "subscription_canceled":
        await processSubscriptionCanceled(payload);
        break;
      case "subscription_suspended":
        await processSubscriptionSuspended(payload);
        break;
      case "subscription_resumed":
        await processSubscriptionResumed(payload);
        break;
      case "subscription_trial_ended":
        await processSubscriptionTrialEnded(payload);
        break;
      case "payment_refunded":
        await processPaymentRefunded(payload);
        break;
      case "payment_chargeback":
        await processPaymentChargeback(payload);
        break;
      default:
        console.log(`[WEBHOOK] Evento não processado: ${event}`);
    }

    // NÃO criar novo webhook event aqui - isso já foi feito no endpoint
    // Apenas processar o evento
    console.log(`[WEBHOOK] ✅ Evento ${event} processado com sucesso`);
  } catch (error: any) {
    console.error(`[WEBHOOK] ❌ Erro ao processar evento ${event}:`, error);
    console.error(`[WEBHOOK] Stack:`, error.stack);

    // NÃO criar novo webhook event aqui - o processWebhook já cuida disso
    // Re-lançar erro para que processWebhook possa atualizar o status
    throw error;
  }
}

