import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useDashboardPeriod } from "./useDashboardPeriod";
import type { Transacao } from "@shared/schema";

interface DashboardStats {
  receitas: number;
  despesas: number;
  saldo: number;
  faturasCartao: number;
  variacaoReceitas: number;
  variacaoDespesas: number;
  variacaoSaldo: number;
  isLoading: boolean;
}

export function useDashboardStats(): DashboardStats {
  const { dateRange, previousDateRange } = useDashboardPeriod();

  // Format dates for API
  const startDate = format(dateRange.start, "yyyy-MM-dd");
  const endDate = format(dateRange.end, "yyyy-MM-dd");
  const prevStartDate = format(previousDateRange.start, "yyyy-MM-dd");
  const prevEndDate = format(previousDateRange.end, "yyyy-MM-dd");

  // Fetch current period transactions
  const { data: transactions, isLoading: loadingCurrent } = useQuery<
    Transacao[]
  >({
    queryKey: ["/api/transacoes", { startDate, endDate }],
    queryFn: async () => {
      const response = await fetch(
        `/api/transacoes?startDate=${startDate}&endDate=${endDate}`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
  });

  // Fetch previous period for comparison
  const { data: previousTransactions } = useQuery<Transacao[]>({
    queryKey: ["/api/transacoes", { startDate: prevStartDate, endDate: prevEndDate }],
    queryFn: async () => {
      const response = await fetch(
        `/api/transacoes?startDate=${prevStartDate}&endDate=${prevEndDate}`,
        { credentials: "include" }
      );
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Fetch cards overview for invoices (using current month for now)
  const year = dateRange.start.getFullYear();
  const month = dateRange.start.getMonth() + 1;
  
  const { data: cardsOverview } = useQuery({
    queryKey: ["/api/credit-cards/overview", { year, month }],
    queryFn: async () => {
      const response = await fetch(
        `/api/credit-cards/overview?year=${year}&month=${month}`,
        { credentials: "include" }
      );
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Calculate stats
  const calculateStats = () => {
    if (!transactions) {
      return {
        receitas: 0,
        despesas: 0,
        saldo: 0,
        faturasCartao: 0,
        variacaoReceitas: 0,
        variacaoDespesas: 0,
        variacaoSaldo: 0,
      };
    }

    const current = {
      receitas: transactions
        .filter((t) => t.tipo === "entrada")
        .reduce((sum, t) => sum + parseFloat(t.valor), 0),
      despesas: transactions
        .filter((t) => t.tipo === "saida")
        .reduce((sum, t) => sum + parseFloat(t.valor), 0),
    };

    const previous = previousTransactions
      ? {
          receitas: previousTransactions
            .filter((t) => t.tipo === "entrada")
            .reduce((sum, t) => sum + parseFloat(t.valor), 0),
          despesas: previousTransactions
            .filter((t) => t.tipo === "saida")
            .reduce((sum, t) => sum + parseFloat(t.valor), 0),
        }
      : { receitas: 0, despesas: 0 };

    const saldo = current.receitas - current.despesas;
    const previousSaldo = previous.receitas - previous.despesas;

    // Calculate faturas do cartão
    const faturasCartao =
      cardsOverview && Array.isArray(cardsOverview)
        ? cardsOverview.reduce(
            (sum: number, card: any) =>
              sum + parseFloat(card.faturaAtual || card.limiteUsado || "0"),
            0
          )
        : 0;

    // Calculate variations
    const calculateVariation = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      receitas: current.receitas,
      despesas: current.despesas,
      saldo,
      faturasCartao,
      variacaoReceitas: calculateVariation(current.receitas, previous.receitas),
      variacaoDespesas: calculateVariation(current.despesas, previous.despesas),
      variacaoSaldo: calculateVariation(saldo, previousSaldo),
    };
  };

  const stats = calculateStats();

  return {
    ...stats,
    isLoading: loadingCurrent,
  };
}

