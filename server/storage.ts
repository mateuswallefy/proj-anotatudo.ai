import {
  users,
  transacoes,
  cartoes,
  faturas,
  cartaoTransacoes,
  goals,
  spendingLimits,
  accountMembers,
  purchases,
  categoriasCustomizadas,
  contas,
  investimentos,
  alertas,
  insights,
  notificationPreferences,
  subscriptions,
  subscriptionEvents,
  systemLogs,
  adminEventLogs,
  whatsappSessions,
  webhookEvents,
  webhookProcessedEvents,
  orders,
  type User,
  type WebhookProcessedEvent,
  type InsertWebhookProcessedEvent,
  type Order,
  type InsertOrder,
  type UpsertUser,
  type Transacao,
  type InsertTransacao,
  type Cartao,
  type InsertCartao,
  type Fatura,
  type InsertFatura,
  type CartaoTransacao,
  type InsertCartaoTransacao,
  type Goal,
  type InsertGoal,
  type SpendingLimit,
  type InsertSpendingLimit,
  type AccountMember,
  type InsertAccountMember,
  type Purchase,
  type InsertPurchase,
  type CategoriaCustomizada,
  type InsertCategoriaCustomizada,
  type Conta,
  type InsertConta,
  type Investimento,
  type InsertInvestimento,
  type Alerta,
  type InsertAlerta,
  type Insight,
  type InsertInsight,
  type NotificationPreferences,
  type UpdateNotificationPreferences,
  type Subscription,
  type InsertSubscription,
  type SubscriptionEvent,
  type InsertSubscriptionEvent,
  type SystemLog,
  type InsertSystemLog,
  type AdminEventLog,
  type InsertAdminEventLog,
  type WhatsAppSession,
  type InsertWhatsAppSession,
  type WebhookEvent,
  type InsertWebhookEvent,
} from "@shared/schema";
import { db } from "./db.js";
import { eq, and, desc, or, sql as sqlOp, like, ilike, inArray, ne } from "drizzle-orm";
import { format } from "date-fns";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserPassword(id: string, passwordHash: string): Promise<void>;
  updateUserProfileImage(id: string, imageUrl: string): Promise<void>;

  // Transaction operations
  getTransacoes(userId: string, period?: string): Promise<Transacao[]>;
  createTransacao(transacao: InsertTransacao): Promise<Transacao>;
  getTransacaoById(id: string): Promise<Transacao | undefined>;
  updateTransacao(id: string, userId: string, transacao: Partial<InsertTransacao>): Promise<Transacao | undefined>;
  deleteTransacao(id: string, userId: string): Promise<void>;

  // Card operations
  getCartoes(userId: string): Promise<Cartao[]>;
  createCartao(cartao: InsertCartao): Promise<Cartao>;
  getCartaoById(id: string): Promise<Cartao | undefined>;
  updateCartaoLimiteUsado(id: string, novoLimite: string): Promise<void>;

  // Invoice operations
  getFaturas(cartaoId: string): Promise<Fatura[]>;
  createFatura(fatura: InsertFatura): Promise<Fatura>;
  getFaturaById(id: string): Promise<Fatura | undefined>;
  getOrCreateFaturaAberta(cartaoId: string, mes: number, ano: number): Promise<Fatura>;
  updateFaturaValor(faturaId: string, novoValor: string): Promise<void>;

  // Card transaction operations
  getCartaoTransacoes(faturaId: string): Promise<CartaoTransacao[]>;
  createCartaoTransacao(transacao: InsertCartaoTransacao): Promise<CartaoTransacao>;

  // Goals operations
  getGoals(userId: string): Promise<Goal[]>;
  getGoalById(id: string): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: string, userId: string, goal: Partial<InsertGoal>): Promise<Goal | undefined>;
  updateGoalValorAtual(id: string, userId: string, valorAtual: string): Promise<void>;
  updateGoalStatus(id: string, userId: string, status: 'ativa' | 'concluida' | 'cancelada'): Promise<void>;

  // Spending limits operations
  getSpendingLimits(userId: string): Promise<SpendingLimit[]>;
  createSpendingLimit(limit: InsertSpendingLimit): Promise<SpendingLimit>;
  updateSpendingLimit(id: string, valorLimite: string): Promise<void>;

  // Account members operations
  getAccountMembers(userId: string): Promise<AccountMember[]>;
  createAccountMember(member: InsertAccountMember): Promise<AccountMember>;
  removeAccountMember(id: string): Promise<void>;

  // Purchases operations (Caktos)
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  getPurchaseByEmail(email: string): Promise<Purchase | undefined>;
  updatePurchasePhone(email: string, telefone: string): Promise<void>;

  // User operations for WhatsApp auth
  getUserByPhone(telefone: string): Promise<User | undefined>;
  createUserFromPhone(telefone: string): Promise<User>;
  updateUserEmail(id: string, email: string): Promise<void>;
  updateUserStatus(id: string, status: 'awaiting_email' | 'authenticated'): Promise<void>;
  updateUserTelefone(id: string, telefone: string): Promise<void>;
  transferTransactions(fromUserId: string, toUserId: string): Promise<void>;

  // Custom categories operations
  getCategoriasCustomizadas(userId: string): Promise<CategoriaCustomizada[]>;
  createCategoriaCustomizada(categoria: InsertCategoriaCustomizada): Promise<CategoriaCustomizada>;
  deleteCategoriaCustomizada(id: string, userId: string): Promise<void>;

  // Contas operations
  getContas(userId: string): Promise<Conta[]>;
  createConta(conta: InsertConta): Promise<Conta>;
  updateContaSaldo(id: string, userId: string, saldoAtual: string): Promise<void>;
  deleteConta(id: string, userId: string): Promise<void>;

  // Investimentos operations
  getInvestimentos(userId: string): Promise<Investimento[]>;
  createInvestimento(investimento: InsertInvestimento): Promise<Investimento>;
  updateInvestimento(id: string, userId: string, updates: Partial<InsertInvestimento>): Promise<void>;
  deleteInvestimento(id: string, userId: string): Promise<void>;

  // Alertas operations
  getAlertas(userId: string, incluirLidos?: boolean): Promise<Alerta[]>;
  createAlerta(alerta: InsertAlerta): Promise<Alerta>;
  marcarAlertaComoLido(id: string, userId: string): Promise<void>;
  deleteAlerta(id: string, userId: string): Promise<void>;

  // Insights operations
  getInsights(userId: string, limit?: number): Promise<Insight[]>;
  createInsight(insight: InsertInsight): Promise<Insight>;
  deleteInsight(id: string, userId: string): Promise<void>;

  // Notification preferences operations
  getNotificationPreferences(userId: string): Promise<NotificationPreferences | undefined>;
  upsertNotificationPreferences(userId: string, preferences: UpdateNotificationPreferences): Promise<NotificationPreferences>;

  // Admin operations
  listUsers(filters?: { search?: string; status?: string; accessStatus?: string; plan?: string; billingStatus?: string; page?: number; pageSize?: number }): Promise<{ items: User[]; total: number }>;
  updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined>;

  // Subscription operations
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscriptionById(id: string): Promise<Subscription | undefined>;
  getSubscriptionByProviderId(provider: 'caktos' | 'manual', providerSubscriptionId: string): Promise<Subscription | undefined>;
  getSubscriptionsByUserId(userId: string): Promise<Subscription[]>;
  updateSubscription(id: string, updates: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  listSubscriptions(filters?: { q?: string; status?: string; provider?: string; interval?: string; period?: string }): Promise<Subscription[]>;

  // Subscription events operations
  logSubscriptionEvent(event: {
    subscriptionId: string;
    clientId: string;
    type: string;
    provider: string;
    severity: 'info' | 'warning' | 'error';
    message: string;
    payload: any;
    origin: 'webhook' | 'system';
  }): Promise<SubscriptionEvent>;
  getSubscriptionEvents(filters?: {
    type?: string;
    severity?: string;
    provider?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ events: SubscriptionEvent[]; total: number }>;
  getSubscriptionEventsForClient(clientId: string): Promise<SubscriptionEvent[]>;
  getSubscriptionEventsForSubscription(subscriptionId: string): Promise<SubscriptionEvent[]>;
  // Legacy methods (keep for backward compatibility)
  createSubscriptionEvent(event: InsertSubscriptionEvent): Promise<SubscriptionEvent>;
  getSubscriptionEventsBySubscriptionId(subscriptionId: string, limit?: number): Promise<SubscriptionEvent[]>;
  getSubscriptionEventsByUserId(userId: string, limit?: number): Promise<SubscriptionEvent[]>;
  listRecentSubscriptionEvents(limit?: number): Promise<SubscriptionEvent[]>;

  // System logs operations
  createSystemLog(log: InsertSystemLog): Promise<SystemLog>;
  getSystemLogs(options?: {
    limit?: number;
    level?: 'info' | 'warning' | 'error';
    source?: 'whatsapp' | 'ai' | 'webhook' | 'system' | 'other';
  }): Promise<SystemLog[]>;

  // Subscription status operations
  getUserSubscriptionStatus(userId: string): Promise<'active' | 'suspended' | 'paused' | 'expired' | 'canceled' | 'none'>;

  // WhatsApp sessions operations
  getWhatsAppSession(phoneNumber: string): Promise<WhatsAppSession | undefined>;
  createWhatsAppSession(session: InsertWhatsAppSession): Promise<WhatsAppSession>;
  updateWhatsAppSession(phoneNumber: string, data: Partial<WhatsAppSession>): Promise<WhatsAppSession>;
  incrementFailedAttempts(phoneNumber: string): Promise<void>;
  cleanupOldWhatsAppSessions(daysOld: number): Promise<number>;

  // Admin event logs operations
  createAdminEventLog(log: InsertAdminEventLog): Promise<AdminEventLog>;

  // Webhook events operations
  createWebhookEvent(event: InsertWebhookEvent): Promise<WebhookEvent>;
  getWebhookEvents(limit?: number): Promise<WebhookEvent[]>;
  getWebhookEventById(id: string): Promise<WebhookEvent | undefined>;
  updateWebhookStatus(id: string, updates: { status: 'pending' | 'processed' | 'failed'; processedAt?: Date; errorMessage?: string; retryCount?: number; lastRetryAt?: Date }): Promise<WebhookEvent | undefined>;
  reprocessWebhookEvent(id: string): Promise<WebhookEvent | undefined>;
  getFailedWebhooks(maxRetries?: number): Promise<WebhookEvent[]>;
  getWebhookGroups(limit?: number): Promise<Array<{
    eventId: string;
    eventType: string;
    attempts: WebhookEvent[];
    lastAttempt: WebhookEvent;
    firstAttempt: WebhookEvent;
    successCount: number;
    failureCount: number;
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    customerId: string | null;
    subscriptionId: string | null;
  }>>;
  
  // Webhook processed events (idempotência)
  checkEventProcessed(eventId: string): Promise<WebhookProcessedEvent | undefined>;
  markEventProcessed(event: InsertWebhookProcessedEvent): Promise<WebhookProcessedEvent>;

  // Orders operations
  createOrder(order: InsertOrder): Promise<Order>;
  getOrderById(id: string): Promise<Order | undefined>;
  getOrdersBySubscriptionId(subscriptionId: string): Promise<Order[]>;

  // WhatsApp latency operations
  createWhatsAppLatency(latency: InsertWhatsAppLatency): Promise<WhatsAppLatency>;
  getWhatsAppLatencies(filters?: { userId?: string; limit?: number; startDate?: Date; endDate?: Date }): Promise<WhatsAppLatency[]>;
  getWhatsAppLatencyStats(startDate?: Date, endDate?: Date): Promise<{
    avgTotalLatency: number;
    avgBotLatency: number;
    avgNetworkLatency: number;
    maxTotalLatency: number;
    totalMessages: number;
    errorRate: number;
  }>;

  // Client logs operations
  logClientEvent(userId: string | null, eventType: string, message: string, data?: any): Promise<ClientLog>;
  getClientLogs(filters?: { userId?: string; eventType?: string; startDate?: Date; endDate?: Date; limit?: number }): Promise<ClientLog[]>;

  // Latency alerts operations
  createLatencyAlert(alert: InsertLatencyAlert): Promise<LatencyAlert>;
  getActiveLatencyAlerts(): Promise<LatencyAlert[]>;
  resolveLatencyAlert(id: string): Promise<LatencyAlert | undefined>;

  // Get all events (unified from admin_event_logs, subscription_events, system_logs)
  getAllEvents(q?: string, type?: string, severity?: string): Promise<Array<{
    id: string;
    type: string;
    message: string;
    source: string;
    createdAt: Date | string;
    metadata: any;
  }>>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Transaction operations
  async getTransacoes(userId: string, period?: string): Promise<Transacao[]> {
    let whereClause = eq(transacoes.userId, userId);
    
    if (period && /^\d{4}-\d{2}$/.test(period)) {
      const [year, month] = period.split('-').map(Number);
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0);
      const startDate = format(startOfMonth, 'yyyy-MM-dd');
      const endDate = format(endOfMonth, 'yyyy-MM-dd');
      
      whereClause = and(
        eq(transacoes.userId, userId),
        sqlOp`DATE(${transacoes.dataReal}) >= ${startDate}`,
        sqlOp`DATE(${transacoes.dataReal}) <= ${endDate}`
      ) as any;
    }
    
    return await db
      .select()
      .from(transacoes)
      .where(whereClause)
      .orderBy(desc(transacoes.dataReal));
  }

  async createTransacao(transacao: InsertTransacao): Promise<Transacao> {
    const [newTransacao] = await db
      .insert(transacoes)
      .values(transacao)
      .returning();
    
    // Se é economia com meta vinculada, atualizar valorAtual da meta
    if (newTransacao.tipo === 'economia' && newTransacao.goalId) {
      const goal = await this.getGoalById(newTransacao.goalId);
      if (goal) {
        const novoValorAtual = parseFloat(goal.valorAtual) + parseFloat(newTransacao.valor);
        const valorAlvo = parseFloat(goal.valorAlvo);
        
        // Atualizar valorAtual da meta
        await this.updateGoalValorAtual(goal.id, goal.userId, novoValorAtual.toFixed(2));
        
        // Se atingiu ou ultrapassou a meta, marcar como concluída
        if (novoValorAtual >= valorAlvo && goal.status === 'ativa') {
          await this.updateGoalStatus(goal.id, goal.userId, 'concluida');
        }
      }
    }
    
    return newTransacao;
  }

  async getTransacaoById(id: string): Promise<Transacao | undefined> {
    const [transacao] = await db
      .select()
      .from(transacoes)
      .where(eq(transacoes.id, id));
    return transacao;
  }

  async updateTransacao(id: string, userId: string, transacao: Partial<InsertTransacao>): Promise<Transacao | undefined> {
    const [updatedTransacao] = await db
      .update(transacoes)
      .set(transacao)
      .where(and(eq(transacoes.id, id), eq(transacoes.userId, userId)))
      .returning();
    return updatedTransacao;
  }

  async deleteTransacao(id: string, userId: string): Promise<void> {
    await db
      .delete(transacoes)
      .where(and(eq(transacoes.id, id), eq(transacoes.userId, userId)));
  }

  // Card operations
  async getCartoes(userId: string): Promise<Cartao[]> {
    return await db
      .select()
      .from(cartoes)
      .where(eq(cartoes.userId, userId))
      .orderBy(desc(cartoes.createdAt));
  }

  async createCartao(cartao: InsertCartao): Promise<Cartao> {
    const [newCartao] = await db
      .insert(cartoes)
      .values(cartao)
      .returning();
    return newCartao;
  }

  async getCartaoById(id: string): Promise<Cartao | undefined> {
    const [cartao] = await db
      .select()
      .from(cartoes)
      .where(eq(cartoes.id, id));
    return cartao;
  }

  async updateCartaoLimiteUsado(id: string, novoLimite: string): Promise<void> {
    await db
      .update(cartoes)
      .set({ limiteUsado: novoLimite })
      .where(eq(cartoes.id, id));
  }

  // Invoice operations
  async getFaturas(cartaoId: string): Promise<Fatura[]> {
    return await db
      .select()
      .from(faturas)
      .where(eq(faturas.cartaoId, cartaoId))
      .orderBy(desc(faturas.ano), desc(faturas.mes));
  }

  async createFatura(fatura: InsertFatura): Promise<Fatura> {
    const [newFatura] = await db
      .insert(faturas)
      .values(fatura)
      .returning();
    return newFatura;
  }

  async getFaturaById(id: string): Promise<Fatura | undefined> {
    const [fatura] = await db
      .select()
      .from(faturas)
      .where(eq(faturas.id, id));
    return fatura;
  }

  async getOrCreateFaturaAberta(cartaoId: string, mes: number, ano: number): Promise<Fatura> {
    // Buscar fatura aberta existente para o mês/ano
    const [faturaExistente] = await db
      .select()
      .from(faturas)
      .where(
        and(
          eq(faturas.cartaoId, cartaoId),
          eq(faturas.mes, mes),
          eq(faturas.ano, ano),
          eq(faturas.status, 'aberta')
        )
      );
    
    if (faturaExistente) {
      return faturaExistente;
    }
    
    // Criar nova fatura aberta se não existir
    return await this.createFatura({
      cartaoId,
      mes,
      ano,
      valorFechado: '0',
      status: 'aberta',
    });
  }

  async updateFaturaValor(faturaId: string, novoValor: string): Promise<void> {
    await db
      .update(faturas)
      .set({ valorFechado: novoValor })
      .where(eq(faturas.id, faturaId));
  }

  // Card transaction operations
  async getCartaoTransacoes(faturaId: string): Promise<CartaoTransacao[]> {
    return await db
      .select()
      .from(cartaoTransacoes)
      .where(eq(cartaoTransacoes.faturaId, faturaId))
      .orderBy(desc(cartaoTransacoes.dataCompra));
  }

  async createCartaoTransacao(transacao: InsertCartaoTransacao): Promise<CartaoTransacao> {
    const [newTransacao] = await db
      .insert(cartaoTransacoes)
      .values(transacao)
      .returning();
    return newTransacao;
  }

  // User update operations
  async updateUserPassword(id: string, passwordHash: string): Promise<void> {
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async updateUserProfileImage(id: string, imageUrl: string): Promise<void> {
    await db
      .update(users)
      .set({ profileImageUrl: imageUrl, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  // Goals operations
  async getGoals(userId: string): Promise<Goal[]> {
    return await db
      .select()
      .from(goals)
      .where(eq(goals.userId, userId))
      .orderBy(desc(goals.createdAt));
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [newGoal] = await db
      .insert(goals)
      .values(goal)
      .returning();
    return newGoal;
  }

  async getGoalById(id: string): Promise<Goal | undefined> {
    const [goal] = await db
      .select()
      .from(goals)
      .where(eq(goals.id, id));
    return goal;
  }

  async updateGoal(id: string, userId: string, goal: Partial<InsertGoal>): Promise<Goal | undefined> {
    const [updatedGoal] = await db
      .update(goals)
      .set(goal)
      .where(and(eq(goals.id, id), eq(goals.userId, userId)))
      .returning();
    return updatedGoal;
  }

  async updateGoalValorAtual(id: string, userId: string, valorAtual: string): Promise<void> {
    await db
      .update(goals)
      .set({ valorAtual })
      .where(and(eq(goals.id, id), eq(goals.userId, userId)));
  }

  async updateGoalStatus(id: string, userId: string, status: 'ativa' | 'concluida' | 'cancelada'): Promise<void> {
    await db
      .update(goals)
      .set({ status })
      .where(and(eq(goals.id, id), eq(goals.userId, userId)));
  }

  // Spending limits operations
  async getSpendingLimits(userId: string): Promise<SpendingLimit[]> {
    return await db
      .select()
      .from(spendingLimits)
      .where(eq(spendingLimits.userId, userId))
      .orderBy(desc(spendingLimits.createdAt));
  }

  async createSpendingLimit(limit: InsertSpendingLimit): Promise<SpendingLimit> {
    const [newLimit] = await db
      .insert(spendingLimits)
      .values(limit)
      .returning();
    return newLimit;
  }

  async updateSpendingLimit(id: string, valorLimite: string): Promise<void> {
    await db
      .update(spendingLimits)
      .set({ valorLimite })
      .where(eq(spendingLimits.id, id));
  }

  // Account members operations
  async getAccountMembers(userId: string): Promise<AccountMember[]> {
    return await db
      .select()
      .from(accountMembers)
      .where(
        or(
          eq(accountMembers.accountOwnerId, userId),
          eq(accountMembers.memberId, userId)
        )
      )
      .orderBy(desc(accountMembers.createdAt));
  }

  async createAccountMember(member: InsertAccountMember): Promise<AccountMember> {
    const [newMember] = await db
      .insert(accountMembers)
      .values(member)
      .returning();
    return newMember;
  }

  async removeAccountMember(id: string): Promise<void> {
    await db
      .update(accountMembers)
      .set({ status: 'removido' })
      .where(eq(accountMembers.id, id));
  }

  // Purchases operations (Caktos)
  async createPurchase(purchaseData: InsertPurchase): Promise<Purchase> {
    // Real UPSERT using onConflictDoUpdate to handle status changes (approved → refunded)
    // UNIQUE constraint on purchase_id ensures only one row per purchase
    const [purchase] = await db
      .insert(purchases)
      .values(purchaseData)
      .onConflictDoUpdate({
        target: purchases.purchaseId,
        set: {
          email: purchaseData.email,
          telefone: purchaseData.telefone,
          status: purchaseData.status,
          productName: purchaseData.productName,
          amount: purchaseData.amount,
          updatedAt: new Date(),
        },
      })
      .returning();
    return purchase;
  }

  async getPurchaseByEmail(email: string): Promise<Purchase | undefined> {
    // Get the most recent approved purchase for this email
    // Order by created_at DESC to always get the latest approved purchase
    const [purchase] = await db
      .select()
      .from(purchases)
      .where(
        and(
          eq(purchases.email, email),
          eq(purchases.status, 'approved')
        )
      )
      .orderBy(desc(purchases.createdAt))
      .limit(1);
    return purchase;
  }

  async updatePurchasePhone(email: string, telefone: string): Promise<void> {
    await db
      .update(purchases)
      .set({ telefone })
      .where(eq(purchases.email, email));
  }

  // User operations for WhatsApp auth
  async getUserByPhone(telefone: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telefone, telefone));
    return user;
  }

  async createUserFromPhone(telefone: string): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        telefone,
        status: 'awaiting_email',
      })
      .returning();
    return user;
  }

  async updateUserEmail(id: string, email: string): Promise<void> {
    await db
      .update(users)
      .set({ email })
      .where(eq(users.id, id));
  }

  async updateUserStatus(id: string, status: 'awaiting_email' | 'authenticated'): Promise<void> {
    await db
      .update(users)
      .set({ status })
      .where(eq(users.id, id));
  }

  async updateUserTelefone(id: string, telefone: string): Promise<void> {
    await db
      .update(users)
      .set({ telefone })
      .where(eq(users.id, id));
  }

  async transferTransactions(fromUserId: string, toUserId: string): Promise<void> {
    await db
      .update(transacoes)
      .set({ userId: toUserId })
      .where(eq(transacoes.userId, fromUserId));
  }

  // Custom categories operations
  async getCategoriasCustomizadas(userId: string): Promise<CategoriaCustomizada[]> {
    return await db
      .select()
      .from(categoriasCustomizadas)
      .where(eq(categoriasCustomizadas.userId, userId))
      .orderBy(categoriasCustomizadas.createdAt);
  }

  async createCategoriaCustomizada(categoria: InsertCategoriaCustomizada): Promise<CategoriaCustomizada> {
    const [novaCategoria] = await db
      .insert(categoriasCustomizadas)
      .values(categoria)
      .returning();
    return novaCategoria;
  }

  async deleteCategoriaCustomizada(id: string, userId: string): Promise<void> {
    await db
      .delete(categoriasCustomizadas)
      .where(
        and(
          eq(categoriasCustomizadas.id, id),
          eq(categoriasCustomizadas.userId, userId)
        )
      );
  }

  // Contas operations
  async getContas(userId: string): Promise<Conta[]> {
    return await db
      .select()
      .from(contas)
      .where(eq(contas.userId, userId))
      .orderBy(desc(contas.saldoAtual));
  }

  async createConta(conta: InsertConta): Promise<Conta> {
    const [novaConta] = await db
      .insert(contas)
      .values(conta)
      .returning();
    return novaConta;
  }

  async updateContaSaldo(id: string, userId: string, saldoAtual: string): Promise<void> {
    await db
      .update(contas)
      .set({ saldoAtual })
      .where(
        and(
          eq(contas.id, id),
          eq(contas.userId, userId)
        )
      );
  }

  async deleteConta(id: string, userId: string): Promise<void> {
    await db
      .delete(contas)
      .where(
        and(
          eq(contas.id, id),
          eq(contas.userId, userId)
        )
      );
  }

  // Investimentos operations
  async getInvestimentos(userId: string): Promise<Investimento[]> {
    return await db
      .select()
      .from(investimentos)
      .where(eq(investimentos.userId, userId))
      .orderBy(desc(investimentos.valorAtual));
  }

  async createInvestimento(investimento: InsertInvestimento): Promise<Investimento> {
    const [novoInvestimento] = await db
      .insert(investimentos)
      .values(investimento)
      .returning();
    return novoInvestimento;
  }

  async updateInvestimento(id: string, userId: string, updates: Partial<InsertInvestimento>): Promise<void> {
    await db
      .update(investimentos)
      .set(updates)
      .where(
        and(
          eq(investimentos.id, id),
          eq(investimentos.userId, userId)
        )
      );
  }

  async deleteInvestimento(id: string, userId: string): Promise<void> {
    await db
      .delete(investimentos)
      .where(
        and(
          eq(investimentos.id, id),
          eq(investimentos.userId, userId)
        )
      );
  }

  // Alertas operations
  async getAlertas(userId: string, incluirLidos: boolean = false): Promise<Alerta[]> {
    const whereConditions = incluirLidos
      ? eq(alertas.userId, userId)
      : and(
          eq(alertas.userId, userId),
          eq(alertas.lido, 'nao')
        );

    return await db
      .select()
      .from(alertas)
      .where(whereConditions)
      .orderBy(desc(alertas.createdAt))
      .limit(10);
  }

  async createAlerta(alerta: InsertAlerta): Promise<Alerta> {
    const [novoAlerta] = await db
      .insert(alertas)
      .values(alerta)
      .returning();
    return novoAlerta;
  }

  async marcarAlertaComoLido(id: string, userId: string): Promise<void> {
    await db
      .update(alertas)
      .set({ lido: 'sim' })
      .where(
        and(
          eq(alertas.id, id),
          eq(alertas.userId, userId)
        )
      );
  }

  async deleteAlerta(id: string, userId: string): Promise<void> {
    await db
      .delete(alertas)
      .where(
        and(
          eq(alertas.id, id),
          eq(alertas.userId, userId)
        )
      );
  }

  // Insights operations
  async getInsights(userId: string, limit: number = 3): Promise<Insight[]> {
    return await db
      .select()
      .from(insights)
      .where(eq(insights.userId, userId))
      .orderBy(desc(insights.relevancia), desc(insights.createdAt))
      .limit(limit);
  }

  async createInsight(insight: InsertInsight): Promise<Insight> {
    const [novoInsight] = await db
      .insert(insights)
      .values(insight)
      .returning();
    return novoInsight;
  }

  async deleteInsight(id: string, userId: string): Promise<void> {
    await db
      .delete(insights)
      .where(
        and(
          eq(insights.id, id),
          eq(insights.userId, userId)
        )
      );
  }

  // Notification preferences operations
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));
    return preferences;
  }

  async upsertNotificationPreferences(userId: string, preferences: UpdateNotificationPreferences): Promise<NotificationPreferences> {
    const existing = await this.getNotificationPreferences(userId);

    if (existing) {
      const [updated] = await db
        .update(notificationPreferences)
        .set({
          ...preferences,
          updatedAt: new Date(),
        })
        .where(eq(notificationPreferences.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(notificationPreferences)
        .values({
          userId,
          ...preferences,
        })
        .returning();
      return created;
    }
  }

  // Admin operations
  async listUsers(filters?: { search?: string; status?: string; accessStatus?: string; plan?: string; billingStatus?: string; page?: number; pageSize?: number }): Promise<{ items: User[]; total: number }> {
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 50;
    const offset = (page - 1) * pageSize;

    let whereConditions: any[] = [];

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      whereConditions.push(
        or(
          ilike(users.email, searchTerm),
          ilike(users.firstName, searchTerm),
          ilike(users.lastName, searchTerm),
          ilike(users.telefone, searchTerm),
          ilike(users.planLabel, searchTerm),
          sqlOp`COALESCE(${users.whatsappNumber}::text, '') LIKE ${searchTerm}`
        )!
      );
    }

    // Legacy status filter (maps to billingStatus)
    if (filters?.status) {
      whereConditions.push(eq(users.billingStatus, filters.status as any));
    }

    // Access status filter (maps to users.status)
    if (filters?.accessStatus && filters.accessStatus !== 'all') {
      if (filters.accessStatus === 'suspended') {
        // Suspended users have billingStatus = 'paused' and status = 'authenticated'
        whereConditions.push(
          and(
            eq(users.status, 'authenticated' as any),
            eq(users.billingStatus, 'paused' as any)
          )!
        );
      } else if (filters.accessStatus === 'authenticated') {
        // Active users: status = 'authenticated' AND billingStatus != 'paused'
        whereConditions.push(
          and(
            eq(users.status, 'authenticated' as any),
            ne(users.billingStatus, 'paused' as any)
          )!
        );
      } else if (filters.accessStatus === 'awaiting_email') {
        whereConditions.push(eq(users.status, 'awaiting_email' as any));
      }
    }

    // Plan filter
    if (filters?.plan && filters.plan !== 'all') {
      whereConditions.push(eq(users.plano, filters.plan as any));
    }

    // Billing status filter
    if (filters?.billingStatus && filters.billingStatus !== 'all') {
      whereConditions.push(eq(users.billingStatus, filters.billingStatus as any));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const [items, totalResult] = await Promise.all([
      db
        .select()
        .from(users)
        .where(whereClause)
        .orderBy(desc(users.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sqlOp<number>`count(*)` })
        .from(users)
        .where(whereClause)
    ]);

    const total = Number(totalResult[0]?.count ?? 0);

    return { items, total };
  }

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  // Subscription operations
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [newSubscription] = await db
      .insert(subscriptions)
      .values(subscription)
      .returning();
    return newSubscription;
  }

  async getSubscriptionById(id: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id));
    return subscription;
  }

  async getSubscriptionByProviderId(provider: 'caktos' | 'manual', providerSubscriptionId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.provider, provider),
          eq(subscriptions.providerSubscriptionId, providerSubscriptionId)
        )
      );
    return subscription;
  }

  async getSubscriptionsByUserId(userId: string): Promise<Subscription[]> {
    return await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt));
  }

  async updateSubscription(id: string, updates: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const [updated] = await db
      .update(subscriptions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, id))
      .returning();
    return updated;
  }

  async listSubscriptions(filters?: { q?: string; status?: string; provider?: string; interval?: string; period?: string }): Promise<Subscription[]> {
    let whereConditions: any[] = [];

    if (filters?.q) {
      const searchTerm = `%${filters.q}%`;
      // Search in planName and status
      whereConditions.push(
        or(
          ilike(subscriptions.planName, searchTerm),
          ilike(subscriptions.status, searchTerm)
        )!
      );
    }

    if (filters?.status) {
      whereConditions.push(eq(subscriptions.status, filters.status as any));
    }

    if (filters?.provider) {
      whereConditions.push(eq(subscriptions.provider, filters.provider as any));
    }

    if (filters?.interval) {
      whereConditions.push(eq(subscriptions.interval, filters.interval as any));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    let results = await db
      .select()
      .from(subscriptions)
      .where(whereClause)
      .orderBy(desc(subscriptions.createdAt));

    // Filter by period (applied after query since it's date-based)
    if (filters?.period) {
      const now = new Date();
      const cutoffDate = new Date();
      
      if (filters.period === '7days') {
        cutoffDate.setDate(now.getDate() - 7);
      } else if (filters.period === '30days') {
        cutoffDate.setDate(now.getDate() - 30);
      }
      
      if (filters.period !== 'all') {
        results = results.filter(sub => {
          const createdAt = new Date(sub.createdAt);
          return createdAt >= cutoffDate;
        });
      }
    }

    return results;
  }

  // Subscription events operations
  async createSubscriptionEvent(event: InsertSubscriptionEvent): Promise<SubscriptionEvent> {
    const [newEvent] = await db
      .insert(subscriptionEvents)
      .values(event)
      .returning();
    return newEvent;
  }

  async getSubscriptionEventsBySubscriptionId(subscriptionId: string, limit: number = 50): Promise<SubscriptionEvent[]> {
    return await db
      .select()
      .from(subscriptionEvents)
      .where(eq(subscriptionEvents.subscriptionId, subscriptionId))
      .orderBy(desc(subscriptionEvents.createdAt))
      .limit(limit);
  }

  async getSubscriptionEventsByUserId(userId: string, limit: number = 50): Promise<SubscriptionEvent[]> {
    // First get all subscriptions for the user
    const userSubscriptions = await this.getSubscriptionsByUserId(userId);
    const subscriptionIds = userSubscriptions.map(s => s.id);

    if (subscriptionIds.length === 0) {
      return [];
    }

    return await db
      .select()
      .from(subscriptionEvents)
      .where(inArray(subscriptionEvents.subscriptionId, subscriptionIds))
      .orderBy(desc(subscriptionEvents.createdAt))
      .limit(limit);
  }

  // New methods for subscription events
  async logSubscriptionEvent(event: {
    subscriptionId: string;
    clientId: string;
    type: string;
    provider: string;
    severity: 'info' | 'warning' | 'error';
    message: string;
    payload: any;
    origin: 'webhook' | 'system';
  }): Promise<SubscriptionEvent> {
    const [newEvent] = await db
      .insert(subscriptionEvents)
      .values({
        subscriptionId: event.subscriptionId,
        clientId: event.clientId,
        type: event.type,
        provider: event.provider,
        severity: event.severity,
        message: event.message,
        payload: event.payload,
        origin: event.origin,
      })
      .returning();
    return newEvent;
  }

  async getSubscriptionEvents(filters?: {
    type?: string;
    severity?: string;
    provider?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ events: SubscriptionEvent[]; total: number }> {
    const limit = filters?.limit || 100;
    const offset = filters?.offset || 0;

    const whereConditions: any[] = [];

    if (filters?.type) {
      whereConditions.push(eq(subscriptionEvents.type, filters.type));
    }

    if (filters?.severity) {
      whereConditions.push(eq(subscriptionEvents.severity, filters.severity as any));
    }

    if (filters?.provider) {
      whereConditions.push(eq(subscriptionEvents.provider, filters.provider));
    }

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      whereConditions.push(
        or(
          ilike(subscriptionEvents.type, searchTerm),
          ilike(subscriptionEvents.message, searchTerm),
          ilike(subscriptionEvents.subscriptionId, searchTerm),
          ilike(subscriptionEvents.clientId, searchTerm),
          sqlOp`CAST(${subscriptionEvents.payload} AS TEXT) ILIKE ${searchTerm}`
        )!
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ count: sqlOp<number>`count(*)` })
      .from(subscriptionEvents)
      .where(whereClause);
    const total = Number(countResult[0]?.count || 0);

    // Get events
    const events = await db
      .select()
      .from(subscriptionEvents)
      .where(whereClause)
      .orderBy(desc(subscriptionEvents.createdAt))
      .limit(limit)
      .offset(offset);

    return { events, total };
  }

  async getSubscriptionEventsForClient(clientId: string): Promise<SubscriptionEvent[]> {
    return await db
      .select()
      .from(subscriptionEvents)
      .where(eq(subscriptionEvents.clientId, clientId))
      .orderBy(desc(subscriptionEvents.createdAt));
  }

  async getSubscriptionEventsForSubscription(subscriptionId: string): Promise<SubscriptionEvent[]> {
    return await db
      .select()
      .from(subscriptionEvents)
      .where(eq(subscriptionEvents.subscriptionId, subscriptionId))
      .orderBy(desc(subscriptionEvents.createdAt));
  }

  async listRecentSubscriptionEvents(limit: number = 50): Promise<SubscriptionEvent[]> {
    return await db
      .select()
      .from(subscriptionEvents)
      .orderBy(desc(subscriptionEvents.createdAt))
      .limit(limit);
  }

  // System logs operations
  async createSystemLog(log: InsertSystemLog): Promise<SystemLog> {
    const [newLog] = await db.insert(systemLogs).values(log).returning();
    return newLog;
  }

  async getSystemLogs(options?: {
    limit?: number;
    level?: 'info' | 'warning' | 'error';
    source?: 'whatsapp' | 'ai' | 'webhook' | 'system' | 'other';
  }): Promise<SystemLog[]> {
    let conditions: any[] = [];

    if (options?.level) {
      conditions.push(eq(systemLogs.level, options.level));
    }
    if (options?.source) {
      conditions.push(eq(systemLogs.source, options.source));
    }

    let query = db.select().from(systemLogs);

    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions)) as any;
    }

    query = query.orderBy(desc(systemLogs.createdAt));
    
    const limit = options?.limit || 50;
    query = query.limit(limit) as any;

    return await query;
  }

  // Subscription status operations
  async getUserSubscriptionStatus(userId: string): Promise<'active' | 'suspended' | 'paused' | 'expired' | 'canceled' | 'none'> {
    const userSubscriptions = await this.getSubscriptionsByUserId(userId);
    
    if (userSubscriptions.length === 0) {
      return 'none';
    }

    // Sort by createdAt desc to get the most recent subscription first
    const sortedSubscriptions = [...userSubscriptions].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    // Check for active or trial subscriptions first
    const activeSubscription = sortedSubscriptions.find(sub => 
      sub.status === 'active' || sub.status === 'trial'
    );

    if (activeSubscription) {
      // Check if expired
      if (activeSubscription.currentPeriodEnd) {
        const expiresAt = new Date(activeSubscription.currentPeriodEnd);
        if (expiresAt < new Date()) {
          return 'expired';
        }
      }
      return 'active';
    }

    // Check for paused subscription (returns 'paused' not 'suspended')
    const pausedSubscription = sortedSubscriptions.find(sub => sub.status === 'paused');
    if (pausedSubscription) {
      return 'paused';
    }

    // Check for canceled subscription
    const canceledSubscription = sortedSubscriptions.find(sub => sub.status === 'canceled');
    if (canceledSubscription) {
      return 'canceled';
    }

    // Check for overdue
    const overdueSubscription = sortedSubscriptions.find(sub => sub.status === 'overdue');
    if (overdueSubscription) {
      return 'expired';
    }

    // If we have subscriptions but none match the above, return 'suspended' as fallback
    return 'suspended';
  }

  // WhatsApp sessions operations
  async getWhatsAppSession(phoneNumber: string): Promise<WhatsAppSession | undefined> {
    const [session] = await db
      .select()
      .from(whatsappSessions)
      .where(eq(whatsappSessions.phoneNumber, phoneNumber));
    return session;
  }

  async createWhatsAppSession(session: InsertWhatsAppSession): Promise<WhatsAppSession> {
    const [newSession] = await db.insert(whatsappSessions).values(session).returning();
    return newSession;
  }

  async updateWhatsAppSession(phoneNumber: string, data: Partial<WhatsAppSession>): Promise<WhatsAppSession> {
    const [updated] = await db
      .update(whatsappSessions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(whatsappSessions.phoneNumber, phoneNumber))
      .returning();
    return updated;
  }

  async incrementFailedAttempts(phoneNumber: string): Promise<void> {
    await db
      .update(whatsappSessions)
      .set({ 
        failedAttempts: sqlOp`${whatsappSessions.failedAttempts} + 1`,
        updatedAt: new Date()
      })
      .where(eq(whatsappSessions.phoneNumber, phoneNumber));
  }

  async cleanupOldWhatsAppSessions(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await db
      .delete(whatsappSessions)
      .where(sqlOp`${whatsappSessions.lastMessageAt} < ${cutoffDate}`)
      .returning();
    
    const deletedCount = result.length;
    if (deletedCount > 0) {
      console.log(`[Storage] 🧹 Cleaned up ${deletedCount} old WhatsApp sessions (older than ${daysOld} days)`);
    }
    
    return deletedCount;
  }

  // Admin event logs operations
  async createAdminEventLog(log: InsertAdminEventLog): Promise<AdminEventLog> {
    const [newLog] = await db.insert(adminEventLogs).values(log).returning();
    return newLog;
  }

  // Webhook events operations
  async createWebhookEvent(event: InsertWebhookEvent): Promise<WebhookEvent> {
    const eventData = {
      ...event,
      event: (event as any).event || event.type, // Garantir que 'event' está preenchido
      type: event.type || (event as any).event, // Garantir que 'type' está preenchido
      status: ((event as any).status || 'pending') as 'pending' | 'processed' | 'failed',
    };
    const [newEvent] = await db.insert(webhookEvents).values(eventData).returning();
    return newEvent;
  }

  async getWebhookEvents(limit: number = 100): Promise<WebhookEvent[]> {
    return await db
      .select()
      .from(webhookEvents)
      .orderBy(desc(webhookEvents.receivedAt))
      .limit(limit);
  }

  async getWebhookEventById(id: string): Promise<WebhookEvent | undefined> {
    const [event] = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.id, id))
      .limit(1);
    return event;
  }

  async updateWebhookStatus(
    id: string,
    updates: {
      status: 'pending' | 'processed' | 'failed';
      processedAt?: Date | null;
      errorMessage?: string | null;
      retryCount?: number;
      lastRetryAt?: Date | null;
    }
  ): Promise<WebhookEvent | undefined> {
    const updateData: any = {
      status: updates.status,
      processed: updates.status === 'processed',
    };

    if (updates.processedAt !== undefined) {
      updateData.processedAt = updates.processedAt;
    }
    if (updates.errorMessage !== undefined) {
      updateData.errorMessage = updates.errorMessage;
    }
    if (updates.retryCount !== undefined) {
      updateData.retryCount = updates.retryCount;
    }
    if (updates.lastRetryAt !== undefined) {
      updateData.lastRetryAt = updates.lastRetryAt;
    }

    const [updated] = await db
      .update(webhookEvents)
      .set(updateData)
      .where(eq(webhookEvents.id, id))
      .returning();
    return updated;
  }

  async reprocessWebhookEvent(id: string): Promise<WebhookEvent | undefined> {
    const [updated] = await db
      .update(webhookEvents)
      .set({
        status: 'pending',
        processed: false,
        errorMessage: null,
        lastRetryAt: new Date(),
      })
      .where(eq(webhookEvents.id, id))
      .returning();
    return updated;
  }

  async getFailedWebhooks(maxRetries: number = 5): Promise<WebhookEvent[]> {
    return await db
      .select()
      .from(webhookEvents)
      .where(
        and(
          eq(webhookEvents.status, 'failed'),
          sqlOp`${webhookEvents.retryCount} < ${maxRetries}`
        )
      )
      .orderBy(desc(webhookEvents.receivedAt));
  }

  /**
   * Extrai eventId único do payload para agrupamento
   */
  private extractEventIdFromPayload(payload: any): string | null {
    if (payload?.data?.subscription?.id) {
      return `subscription_${payload.data.subscription.id}`;
    }
    if (payload?.data?.order?.id) {
      return `order_${payload.data.order.id}`;
    }
    if (payload?.data?.customer?.id) {
      return `customer_${payload.data.customer.id}`;
    }
    return null;
  }

  /**
   * Busca dados do cliente do payload ou do banco
   */
  private async enrichWebhookGroupWithCustomerData(
    attempts: WebhookEvent[]
  ): Promise<{
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    customerId: string | null;
    subscriptionId: string | null;
  }> {
    // Tentar extrair dados do primeiro payload válido
    let customerEmail: string | null = null;
    let customerName: string | null = null;
    let customerPhone: string | null = null;
    let subscriptionId: string | null = null;

    for (const attempt of attempts) {
      const payload = attempt.payload as any;
      if (payload?.data?.customer?.email) {
        customerEmail = payload.data.customer.email;
        customerName = payload.data.customer.name || null;
        customerPhone = payload.data.customer.phone || null;
      }
      if (payload?.data?.subscription?.id) {
        subscriptionId = payload.data.subscription.id;
      }
      // Se encontrou todos os dados, parar
      if (customerEmail && subscriptionId) break;
    }

    // Se encontrou subscriptionId, buscar dados atualizados do banco
    let customerId: string | null = null;
    if (subscriptionId) {
      try {
        const subscription = await this.getSubscriptionByProviderId('caktos', subscriptionId);
        if (subscription) {
          // Buscar cliente do banco
          const user = await this.getUser(subscription.userId);
          if (user) {
            customerId = user.id;
            // Priorizar dados do banco (mais atualizados)
            customerName = user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}`.trim()
              : customerName;
            customerEmail = user.email || customerEmail;
            customerPhone = user.whatsappNumber || user.telefone || customerPhone;
          }
        }
      } catch (error) {
        console.warn(`[Storage] Erro ao buscar dados do cliente para subscription ${subscriptionId}:`, error);
      }
    } else if (customerEmail) {
      // Se não tem subscriptionId mas tem email, buscar cliente pelo email
      try {
        const user = await this.getUserByEmail(customerEmail);
        if (user) {
          customerId = user.id;
          customerName = user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}`.trim()
            : customerName;
          customerPhone = user.whatsappNumber || user.telefone || customerPhone;
        }
      } catch (error) {
        console.warn(`[Storage] Erro ao buscar cliente por email ${customerEmail}:`, error);
      }
    }

    return {
      customerName: customerName || null,
      customerEmail: customerEmail || null,
      customerPhone: customerPhone || null,
      customerId: customerId || null,
      subscriptionId: subscriptionId || null,
    };
  }

  async getWebhookGroups(limit: number = 100): Promise<Array<{
    eventId: string;
    eventType: string;
    attempts: WebhookEvent[];
    lastAttempt: WebhookEvent;
    firstAttempt: WebhookEvent;
    successCount: number;
    failureCount: number;
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    customerId: string | null;
    subscriptionId: string | null;
  }>> {
    // Buscar todos os webhooks recentes
    const allWebhooks = await db
      .select()
      .from(webhookEvents)
      .orderBy(desc(webhookEvents.receivedAt))
      .limit(limit * 2); // Buscar mais para garantir agrupamento correto

    // Agrupar por eventId
    const groupsMap = new Map<string, WebhookEvent[]>();

    for (const webhook of allWebhooks) {
      const eventId = this.extractEventIdFromPayload(webhook.payload);
      if (eventId) {
        if (!groupsMap.has(eventId)) {
          groupsMap.set(eventId, []);
        }
        groupsMap.get(eventId)!.push(webhook);
      }
    }

    // Converter para array e enriquecer com dados do cliente
    const groups = await Promise.all(
      Array.from(groupsMap.entries())
        .slice(0, limit)
        .map(async ([eventId, attempts]) => {
          // Ordenar attempts por data (mais recente primeiro)
          attempts.sort((a, b) => 
            new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
          );

          const lastAttempt = attempts[0];
          const firstAttempt = attempts[attempts.length - 1];
          const successCount = attempts.filter(a => a.status === 'processed').length;
          const failureCount = attempts.filter(a => a.status === 'failed').length;

          // Enriquecer com dados do cliente
          const customerData = await this.enrichWebhookGroupWithCustomerData(attempts);

          return {
            eventId,
            eventType: lastAttempt.event || lastAttempt.type,
            attempts,
            lastAttempt,
            firstAttempt,
            successCount,
            failureCount,
            ...customerData,
          };
        })
    );

    return groups;
  }

  // Webhook processed events (idempotência)
  async checkEventProcessed(eventId: string): Promise<WebhookProcessedEvent | undefined> {
    const [event] = await db
      .select()
      .from(webhookProcessedEvents)
      .where(eq(webhookProcessedEvents.eventId, eventId))
      .limit(1);
    return event;
  }

  async markEventProcessed(event: InsertWebhookProcessedEvent): Promise<WebhookProcessedEvent> {
    const [newEvent] = await db
      .insert(webhookProcessedEvents)
      .values(event)
      .onConflictDoNothing()
      .returning();
    
    if (!newEvent) {
      // Se já existe, retornar o existente
      const existing = await this.checkEventProcessed(event.eventId);
      if (!existing) {
        throw new Error("Falha ao marcar evento como processado");
      }
      return existing;
    }
    
    return newEvent;
  }

  // Orders operations
  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db
      .insert(orders)
      .values({
        ...order,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: orders.id,
        set: {
          ...order,
          updatedAt: new Date(),
        },
      })
      .returning();
    return newOrder;
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id));
    return order;
  }

  async getOrdersBySubscriptionId(subscriptionId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.subscriptionId, subscriptionId))
      .orderBy(desc(orders.createdAt));
  }

  // WhatsApp latency operations
  async createWhatsAppLatency(latency: InsertWhatsAppLatency): Promise<WhatsAppLatency> {
    const [newLatency] = await db
      .insert(whatsappLatency)
      .values({
        ...latency,
        id: latency.id || sql`gen_random_uuid()::text`,
      })
      .returning();
    return newLatency;
  }

  async updateWhatsAppLatency(id: string, updates: Partial<InsertWhatsAppLatency>): Promise<WhatsAppLatency | undefined> {
    const [updated] = await db
      .update(whatsappLatency)
      .set(updates)
      .where(eq(whatsappLatency.id, id))
      .returning();
    
    // Recalcular latências se necessário
    if (updated) {
      await this.recalculateLatencies(updated.id);
    }
    
    return updated;
  }

  async updateWhatsAppLatencyByMessageId(waMessageId: string, updates: Partial<InsertWhatsAppLatency>): Promise<WhatsAppLatency | undefined> {
    const [updated] = await db
      .update(whatsappLatency)
      .set(updates)
      .where(eq(whatsappLatency.waMessageId, waMessageId))
      .returning();
    
    if (updated) {
      await this.recalculateLatencies(updated.id);
    }
    
    return updated;
  }

  async updateWhatsAppLatencyByResponseMessageId(responseMessageId: string, updates: Partial<InsertWhatsAppLatency>): Promise<WhatsAppLatency | undefined> {
    const [updated] = await db
      .update(whatsappLatency)
      .set(updates)
      .where(eq(whatsappLatency.responseMessageId, responseMessageId))
      .returning();
    
    if (updated) {
      await this.recalculateLatencies(updated.id);
    }
    
    return updated;
  }

  private async recalculateLatencies(id: string): Promise<void> {
    const latency = await db
      .select()
      .from(whatsappLatency)
      .where(eq(whatsappLatency.id, id))
      .limit(1);
    
    if (!latency[0]) return;
    
    const updates: any = {};
    
    // Calcular botLatencyMs: processedAt - receivedAt
    if (latency[0].receivedAt && latency[0].processedAt) {
      const botLatencyMs = new Date(latency[0].processedAt).getTime() - new Date(latency[0].receivedAt).getTime();
      updates.botLatencyMs = Math.max(0, botLatencyMs);
    }
    
    // Calcular networkLatencyMs: providerDeliveredAt - responseQueuedAt
    if (latency[0].responseQueuedAt && latency[0].providerDeliveredAt) {
      const networkLatencyMs = new Date(latency[0].providerDeliveredAt).getTime() - new Date(latency[0].responseQueuedAt).getTime();
      updates.networkLatencyMs = Math.max(0, networkLatencyMs);
    }
    
    // Calcular totalLatencyMs: repliedToClientAt - receivedAt (ou providerDeliveredAt se repliedToClientAt não existir)
    if (latency[0].receivedAt) {
      const endTime = latency[0].repliedToClientAt || latency[0].providerDeliveredAt;
      if (endTime) {
        const totalLatencyMs = new Date(endTime).getTime() - new Date(latency[0].receivedAt).getTime();
        updates.totalLatencyMs = Math.max(0, totalLatencyMs);
      }
    }
    
    if (Object.keys(updates).length > 0) {
      await db
        .update(whatsappLatency)
        .set(updates)
        .where(eq(whatsappLatency.id, id));
    }
  }

  async getWhatsAppLatencies(filters?: {
    userId?: string;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<WhatsAppLatency[]> {
    let query = db.select().from(whatsappLatency);

    const conditions: any[] = [];

    if (filters?.userId) {
      conditions.push(eq(whatsappLatency.userId, filters.userId));
    }

    if (filters?.startDate) {
      conditions.push(sqlOp`${whatsappLatency.receivedAt} >= ${filters.startDate}`);
    }

    if (filters?.endDate) {
      conditions.push(sqlOp`${whatsappLatency.receivedAt} <= ${filters.endDate}`);
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(desc(whatsappLatency.receivedAt));

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }

    return await query;
  }

  async getWhatsAppLatencyStats(startDate?: Date, endDate?: Date): Promise<{
    avgTotalLatency: number;
    avgBotLatency: number;
    avgNetworkLatency: number;
    maxTotalLatency: number;
    totalMessages: number;
    errorRate: number;
  }> {
    let query = db
      .select({
        avgTotalLatency: sqlOp<number>`COALESCE(AVG(${whatsappLatency.totalLatencyMs}), 0)`,
        avgBotLatency: sqlOp<number>`COALESCE(AVG(${whatsappLatency.botLatencyMs}), 0)`,
        avgNetworkLatency: sqlOp<number>`COALESCE(AVG(${whatsappLatency.networkLatencyMs}), 0)`,
        maxTotalLatency: sqlOp<number>`COALESCE(MAX(${whatsappLatency.totalLatencyMs}), 0)`,
        totalMessages: sqlOp<number>`COUNT(*)`,
        errorCount: sqlOp<number>`COUNT(*) FILTER (WHERE ${whatsappLatency.totalLatencyMs} IS NULL OR ${whatsappLatency.totalLatencyMs} > 10000)`,
      })
      .from(whatsappLatency);

    const conditions: any[] = [];

    if (startDate) {
      conditions.push(sqlOp`${whatsappLatency.receivedAt} >= ${startDate}`);
    }

    if (endDate) {
      conditions.push(sqlOp`${whatsappLatency.receivedAt} <= ${endDate}`);
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const [stats] = await query;

    const totalMessages = Number(stats.totalMessages) || 0;
    const errorCount = Number(stats.errorCount) || 0;
    const errorRate = totalMessages > 0 ? (errorCount / totalMessages) * 100 : 0;

    return {
      avgTotalLatency: Math.round(Number(stats.avgTotalLatency) || 0),
      avgBotLatency: Math.round(Number(stats.avgBotLatency) || 0),
      avgNetworkLatency: Math.round(Number(stats.avgNetworkLatency) || 0),
      maxTotalLatency: Number(stats.maxTotalLatency) || 0,
      totalMessages,
      errorRate: Math.round(errorRate * 100) / 100,
    };
  }

  // Client logs operations
  async logClientEvent(
    userId: string | null,
    eventType: string,
    message: string,
    data: any = {}
  ): Promise<ClientLog> {
    const [newLog] = await db
      .insert(clientLogs)
      .values({
        userId: userId || null,
        eventType,
        message,
        data: data || {},
      })
      .returning();
    return newLog;
  }

  async getClientLogs(filters?: {
    userId?: string;
    eventType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<ClientLog[]> {
    let query = db.select().from(clientLogs);

    const conditions: any[] = [];

    if (filters?.userId) {
      conditions.push(eq(clientLogs.userId, filters.userId));
    }

    if (filters?.eventType) {
      conditions.push(eq(clientLogs.eventType, filters.eventType));
    }

    if (filters?.startDate) {
      conditions.push(sqlOp`${clientLogs.createdAt} >= ${filters.startDate}`);
    }

    if (filters?.endDate) {
      conditions.push(sqlOp`${clientLogs.createdAt} <= ${filters.endDate}`);
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(desc(clientLogs.createdAt));

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }

    return await query;
  }

  // Latency alerts operations
  async createLatencyAlert(alert: InsertLatencyAlert): Promise<LatencyAlert> {
    const [newAlert] = await db.insert(latencyAlerts).values(alert).returning();
    return newAlert;
  }

  async getActiveLatencyAlerts(): Promise<LatencyAlert[]> {
    return await db
      .select()
      .from(latencyAlerts)
      .where(eq(latencyAlerts.resolved, false))
      .orderBy(desc(latencyAlerts.createdAt));
  }

  async resolveLatencyAlert(id: string): Promise<LatencyAlert | undefined> {
    const [updated] = await db
      .update(latencyAlerts)
      .set({
        resolved: true,
        resolvedAt: new Date(),
      })
      .where(eq(latencyAlerts.id, id))
      .returning();
    return updated;
  }

  // Get all events (unified from admin_event_logs, subscription_events, system_logs)
  async getAllEvents(q?: string, type?: string, severity?: string): Promise<Array<{
    id: string;
    type: string;
    message: string;
    source: string;
    createdAt: Date | string;
    metadata: any;
  }>> {
    // Read all admin_event_logs
    const adminEventsRaw = await db
      .select()
      .from(adminEventLogs)
      .orderBy(desc(adminEventLogs.createdAt));

    // Read all subscription_events
    const subscriptionEventsRaw = await db
      .select()
      .from(subscriptionEvents)
      .orderBy(desc(subscriptionEvents.createdAt));

    // Read all system_logs
    const systemEventsRaw = await db
      .select()
      .from(systemLogs)
      .orderBy(desc(systemLogs.createdAt));

    // Normalize admin_event_logs
    const adminEvents = adminEventsRaw.map(event => ({
      id: event.id,
      type: event.type,
      message: `Admin action: ${event.type}`,
      source: 'admin',
      createdAt: event.createdAt,
      metadata: event.metadata,
    }));

    // Normalize subscription_events
    const subscriptionEvents = subscriptionEventsRaw.map(event => ({
      id: event.id,
      type: event.type,
      message: `Subscription event: ${event.type}`,
      source: 'subscription',
      createdAt: event.createdAt,
      metadata: event.rawPayload,
    }));

    // Normalize system_logs
    const systemEvents = systemEventsRaw.map(event => ({
      id: event.id,
      type: event.level,
      message: event.message,
      source: event.source,
      createdAt: event.createdAt,
      metadata: event.meta,
    }));

    // Unify all arrays
    let allEvents = [...adminEvents, ...subscriptionEvents, ...systemEvents];
    
    // Filter by search term if provided
    if (q) {
      const searchTerm = q.toLowerCase();
      allEvents = allEvents.filter(event => {
        const eventType = (event.type || "").toLowerCase();
        const message = (event.message || "").toLowerCase();
        const source = (event.source || "").toLowerCase();
        return eventType.includes(searchTerm) || message.includes(searchTerm) || source.includes(searchTerm);
      });
    }

    // Filter by type (source)
    if (type && type !== 'all') {
      allEvents = allEvents.filter(event => {
        const source = (event.source || "").toLowerCase();
        if (type === 'whatsapp') return source.includes('whatsapp');
        if (type === 'ai') return source.includes('ai') || source.includes('openai') || source.includes('gpt');
        if (type === 'webhook') return source.includes('webhook') || source.includes('caktos');
        if (type === 'system') return source === 'system';
        if (type === 'admin') return source === 'admin';
        return true;
      });
    }

    // Filter by severity (from metadata or type)
    if (severity && severity !== 'all') {
      allEvents = allEvents.filter(event => {
        const eventSeverity = (event.metadata?.severity || event.metadata?.level || event.type || "").toLowerCase();
        return eventSeverity.includes(severity.toLowerCase());
      });
    }
    
    // Sort by date descending
    allEvents.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    return allEvents;
  }
}

export const storage = new DatabaseStorage();
