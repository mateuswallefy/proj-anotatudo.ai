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

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  telefone: varchar("telefone"),
  plano: varchar("plano").default('free'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Transactions table
export const transacoes = pgTable("transacoes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  tipo: varchar("tipo", { enum: ['entrada', 'saida'] }).notNull(),
  categoria: varchar("categoria").notNull(),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  dataRegistro: timestamp("data_registro").defaultNow(),
  dataReal: date("data_real").notNull(),
  origem: varchar("origem", { enum: ['texto', 'audio', 'foto', 'video', 'manual'] }).notNull(),
  descricao: text("descricao"),
  mediaUrl: varchar("media_url"),
  cartaoId: varchar("cartao_id").references(() => cartoes.id, { onDelete: 'set null' }),
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
