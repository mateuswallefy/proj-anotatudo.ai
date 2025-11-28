/**
 * Tipos de eventos de assinatura padronizados
 */
export const SubscriptionEventTypes = {
  SUBSCRIPTION_CREATED: "subscription_created",
  SUBSCRIPTION_UPDATED: "subscription_updated",
  SUBSCRIPTION_REACTIVATED: "subscription_reactivated",
  SUBSCRIPTION_PAUSED: "subscription_paused",
  SUBSCRIPTION_UNPAUSED: "subscription_unpaused",
  SUBSCRIPTION_CANCELED: "subscription_canceled",
  SUBSCRIPTION_EXPIRED: "subscription_expired",
  SUBSCRIPTION_TRIAL_STARTED: "subscription_trial_started",
  SUBSCRIPTION_TRIAL_ENDED: "subscription_trial_ended",
  PAYMENT_SUCCEEDED: "payment_succeeded",
  PAYMENT_FAILED: "payment_failed",
  PAYMENT_REFUNDED: "payment_refunded",
} as const;

export type SubscriptionEventType = typeof SubscriptionEventTypes[keyof typeof SubscriptionEventTypes];

