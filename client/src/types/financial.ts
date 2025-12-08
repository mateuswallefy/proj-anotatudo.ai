/**
 * Tipos padronizados para o sistema financeiro
 * Baseados nas entidades do banco de dados
 */

// Transaction types
export type TransactionType = "entrada" | "saida" | "economia";
export type TransactionOrigin = "texto" | "audio" | "foto" | "video" | "manual";

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number; // parsed from decimal
  date: string; // ISO date string (dataReal)
  category: string;
  description?: string | null;
  accountId?: string | null; // cartaoId
  goalId?: string | null;
  origin: TransactionOrigin;
  mediaUrl?: string | null;
  createdAt: string;
  dataRegistro?: string | null;
}

export interface CreateTransactionInput {
  type: TransactionType;
  amount: number;
  date: string;
  category: string;
  description?: string;
  accountId?: string; // cartaoId
  goalId?: string;
  origin?: TransactionOrigin;
}

export interface UpdateTransactionInput extends Partial<CreateTransactionInput> {}

// Goal types
export type GoalStatus = "ativa" | "concluida" | "cancelada";
export type GoalPriority = "baixa" | "media" | "alta";

export interface Goal {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  targetAmount: number; // parsed from decimal
  currentAmount: number; // parsed from decimal
  startDate: string; // ISO date string (dataInicio)
  deadline?: string | null; // ISO date string (dataFim)
  priority: GoalPriority;
  status: GoalStatus;
  createdAt: string;
}

export interface CreateGoalInput {
  name: string;
  description?: string;
  targetAmount: number;
  startDate: string;
  deadline?: string;
  priority?: GoalPriority;
}

export interface UpdateGoalInput extends Partial<CreateGoalInput> {
  status?: GoalStatus;
}

// Budget types
export type BudgetType = "mensal_total" | "mensal_categoria";
export type BudgetStatus = "ok" | "atenção" | "estourado";

export interface Budget {
  id: string;
  userId: string;
  type: BudgetType;
  category?: string | null;
  limit: number; // parsed from decimal
  spent: number; // calculated from transactions
  percent: number; // calculated: (spent / limit) * 100
  status: BudgetStatus; // calculated
  month?: number | null;
  year?: number | null;
  active: boolean; // parsed from 'sim' | 'nao'
  createdAt: string;
}

export interface CreateBudgetInput {
  type: BudgetType;
  category?: string;
  limit: number;
  month?: number;
  year?: number;
}

export interface UpdateBudgetInput extends Partial<CreateBudgetInput> {
  active?: boolean;
}

// Credit Card types
export type CardBrand = "visa" | "mastercard" | "elo" | "american-express" | "outro";
export type CardStatus = "Tranquilo" | "Atenção" | "Alerta";

export interface CreditCard {
  id: string;
  userId: string;
  name: string; // nomeCartao
  limit: number; // parsed from limiteTotal
  used: number; // parsed from limiteUsado
  percent: number; // calculated: (used / limit) * 100
  status: CardStatus; // calculated
  closingDay: number; // diaFechamento
  dueDay: number; // diaVencimento
  brand?: CardBrand | null;
  currentInvoiceAmount: number; // calculated from faturas
  createdAt: string;
}

export interface CreateCreditCardInput {
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  brand?: CardBrand;
}

export interface UpdateCreditCardInput extends Partial<CreateCreditCardInput> {}

// Settings types
export interface UserSettings {
  currency: string; // default: "BRL"
  firstDayOfMonth: number; // 1-31, default: 1
  language: string; // default: "pt-BR"
  darkModeDefault: boolean;
  includeSavingsInBalance: boolean; // se saldo considera economias
  showProjections: boolean; // se exibe projeções em gráficos
}

// Dashboard types
export interface DashboardKpi {
  label: string;
  value: number;
  diffVsLastMonth: number; // percentual
  trend: "up" | "down" | "neutral";
  type: "income" | "expense" | "savings" | "balance";
}

export interface ChartDataPoint {
  date: string; // formatted date
  entradas: number;
  despesas: number;
  saldo: number;
}

export interface DashboardData {
  kpis: DashboardKpi[];
  mainChartSeries: ChartDataPoint[];
  budgetsSummary: Budget[];
  goalsSummary: Goal[];
  cardsSummary: CreditCard[];
  recentTransactions: Transaction[];
}

// Filter types
export interface TransactionFilters {
  period?: string; // YYYY-MM
  type?: TransactionType;
  category?: string;
  accountId?: string; // cartaoId
  search?: string; // texto livre
  minAmount?: number;
  maxAmount?: number;
  startDate?: string; // ISO date
  endDate?: string; // ISO date
}

