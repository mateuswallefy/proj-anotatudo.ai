import { useQuery } from "@tanstack/react-query";
import { usePeriod } from "@/contexts/PeriodContext";
import type {
  DashboardData,
  DashboardKpi,
  ChartDataPoint,
  Transaction,
  Goal,
  Budget,
  CreditCard,
} from "@/types/financial";
import type { Transacao, Goal as GoalSchema } from "@shared/schema";

/**
 * Hook centralizado para dados do dashboard
 * Calcula tudo em memória baseado nas transações do período
 */
export function useDashboardData() {
  const { period } = usePeriod();

  // Parse period
  const [year, month] = period
    ? period.split("-").map(Number)
    : [new Date().getFullYear(), new Date().getMonth() + 1];

  // Fetch all transactions for the period
  const { data: transactions, isLoading: loadingTransactions } = useQuery<
    Transacao[]
  >({
    queryKey: ["/api/transacoes", { period }],
    queryFn: async () => {
      const response = await fetch(`/api/transacoes?period=${period}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
  });

  // Fetch previous month transactions for comparison
  const previousMonth = new Date(year, month - 2, 1);
  const previousPeriod = `${previousMonth.getFullYear()}-${String(
    previousMonth.getMonth() + 1
  ).padStart(2, "0")}`;

  const { data: previousTransactions } = useQuery<Transacao[]>({
    queryKey: ["/api/transacoes", { period: previousPeriod }],
    queryFn: async () => {
      const response = await fetch(
        `/api/transacoes?period=${previousPeriod}`,
        { credentials: "include" }
      );
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!period,
  });

  // Fetch goals
  const { data: goals, isLoading: loadingGoals } = useQuery<GoalSchema[]>({
    queryKey: ["/api/goals"],
    queryFn: async () => {
      const response = await fetch(`/api/goals`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch goals");
      return response.json();
    },
  });

  // Fetch budgets
  const { data: budgets, isLoading: loadingBudgets } = useQuery({
    queryKey: ["/api/budgets", { year, month }],
    queryFn: async () => {
      const response = await fetch(
        `/api/budgets?year=${year}&month=${month}`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch budgets");
      return response.json();
    },
  });

  // Fetch cards overview
  const { data: cardsOverview, isLoading: loadingCards } = useQuery({
    queryKey: ["/api/credit-cards/overview", { year, month }],
    queryFn: async () => {
      const response = await fetch(
        `/api/credit-cards/overview?year=${year}&month=${month}`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch cards overview");
      return response.json();
    },
  });

  // Calculate KPIs
  const calculateKPIs = (): DashboardKpi[] => {
    if (!transactions) return [];

    const current = {
      income: transactions
        .filter((t) => t.tipo === "entrada")
        .reduce((sum, t) => sum + parseFloat(t.valor), 0),
      expense: transactions
        .filter((t) => t.tipo === "saida")
        .reduce((sum, t) => sum + parseFloat(t.valor), 0),
      savings: transactions
        .filter((t) => t.tipo === "economia")
        .reduce((sum, t) => sum + parseFloat(t.valor), 0),
    };

    const previous = previousTransactions
      ? {
          income: previousTransactions
            .filter((t) => t.tipo === "entrada")
            .reduce((sum, t) => sum + parseFloat(t.valor), 0),
          expense: previousTransactions
            .filter((t) => t.tipo === "saida")
            .reduce((sum, t) => sum + parseFloat(t.valor), 0),
          savings: previousTransactions
            .filter((t) => t.tipo === "economia")
            .reduce((sum, t) => sum + parseFloat(t.valor), 0),
        }
      : { income: 0, expense: 0, savings: 0 };

    const calculateDiff = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const balance = current.income - current.expense;
    const previousBalance = previous.income - previous.expense;

    return [
      {
        label: "ENTRADAS",
        value: current.income,
        diffVsLastMonth: calculateDiff(current.income, previous.income),
        trend:
          current.income > previous.income
            ? "up"
            : current.income < previous.income
            ? "down"
            : "neutral",
        type: "income",
      },
      {
        label: "DESPESAS",
        value: current.expense,
        diffVsLastMonth: calculateDiff(current.expense, previous.expense),
        trend:
          current.expense < previous.expense
            ? "up"
            : current.expense > previous.expense
            ? "down"
            : "neutral",
        type: "expense",
      },
      {
        label: "ECONOMIAS",
        value: current.savings,
        diffVsLastMonth: calculateDiff(current.savings, previous.savings),
        trend:
          current.savings > previous.savings
            ? "up"
            : current.savings < previous.savings
            ? "down"
            : "neutral",
        type: "savings",
      },
      {
        label: "SALDO DO MÊS",
        value: balance,
        diffVsLastMonth: calculateDiff(balance, previousBalance),
        trend:
          balance > previousBalance
            ? "up"
            : balance < previousBalance
            ? "down"
            : "neutral",
        type: "balance",
      },
    ];
  };

  // Calculate chart series (daily evolution)
  const calculateChartSeries = (): ChartDataPoint[] => {
    if (!transactions) return [];

    // Group transactions by day
    const byDay = new Map<string, { entradas: number; despesas: number }>();

    transactions.forEach((t) => {
      const date = new Date(t.dataReal).toISOString().split("T")[0];
      if (!byDay.has(date)) {
        byDay.set(date, { entradas: 0, despesas: 0 });
      }
      const day = byDay.get(date)!;
      if (t.tipo === "entrada") {
        day.entradas += parseFloat(t.valor);
      } else if (t.tipo === "saida") {
        day.despesas += parseFloat(t.valor);
      }
    });

    // Get all days in the month
    const daysInMonth = new Date(year, month, 0).getDate();
    const series: ChartDataPoint[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateStr = date.toISOString().split("T")[0];
      const dayData = byDay.get(dateStr) || { entradas: 0, despesas: 0 };

      // Calculate cumulative balance
      const previousBalance =
        series.length > 0
          ? series[series.length - 1].saldo
          : 0;
      const saldo = previousBalance + dayData.entradas - dayData.despesas;

      series.push({
        date: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
        entradas: dayData.entradas,
        despesas: dayData.despesas,
        saldo,
      });
    }

    return series;
  };

  // Transform goals
  const transformGoals = (): Goal[] => {
    if (!goals) return [];
    return goals
      .filter((g) => g.status === "ativa")
      .map((g) => ({
        id: g.id,
        userId: g.userId,
        name: g.nome,
        description: g.descricao || undefined,
        targetAmount: parseFloat(g.valorAlvo),
        currentAmount: parseFloat(g.valorAtual || "0"),
        startDate: g.dataInicio,
        deadline: g.dataFim || undefined,
        priority: g.prioridade as "baixa" | "media" | "alta",
        status: g.status as "ativa" | "concluida" | "cancelada",
        createdAt: g.createdAt || "",
      }));
  };

  // Transform budgets
  const transformBudgets = (): Budget[] => {
    if (!budgets || !Array.isArray(budgets)) return [];

    // Calculate spent per category from transactions
    const spentByCategory = new Map<string, number>();
    transactions?.forEach((t) => {
      if (t.tipo === "saida" && t.categoria) {
        const current = spentByCategory.get(t.categoria) || 0;
        spentByCategory.set(t.categoria, current + parseFloat(t.valor));
      }
    });

    return budgets.map((b: any) => {
      const spent = spentByCategory.get(b.categoria || "") || 0;
      const limit = parseFloat(b.limit || b.valorLimite || "0");
      const percent = limit > 0 ? (spent / limit) * 100 : 0;
      const status: "ok" | "atenção" | "estourado" =
        percent >= 100 ? "estourado" : percent >= 75 ? "atenção" : "ok";

      return {
        id: b.id,
        userId: b.userId,
        type: b.tipo === "mensal_categoria" ? "mensal_categoria" : "mensal_total",
        category: b.categoria || undefined,
        limit,
        spent,
        percent,
        status,
        month: b.mes || month,
        year: b.ano || year,
        active: b.ativo === "sim",
        createdAt: b.createdAt || "",
      };
    });
  };

  // Transform cards
  const transformCards = (): CreditCard[] => {
    if (!cardsOverview || !Array.isArray(cardsOverview)) return [];

    return cardsOverview.map((c: any) => {
      const limit = parseFloat(c.limiteTotal || "0");
      const used = parseFloat(c.faturaAtual || c.limiteUsado || "0");
      const percent = limit > 0 ? (used / limit) * 100 : 0;
      const status: "Tranquilo" | "Atenção" | "Alerta" =
        percent >= 70 ? "Alerta" : percent >= 50 ? "Atenção" : "Tranquilo";

      return {
        id: c.id,
        userId: c.userId,
        name: c.nomeCartao,
        limit,
        used,
        percent,
        status,
        closingDay: c.closingDay || c.diaFechamento || 1,
        dueDay: c.dueDay || c.diaVencimento || 10,
        brand: c.bandeira || undefined,
        currentInvoiceAmount: used,
        createdAt: c.createdAt || "",
      };
    });
  };

  // Transform recent transactions
  const transformRecentTransactions = (): Transaction[] => {
    if (!transactions) return [];

    return transactions
      .slice(0, 6)
      .map((t) => ({
        id: t.id,
        userId: t.userId,
        type: t.tipo as "entrada" | "saida" | "economia",
        amount: parseFloat(t.valor),
        date: t.dataReal,
        category: t.categoria,
        description: t.descricao || undefined,
        accountId: t.cartaoId || undefined,
        goalId: t.goalId || undefined,
        origin: t.origem as
          | "texto"
          | "audio"
          | "foto"
          | "video"
          | "manual",
        mediaUrl: t.mediaUrl || undefined,
        createdAt: t.createdAt || "",
        dataRegistro: t.dataRegistro || undefined,
      }));
  };

  const isLoading =
    loadingTransactions || loadingGoals || loadingBudgets || loadingCards;

  const data: DashboardData | undefined = transactions
    ? {
        kpis: calculateKPIs(),
        mainChartSeries: calculateChartSeries(),
        budgetsSummary: transformBudgets(),
        goalsSummary: transformGoals(),
        cardsSummary: transformCards(),
        recentTransactions: transformRecentTransactions(),
      }
    : undefined;

  return {
    data,
    isLoading,
    refetch: () => {
      // This will be handled by React Query automatically
    },
  };
}

