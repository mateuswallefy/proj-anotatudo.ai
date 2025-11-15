import {
  users,
  transacoes,
  cartoes,
  faturas,
  cartaoTransacoes,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;

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
}

export const storage = new DatabaseStorage();
