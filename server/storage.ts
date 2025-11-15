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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, or, sql as sqlOp } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserPassword(id: string, passwordHash: string): Promise<void>;
  updateUserProfileImage(id: string, imageUrl: string): Promise<void>;

  // Transaction operations
  getTransacoes(userId: string): Promise<Transacao[]>;
  createTransacao(transacao: InsertTransacao): Promise<Transacao>;
  getTransacaoById(id: string): Promise<Transacao | undefined>;

  // Card operations
  getCartoes(userId: string): Promise<Cartao[]>;
  createCartao(cartao: InsertCartao): Promise<Cartao>;
  getCartaoById(id: string): Promise<Cartao | undefined>;
  updateCartaoLimiteUsado(id: string, novoLimite: string): Promise<void>;

  // Invoice operations
  getFaturas(cartaoId: string): Promise<Fatura[]>;
  createFatura(fatura: InsertFatura): Promise<Fatura>;
  getFaturaById(id: string): Promise<Fatura | undefined>;

  // Card transaction operations
  getCartaoTransacoes(faturaId: string): Promise<CartaoTransacao[]>;
  createCartaoTransacao(transacao: InsertCartaoTransacao): Promise<CartaoTransacao>;

  // Goals operations
  getGoals(userId: string): Promise<Goal[]>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoalValorAtual(id: string, valorAtual: string): Promise<void>;
  updateGoalStatus(id: string, status: 'ativa' | 'concluida' | 'cancelada'): Promise<void>;

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
  async getTransacoes(userId: string): Promise<Transacao[]> {
    return await db
      .select()
      .from(transacoes)
      .where(eq(transacoes.userId, userId))
      .orderBy(desc(transacoes.dataReal));
  }

  async createTransacao(transacao: InsertTransacao): Promise<Transacao> {
    const [newTransacao] = await db
      .insert(transacoes)
      .values(transacao)
      .returning();
    return newTransacao;
  }

  async getTransacaoById(id: string): Promise<Transacao | undefined> {
    const [transacao] = await db
      .select()
      .from(transacoes)
      .where(eq(transacoes.id, id));
    return transacao;
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

  async updateGoalValorAtual(id: string, valorAtual: string): Promise<void> {
    await db
      .update(goals)
      .set({ valorAtual })
      .where(eq(goals.id, id));
  }

  async updateGoalStatus(id: string, status: 'ativa' | 'concluida' | 'cancelada'): Promise<void> {
    await db
      .update(goals)
      .set({ status })
      .where(eq(goals.id, id));
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
}

export const storage = new DatabaseStorage();
