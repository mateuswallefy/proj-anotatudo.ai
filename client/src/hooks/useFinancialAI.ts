import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePeriod } from "@/contexts/PeriodContext";
import { apiRequest } from "@/lib/queryClient";
import {
  analyzeFinancialHealth,
  generateFinancialInsights,
  type FinancialHealth,
  type FinancialInsight,
} from "@/lib/financialAI";
import type { Transacao } from "@shared/schema";

export function useFinancialAI() {
  const { period } = usePeriod();

  // Parse period
  const currentPeriod = useMemo(() => {
    if (!period) {
      const now = new Date();
      return { month: now.getMonth() + 1, year: now.getFullYear() };
    }
    const [year, month] = period.split("-").map(Number);
    return { month, year };
  }, [period]);

  // Fetch transactions
  const { data: transactions = [], isLoading } = useQuery<Transacao[]>({
    queryKey: ["/api/transacoes", { period }],
    queryFn: async () => {
      const queryString = period ? `?period=${period}` : "";
      const response = await apiRequest("GET", `/api/transacoes${queryString}`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!period,
  });

  // Calculate financial health
  const health: FinancialHealth | null = useMemo(() => {
    if (!transactions.length || isLoading) return null;
    return analyzeFinancialHealth(transactions, currentPeriod);
  }, [transactions, currentPeriod, isLoading]);

  // Generate insights
  const insights: FinancialInsight[] = useMemo(() => {
    if (!transactions.length || isLoading) return [];
    return generateFinancialInsights(transactions, currentPeriod);
  }, [transactions, currentPeriod, isLoading]);

  return {
    health,
    insights,
    isLoading,
    transactions,
  };
}
