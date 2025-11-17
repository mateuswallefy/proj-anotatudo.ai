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
  subscriptionId: varchar("subscription_id").notNull().references(() => subscriptions.id, { onDelete: 'cascade' }),
  type: varchar("type").notNull(),
  rawPayload: jsonb("raw_payload").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subscriptionEventsRelations = relations(subscriptionEvents, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [subscriptionEvents.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const insertSubscriptionEventSchema = createInsertSchema(subscriptionEvents).omit({
  id: true,
  createdAt: true,
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
