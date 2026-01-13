import { useQuery } from "@tanstack/react-query";
import { usePeriod } from "@/contexts/PeriodContext";
import { apiRequest } from "@/lib/queryClient";
import type { Transacao } from "@shared/schema";

interface TransactionSummary {
  recent: Transacao[];
  total: number;
  isLoading: boolean;
}

export function useTransactionsSummary(limit: number = 5): TransactionSummary {
  const { period } = usePeriod();
  const isDev = import.meta.env.DEV;

  const { data: transactions, isLoading } = useQuery<Transacao[]>({
    queryKey: ["/api/transacoes", { period }],
    queryFn: async () => {
      if (isDev) {
        console.log("[useTransactionsSummary] Buscando transações para período:", period);
      }
      
      const response = await apiRequest("GET", `/api/transacoes?period=${period}`);
      const data = await response.json();
      
      if (isDev) {
        console.log("[useTransactionsSummary] Transações recebidas:", data.length);
      }
      
      return data;
    },
    enabled: !!period,
  });

  if (isDev && transactions !== undefined) {
    console.log("[useTransactionsSummary] Estado:", {
      period,
      count: transactions?.length || 0,
      isLoading,
    });
  }

  return {
    recent: transactions?.slice(0, limit) || [],
    total: transactions?.length || 0,
    isLoading,
  };
}

