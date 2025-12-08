import { useQuery } from "@tanstack/react-query";
import { usePeriod } from "@/contexts/PeriodContext";
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
  const { period } = usePeriod();

  // Parse period
  const [year, month] = period
    ? period.split("-").map(Number)
    : [new Date().getFullYear(), new Date().getMonth() + 1];

  // Fetch current period transactions
  const { data: transactions, isLoading: loadingCurrent } = useQuery<
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

  // Fetch previous period for comparison
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

  // Fetch cards overview for invoices
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

