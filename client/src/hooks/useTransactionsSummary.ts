import { useQuery } from "@tanstack/react-query";
import { usePeriod } from "@/contexts/PeriodContext";
import type { Transacao } from "@shared/schema";

interface TransactionSummary {
  recent: Transacao[];
  total: number;
  isLoading: boolean;
}

export function useTransactionsSummary(limit: number = 5): TransactionSummary {
  const { period } = usePeriod();

  const { data: transactions, isLoading } = useQuery<Transacao[]>({
    queryKey: ["/api/transacoes", { period }],
    queryFn: async () => {
      const response = await fetch(`/api/transacoes?period=${period}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
  });

  return {
    recent: transactions?.slice(0, limit) || [],
    total: transactions?.length || 0,
    isLoading,
  };
}

