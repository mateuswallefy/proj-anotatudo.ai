import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  decimal,
  text,
  integer,
  date,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  telefone: varchar("telefone").unique(),
  plano: varchar("plano").default('free'),
  status: varchar("status", { enum: ['awaiting_email', 'authenticated'] }).default('awaiting_email'),
  role: varchar("role", { enum: ['user', 'admin'] }).default('user').notNull(),
  whatsappNumber: varchar("whatsapp_number"),
  planLabel: varchar("plan_label"),
  billingStatus: varchar("billing_status", { enum: ['trial', 'active', 'paused', 'canceled', 'overdue', 'none'] }).default('none').notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  passwordHash: true,
}).extend({
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres"),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;

// WhatsApp sessions table (tracks conversation state for phone numbers)
export const whatsappSessions = pgTable("whatsapp_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: varchar("phone_number").notNull().unique(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  email: varchar("email"),
  status: varchar("status", { enum: ['awaiting_email', 'verified', 'blocked'] }).default('awaiting_email').notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  failedAttempts: integer("failed_attempts").default(0).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const whatsappSessionsRelations = relations(whatsappSessions, ({ one }) => ({
  user: one(users, {
    fields: [whatsappSessions.userId],
    references: [users.id],
  }),
}));

export const insertWhatsAppSessionSchema = createInsertSchema(whatsappSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWhatsAppSession = z.infer<typeof insertWhatsAppSessionSchema>;
export type WhatsAppSession = typeof whatsappSessions.$inferSelect;

// Transactions table
export const transacoes = pgTable("transacoes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  tipo: varchar("tipo", { enum: ['entrada', 'saida', 'economia'] }).notNull(),
  categoria: varchar("categoria").notNull(),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  dataRegistro: timestamp("data_registro").defaultNow(),
  dataReal: date("data_real").notNull(),
  origem: varchar("origem", { enum: ['texto', 'audio', 'foto', 'video', 'manual'] }).notNull(),
  descricao: text("descricao"),
  mediaUrl: varchar("media_url"),
  cartaoId: varchar("cartao_id").references(() => cartoes.id, { onDelete: 'set null' }),
  goalId: varchar("goal_id").references(() => goals.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transacoesRelations = relations(transacoes, ({ one }) => ({
  user: one(users, {
    fields: [transacoes.userId],
    references: [users.id],
  }),
  cartao: one(cartoes, {
    fields: [transacoes.cartaoId],
    references: [cartoes.id],
  }),
  goal: one(goals, {
    fields: [transacoes.goalId],
    references: [goals.id],
  }),
}));

export const insertTransacaoSchema = createInsertSchema(transacoes).omit({
  id: true,
  createdAt: true,
  dataRegistro: true,
});

export type InsertTransacao = z.infer<typeof insertTransacaoSchema>;
export type Transacao = typeof transacoes.$inferSelect;

// Credit cards table
export const cartoes = pgTable("cartoes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  nomeCartao: varchar("nome_cartao").notNull(),
  limiteTotal: decimal("limite_total", { precision: 10, scale: 2 }).notNull(),
  limiteUsado: decimal("limite_usado", { precision: 10, scale: 2 }).default('0').notNull(),
  diaFechamento: integer("dia_fechamento").notNull(),
  diaVencimento: integer("dia_vencimento").notNull(),
  bandeira: varchar("bandeira", { enum: ['visa', 'mastercard', 'elo', 'american-express', 'outro'] }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cartoesRelations = relations(cartoes, ({ one, many }) => ({
  user: one(users, {
    fields: [cartoes.userId],
    references: [users.id],
  }),
  faturas: many(faturas),
}));

export const insertCartaoSchema = createInsertSchema(cartoes).omit({
  id: true,
  createdAt: true,
  limiteUsado: true,
});

export type InsertCartao = z.infer<typeof insertCartaoSchema>;
export type Cartao = typeof cartoes.$inferSelect;

// Invoice table
export const faturas = pgTable("faturas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cartaoId: varchar("cartao_id").notNull().references(() => cartoes.id, { onDelete: 'cascade' }),
  mes: integer("mes").notNull(),
  ano: integer("ano").notNull(),
  valorFechado: decimal("valor_fechado", { precision: 10, scale: 2 }).default('0').notNull(),
  status: varchar("status", { enum: ['aberta', 'paga', 'vencida'] }).default('aberta').notNull(),
  dataFechamento: date("data_fechamento"),
  dataPagamento: date("data_pagamento"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const faturasRelations = relations(faturas, ({ one, many }) => ({
  cartao: one(cartoes, {
    fields: [faturas.cartaoId],
    references: [cartoes.id],
  }),
  transacoes: many(cartaoTransacoes),
}));

export const insertFaturaSchema = createInsertSchema(faturas).omit({
  id: true,
  createdAt: true,
});

export type InsertFatura = z.infer<typeof insertFaturaSchema>;
export type Fatura = typeof faturas.$inferSelect;

// Card transactions table (for invoice items)
export const cartaoTransacoes = pgTable("cartao_transacoes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  faturaId: varchar("fatura_id").notNull().references(() => faturas.id, { onDelete: 'cascade' }),
  descricao: text("descricao").notNull(),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  dataCompra: date("data_compra").notNull(),
  categoria: varchar("categoria"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cartaoTransacoesRelations = relations(cartaoTransacoes, ({ one }) => ({
  fatura: one(faturas, {
    fields: [cartaoTransacoes.faturaId],
    references: [faturas.id],
  }),
}));

export const insertCartaoTransacaoSchema = createInsertSchema(cartaoTransacoes).omit({
  id: true,
  createdAt: true,
});

export type InsertCartaoTransacao = z.infer<typeof insertCartaoTransacaoSchema>;
export type CartaoTransacao = typeof cartaoTransacoes.$inferSelect;

// Categories for financial transactions
export const categorias = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Educação',
  'Lazer',
  'Compras',
  'Contas',
  'Salário',
  'Investimentos',
  'Outros',
] as const;

export type Categoria = typeof categorias[number];

// Goals table (metas de economia)
export const goals = pgTable("goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  nome: varchar("nome").notNull(),
  descricao: text("descricao"),
  valorAlvo: decimal("valor_alvo", { precision: 10, scale: 2 }).notNull(),
  valorAtual: decimal("valor_atual", { precision: 10, scale: 2 }).default('0').notNull(),
  dataInicio: date("data_inicio").notNull(),
  dataFim: date("data_fim"),
  prioridade: varchar("prioridade", { enum: ['baixa', 'media', 'alta'] }).default('media').notNull(),
  status: varchar("status", { enum: ['ativa', 'concluida', 'cancelada'] }).default('ativa').notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const goalsRelations = relations(goals, ({ one }) => ({
  user: one(users, {
    fields: [goals.userId],
    references: [users.id],
  }),
}));

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  createdAt: true,
  valorAtual: true,
});

export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goals.$inferSelect;

// Spending limits table (tetos de gasto)
export const spendingLimits = pgTable("spending_limits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  tipo: varchar("tipo", { enum: ['mensal_total', 'mensal_categoria'] }).notNull(),
  categoria: varchar("categoria"), // null para mensal_total
  valorLimite: decimal("valor_limite", { precision: 10, scale: 2 }).notNull(),
  mes: integer("mes"), // null para limite permanente
  ano: integer("ano"), // null para limite permanente
  ativo: varchar("ativo", { enum: ['sim', 'nao'] }).default('sim').notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const spendingLimitsRelations = relations(spendingLimits, ({ one }) => ({
  user: one(users, {
    fields: [spendingLimits.userId],
    references: [users.id],
  }),
}));

export const insertSpendingLimitSchema = createInsertSchema(spendingLimits).omit({
  id: true,
  createdAt: true,
});

export type InsertSpendingLimit = z.infer<typeof insertSpendingLimitSchema>;
export type SpendingLimit = typeof spendingLimits.$inferSelect;

// Account members table (membros compartilhados)
export const accountMembers = pgTable("account_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountOwnerId: varchar("account_owner_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  memberId: varchar("member_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar("role", { enum: ['owner', 'member', 'viewer'] }).default('member').notNull(),
  status: varchar("status", { enum: ['ativo', 'pendente', 'removido'] }).default('ativo').notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const accountMembersRelations = relations(accountMembers, ({ one }) => ({
  accountOwner: one(users, {
    fields: [accountMembers.accountOwnerId],
    references: [users.id],
  }),
  member: one(users, {
    fields: [accountMembers.memberId],
    references: [users.id],
  }),
}));

export const insertAccountMemberSchema = createInsertSchema(accountMembers).omit({
  id: true,
  createdAt: true,
});

export type InsertAccountMember = z.infer<typeof insertAccountMemberSchema>;
export type AccountMember = typeof accountMembers.$inferSelect;

// Purchases table (compras do Caktos)
export const purchases = pgTable("purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  telefone: varchar("telefone"),
  status: varchar("status", { enum: ['approved', 'pending', 'refunded'] }).notNull(),
  purchaseId: varchar("purchase_id").unique().notNull(), // UNIQUE constraint for UPSERT
  productName: varchar("product_name"),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type Purchase = typeof purchases.$inferSelect;

// Custom categories table (categorias customizadas do usuário)
export const categoriasCustomizadas = pgTable("categorias_customizadas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  nome: varchar("nome", { length: 50 }).notNull(),
  emoji: varchar("emoji", { length: 10 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categoriasCustomizadasRelations = relations(categoriasCustomizadas, ({ one }) => ({
  user: one(users, {
    fields: [categoriasCustomizadas.userId],
    references: [users.id],
  }),
}));

export const insertCategoriaCustomizadaSchema = createInsertSchema(categoriasCustomizadas).omit({
  id: true,
  createdAt: true,
});

export type InsertCategoriaCustomizada = z.infer<typeof insertCategoriaCustomizadaSchema>;
export type CategoriaCustomizada = typeof categoriasCustomizadas.$inferSelect;

// Contas bancárias table (saldo em conta)
export const contas = pgTable("contas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  nomeConta: varchar("nome_conta").notNull(), // Ex: "Nubank", "Itaú"
  tipoConta: varchar("tipo_conta", { enum: ['corrente', 'poupanca', 'investimento'] }).notNull(),
  saldoAtual: decimal("saldo_atual", { precision: 10, scale: 2 }).default('0').notNull(),
  banco: varchar("banco"),
  corIdentificacao: varchar("cor_identificacao").default('#10B981'), // Cor para UI
  createdAt: timestamp("created_at").defaultNow(),
});

export const contasRelations = relations(contas, ({ one }) => ({
  user: one(users, {
    fields: [contas.userId],
    references: [users.id],
  }),
}));

export const insertContaSchema = createInsertSchema(contas).omit({
  id: true,
  createdAt: true,
});

export type InsertConta = z.infer<typeof insertContaSchema>;
export type Conta = typeof contas.$inferSelect;

// Investimentos table (portfólio)
export const investimentos = pgTable("investimentos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  nomeInvestimento: varchar("nome_investimento").notNull(), // Ex: "Tesouro Direto"
  tipoInvestimento: varchar("tipo_investimento", { enum: ['renda_fixa', 'renda_variavel', 'fundos', 'cripto', 'outro'] }).notNull(),
  valorAplicado: decimal("valor_aplicado", { precision: 10, scale: 2 }).notNull(),
  valorAtual: decimal("valor_atual", { precision: 10, scale: 2 }).notNull(),
  rentabilidade: decimal("rentabilidade", { precision: 5, scale: 2 }).default('0').notNull(), // Em porcentagem
  dataAplicacao: date("data_aplicacao").notNull(),
  instituicao: varchar("instituicao"), // Ex: "Banco Inter"
  createdAt: timestamp("created_at").defaultNow(),
});

export const investimentosRelations = relations(investimentos, ({ one }) => ({
  user: one(users, {
    fields: [investimentos.userId],
    references: [users.id],
  }),
}));

export const insertInvestimentoSchema = createInsertSchema(investimentos).omit({
  id: true,
  createdAt: true,
});

export type InsertInvestimento = z.infer<typeof insertInvestimentoSchema>;
export type Investimento = typeof investimentos.$inferSelect;

// Alertas table (alertas importantes)
export const alertas = pgTable("alertas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  tipoAlerta: varchar("tipo_alerta", { enum: ['orcamento_excedido', 'vencimento_fatura', 'meta_atingida', 'gasto_acima_media', 'outro'] }).notNull(),
  titulo: varchar("titulo", { length: 200 }).notNull(),
  descricao: text("descricao"),
  prioridade: varchar("prioridade", { enum: ['baixa', 'media', 'alta'] }).default('media').notNull(),
  lido: varchar("lido", { enum: ['sim', 'nao'] }).default('nao').notNull(),
  dataExpiracao: timestamp("data_expiracao"), // Alertas podem expirar
  createdAt: timestamp("created_at").defaultNow(),
});

export const alertasRelations = relations(alertas, ({ one }) => ({
  user: one(users, {
    fields: [alertas.userId],
    references: [users.id],
  }),
}));

export const insertAlertaSchema = createInsertSchema(alertas).omit({
  id: true,
  createdAt: true,
});

export type InsertAlerta = z.infer<typeof insertAlertaSchema>;
export type Alerta = typeof alertas.$inferSelect;

// Insights table (insights inteligentes gerados por AI)
export const insights = pgTable("insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  tipoInsight: varchar("tipo_insight", { enum: ['economia', 'investimento', 'otimizacao_cartao', 'outro'] }).notNull(),
  titulo: varchar("titulo", { length: 200 }).notNull(),
  descricao: text("descricao").notNull(),
  valorImpacto: decimal("valor_impacto", { precision: 10, scale: 2 }), // Impacto financeiro estimado
  percentualImpacto: decimal("percentual_impacto", { precision: 5, scale: 2 }), // % de impacto
  acaoSugerida: text("acao_sugerida"),
  dataGeracao: timestamp("data_geracao").defaultNow(),
  dataExpiracao: timestamp("data_expiracao"), // Insights podem expirar
  relevancia: varchar("relevancia", { enum: ['baixa', 'media', 'alta'] }).default('media').notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insightsRelations = relations(insights, ({ one }) => ({
  user: one(users, {
    fields: [insights.userId],
    references: [users.id],
  }),
}));

export const insertInsightSchema = createInsertSchema(insights).omit({
  id: true,
  createdAt: true,
  dataGeracao: true,
});

export type InsertInsight = z.infer<typeof insertInsightSchema>;
export type Insight = typeof insights.$inferSelect;

// Notification preferences table
export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  alertasOrcamento: varchar("alertas_orcamento", { enum: ['ativo', 'inativo'] }).default('ativo').notNull(),
  vencimentoCartoes: varchar("vencimento_cartoes", { enum: ['ativo', 'inativo'] }).default('ativo').notNull(),
  insightsSemanais: varchar("insights_semanais", { enum: ['ativo', 'inativo'] }).default('inativo').notNull(),
  metasAtingidas: varchar("metas_atingidas", { enum: ['ativo', 'inativo'] }).default('ativo').notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateNotificationPreferencesSchema = insertNotificationPreferencesSchema.partial().omit({
  userId: true,
});

export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;
export type UpdateNotificationPreferences = z.infer<typeof updateNotificationPreferencesSchema>;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;

// Subscriptions table (assinaturas)
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar("provider", { enum: ['caktos', 'manual'] }).notNull(),
  providerSubscriptionId: varchar("provider_subscription_id").notNull(),
  planName: varchar("plan_name").notNull(),
  priceCents: integer("price_cents").notNull(),
  currency: varchar("currency").default('BRL').notNull(),
  billingInterval: varchar("billing_interval", { enum: ['month', 'year'] }).notNull(),
  interval: varchar("interval", { enum: ['monthly', 'yearly'] }).default('monthly').notNull(),
  status: varchar("status", { enum: ['trial', 'active', 'paused', 'canceled', 'overdue'] }).notNull(),
  trialEndsAt: timestamp("trial_ends_at"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAt: timestamp("cancel_at"),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

// Subscription events table (eventos de assinatura)
export const subscriptionEvents = pgTable("subscription_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriptionId: varchar("subscription_id").references(() => subscriptions.id, { onDelete: 'set null' }),
  clientId: varchar("client_id").references(() => users.id, { onDelete: 'set null' }),
  type: varchar("type").notNull(),
  provider: varchar("provider").notNull(),
  severity: varchar("severity", { enum: ['info', 'warning', 'error'] }).default('info').notNull(),
  message: text("message").notNull(),
  payload: jsonb("payload").notNull(),
  origin: varchar("origin", { enum: ['webhook', 'system'] }).default('webhook').notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_subscription_events_subscription_id").on(table.subscriptionId),
  index("IDX_subscription_events_client_id").on(table.clientId),
  index("IDX_subscription_events_type").on(table.type),
  index("IDX_subscription_events_created_at").on(table.createdAt),
]);

export const subscriptionEventsRelations = relations(subscriptionEvents, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [subscriptionEvents.subscriptionId],
    references: [subscriptions.id],
  }),
  client: one(users, {
    fields: [subscriptionEvents.clientId],
    references: [users.id],
  }),
}));

export const insertSubscriptionEventSchema = createInsertSchema(subscriptionEvents).omit({
  id: true,
  createdAt: true,
}).extend({
  payload: z.any(), // Allow any JSON structure
});

export type InsertSubscriptionEvent = z.infer<typeof insertSubscriptionEventSchema>;
export type SubscriptionEvent = typeof subscriptionEvents.$inferSelect;

// System logs table (logs de sistema para monitoramento)
export const systemLogs = pgTable("system_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  level: varchar("level", { enum: ['info', 'warning', 'error'] }).notNull(),
  source: varchar("source", { enum: ['whatsapp', 'ai', 'webhook', 'system', 'other'] }).notNull(),
  message: text("message").notNull(),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSystemLogSchema = createInsertSchema(systemLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertSystemLog = z.infer<typeof insertSystemLogSchema>;
export type SystemLog = typeof systemLogs.$inferSelect;

// Admin event logs table (auditoria de ações admin)
export const adminEventLogs = pgTable("admin_event_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  type: varchar("type").notNull(), // 'create_user', 'update_user', 'suspend_user', 'reactivate_user', 'delete_user', 'reset_password', etc.
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAdminEventLogSchema = createInsertSchema(adminEventLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertAdminEventLog = z.infer<typeof insertAdminEventLogSchema>;
export type AdminEventLog = typeof adminEventLogs.$inferSelect;

// Webhook events table (eventos de webhook recebidos)
export const webhookEvents = pgTable("webhook_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  event: text("event").notNull(), // Nome do evento (ex: subscription_created)
  type: text("type").notNull(), // Mantido para compatibilidade
  payload: jsonb("payload").notNull(),
  status: varchar("status", { enum: ['pending', 'processed', 'failed'] }).default('pending').notNull(),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0).notNull(),
  lastRetryAt: timestamp("last_retry_at"),
  processed: boolean("processed").default(false).notNull(), // Mantido para compatibilidade
});

export const insertWebhookEventSchema = createInsertSchema(webhookEvents).omit({
  id: true,
  receivedAt: true,
});

export type InsertWebhookEvent = z.infer<typeof insertWebhookEventSchema>;
export type WebhookEvent = typeof webhookEvents.$inferSelect;

// Webhook processed events table (idempotência - evita processar o mesmo evento duas vezes)
export const webhookProcessedEvents = pgTable("webhook_processed_events", {
  eventId: varchar("event_id").primaryKey(), // ID do evento externo (ex: subscription.id ou order.id)
  eventType: varchar("event_type").notNull(), // Tipo do evento (ex: subscription_created)
  webhookEventId: varchar("webhook_event_id").notNull().references(() => webhookEvents.id, { onDelete: 'cascade' }),
  processedAt: timestamp("processed_at").defaultNow().notNull(),
});

export const insertWebhookProcessedEventSchema = createInsertSchema(webhookProcessedEvents).omit({
  processedAt: true,
});

export type InsertWebhookProcessedEvent = z.infer<typeof insertWebhookProcessedEventSchema>;
export type WebhookProcessedEvent = typeof webhookProcessedEvents.$inferSelect;

// Webhook logs table (logs detalhados de processamento)
export const webhookLogs = pgTable("webhook_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  webhookEventId: varchar("webhook_event_id").notNull().references(() => webhookEvents.id, { onDelete: 'cascade' }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  step: text("step").notNull(),
  payload: jsonb("payload"),
  error: text("error"),
  level: varchar("level", { enum: ['info', 'warning', 'error'] }).default('info').notNull(),
});

export type WebhookLog = typeof webhookLogs.$inferSelect;
export type InsertWebhookLog = typeof webhookLogs.$inferInsert;

// Webhook event headers table (headers originais do webhook)
export const webhookEventHeaders = pgTable("webhook_event_headers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  webhookEventId: varchar("webhook_event_id").notNull().references(() => webhookEvents.id, { onDelete: 'cascade' }),
  headers: jsonb("headers").notNull(),
  savedAt: timestamp("saved_at").defaultNow().notNull(),
});

export type WebhookEventHeader = typeof webhookEventHeaders.$inferSelect;
export type InsertWebhookEventHeader = typeof webhookEventHeaders.$inferInsert;

// Orders table (pedidos/cobranças)
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey(), // ID externo da Cakto (order.id)
  subscriptionId: varchar("subscription_id").notNull().references(() => subscriptions.id, { onDelete: 'cascade' }),
  amount: integer("amount").notNull(), // Valor em centavos
  status: varchar("status", { enum: ['paid', 'failed', 'refunded', 'chargeback'] }).notNull(),
  paidAt: timestamp("paid_at"),
  dueDate: timestamp("due_date"),
  paymentMethod: varchar("payment_method"),
  installments: integer("installments"),
  cardBrand: varchar("card_brand"),
  cardLastDigits: varchar("card_last_digits"),
  boletoBarcode: text("boleto_barcode"),
  pixQrCode: text("pix_qr_code"),
  picpayQrCode: text("picpay_qr_code"),
  meta: jsonb("meta"), // Armazenar dados adicionais do payload
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ordersRelations = relations(orders, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [orders.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const insertOrderSchema = createInsertSchema(orders).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// WhatsApp latency table (monitoramento de latência de mensagens)
export const whatsappLatency = pgTable("whatsapp_latency", {
  id: varchar("id", { length: 191 }).primaryKey().notNull(),
  userId: varchar("user_id", { length: 191 }).references(() => users.id, { onDelete: 'set null' }),
  waMessageId: varchar("wa_message_id", { length: 191 }), // ID da mensagem recebida
  responseMessageId: varchar("response_message_id", { length: 191 }), // ID da mensagem de resposta enviada
  fromNumber: varchar("from_number", { length: 191 }), // Número do remetente
  messageType: varchar("message_type", { length: 50 }), // text, audio, image, video
  
  // Timestamps da mensagem recebida
  receivedAt: timestamp("received_at"), // Quando a mensagem chega no endpoint
  providerReceivedAt: timestamp("provider_received_at"), // Se o provedor (Meta) mandar no payload
  
  // Timestamps do processamento
  processedAt: timestamp("processed_at"), // Quando o servidor termina o processamento
  
  // Timestamps da resposta enviada
  responseQueuedAt: timestamp("response_queued_at"), // Quando sendWhatsAppReply() é chamado
  providerSentAt: timestamp("provider_sent_at"), // Quando a API do WhatsApp retorna "sent"
  providerDeliveredAt: timestamp("provider_delivered_at"), // Quando recebe webhook de entrega
  repliedToClientAt: timestamp("replied_to_client_at"), // Quando WhatsApp confirma "delivered to user"
  
  // Latências calculadas (em milissegundos)
  botLatencyMs: integer("bot_latency_ms"), // processedAt - receivedAt
  networkLatencyMs: integer("network_latency_ms"), // providerDeliveredAt - responseQueuedAt
  totalLatencyMs: integer("total_latency_ms"), // repliedToClientAt - receivedAt
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWhatsAppLatencySchema = createInsertSchema(whatsappLatency).omit({
  id: true,
  createdAt: true,
});

export type InsertWhatsAppLatency = z.infer<typeof insertWhatsAppLatencySchema>;
export type WhatsAppLatency = typeof whatsappLatency.$inferSelect;

// Client logs table (logs completos por cliente - estilo "espião")
export const clientLogs = pgTable("client_logs", {
  id: varchar("id", { length: 191 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 191 }).references(() => users.id, { onDelete: 'cascade' }),
  eventType: varchar("event_type", { length: 200 }).notNull(),
  message: text("message"),
  data: jsonb("data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClientLogSchema = createInsertSchema(clientLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertClientLog = z.infer<typeof insertClientLogSchema>;
export type ClientLog = typeof clientLogs.$inferSelect;

// Latency alerts table (alertas de latência alta)
export const latencyAlerts = pgTable("latency_alerts", {
  id: varchar("id", { length: 191 }).primaryKey().default(sql`gen_random_uuid()`),
  severity: varchar("severity", { enum: ['warning', 'critical'] }).notNull(),
  message: text("message").notNull(),
  totalLatencyMs: integer("total_latency_ms").notNull(),
  resolved: boolean("resolved").default(false).notNull(),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLatencyAlertSchema = createInsertSchema(latencyAlerts).omit({
  id: true,
  createdAt: true,
});

export type InsertLatencyAlert = z.infer<typeof insertLatencyAlertSchema>;
export type LatencyAlert = typeof latencyAlerts.$inferSelect;
