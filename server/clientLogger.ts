/**
 * Client Logger - Sistema de logging completo estilo "espião" por cliente
 * Registra TUDO que acontece com cada cliente
 */

import { storage } from "./storage.js";

/**
 * Função utilitária para logar eventos do cliente
 * @param userId - ID do usuário (pode ser null para eventos do sistema)
 * @param eventType - Tipo do evento (ex: 'login', 'whatsapp_message_received', etc)
 * @param message - Mensagem descritiva do evento
 * @param data - Dados adicionais do evento (objeto JSON)
 */
export async function logClientEvent(
  userId: string | null,
  eventType: string,
  message: string,
  data: any = {}
): Promise<void> {
  try {
    await storage.logClientEvent(userId, eventType, message, data);
  } catch (error) {
    // Não quebrar o fluxo se o log falhar
    console.error(`[ClientLogger] Erro ao logar evento:`, error);
  }
}

/**
 * Tipos de eventos pré-definidos
 */
export const EventTypes = {
  // Autenticação
  LOGIN: "login",
  LOGOUT: "logout",
  LOGIN_ATTEMPT: "login_attempt",
  LOGIN_FAILED: "login_failed",
  PASSWORD_RESET: "password_reset",
  PASSWORD_RESET_REQUESTED: "password_reset_requested",
  
  // WhatsApp
  WHATSAPP_MESSAGE_RECEIVED: "whatsapp_message_received",
  WHATSAPP_MESSAGE_PROCESSED: "whatsapp_message_processed",
  WHATSAPP_RESPONSE_SENT: "whatsapp_response_sent",
  WHATSAPP_RESPONSE_DELIVERED: "whatsapp_response_delivered",
  WHATSAPP_ERROR: "whatsapp_error",
  
  // Webhooks
  WEBHOOK_RECEIVED: "webhook_received",
  WEBHOOK_PROCESSED: "webhook_processed",
  WEBHOOK_ERROR: "webhook_error",
  
  // Assinatura
  SUBSCRIPTION_CREATED: "subscription_created",
  SUBSCRIPTION_UPDATED: "subscription_updated",
  SUBSCRIPTION_CANCELED: "subscription_canceled",
  SUBSCRIPTION_STATUS_CHANGED: "subscription_status_changed",
  BILLING_FAILED: "billing_failed",
  BILLING_SUCCEEDED: "billing_succeeded",
  
  // Transações
  TRANSACTION_CREATED: "transaction_created",
  TRANSACTION_UPDATED: "transaction_updated",
  TRANSACTION_DELETED: "transaction_deleted",
  
  // Performance
  PROCESSING_TIME: "processing_time",
  DELIVERY_TIME: "delivery_time",
  HIGH_LATENCY: "high_latency",
  
  // Erros
  ERROR: "error",
  API_ERROR: "api_error",
  DATABASE_ERROR: "database_error",
  
  // Outros
  PROFILE_UPDATED: "profile_updated",
  SETTINGS_CHANGED: "settings_changed",
} as const;


