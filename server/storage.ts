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
  type User,
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
} from "@shared/schema";
import { db } from "./db.js";
import { eq, and, desc, or, sql as sqlOp, like, ilike, inArray } from "drizzle-orm";
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
  listUsers(filters?: { search?: string; status?: string; page?: number; pageSize?: number }): Promise<{ items: User[]; total: number }>;
  updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined>;

  // Subscription operations
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscriptionById(id: string): Promise<Subscription | undefined>;
  getSubscriptionByProviderId(provider: 'caktos' | 'manual', providerSubscriptionId: string): Promise<Subscription | undefined>;
  getSubscriptionsByUserId(userId: string): Promise<Subscription[]>;
  updateSubscription(id: string, updates: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  listSubscriptions(filters?: { status?: string; provider?: string }): Promise<Subscription[]>;

  // Subscription events operations
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
  getUserSubscriptionStatus(userId: string): Promise<'active' | 'suspended' | 'expired' | 'canceled' | 'none'>;

  // Admin event logs operations
  createAdminEventLog(log: InsertAdminEventLog): Promise<AdminEventLog>;
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
  async listUsers(filters?: { search?: string; status?: string; page?: number; pageSize?: number }): Promise<{ items: User[]; total: number }> {
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
          sqlOp`COALESCE(${users.whatsappNumber}::text, '') LIKE ${searchTerm}`
        )!
      );
    }

    if (filters?.status) {
      whereConditions.push(eq(users.billingStatus, filters.status as any));
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

  async listSubscriptions(filters?: { status?: string; provider?: string }): Promise<Subscription[]> {
    let whereConditions: any[] = [];

    if (filters?.status) {
      whereConditions.push(eq(subscriptions.status, filters.status as any));
    }

    if (filters?.provider) {
      whereConditions.push(eq(subscriptions.provider, filters.provider as any));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    return await db
      .select()
      .from(subscriptions)
      .where(whereClause)
      .orderBy(desc(subscriptions.createdAt));
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
  async getUserSubscriptionStatus(userId: string): Promise<'active' | 'suspended' | 'expired' | 'canceled' | 'none'> {
    const userSubscriptions = await this.getSubscriptionsByUserId(userId);
    
    if (userSubscriptions.length === 0) {
      return 'none';
    }

    // Get the most recent active subscription
    const activeSubscription = userSubscriptions.find(sub => 
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

    // Check for paused subscription
    const pausedSubscription = userSubscriptions.find(sub => sub.status === 'paused');
    if (pausedSubscription) {
      return 'suspended';
    }

    // Check for canceled subscription
    const canceledSubscription = userSubscriptions.find(sub => sub.status === 'canceled');
    if (canceledSubscription) {
      return 'canceled';
    }

    // Check for overdue
    const overdueSubscription = userSubscriptions.find(sub => sub.status === 'overdue');
    if (overdueSubscription) {
      return 'expired';
    }

    return 'none';
  }

  // Admin event logs operations
  async createAdminEventLog(log: InsertAdminEventLog): Promise<AdminEventLog> {
    const [newLog] = await db.insert(adminEventLogs).values(log).returning();
    return newLog;
  }
}

export const storage = new DatabaseStorage();
