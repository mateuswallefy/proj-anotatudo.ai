import { useQuery } from "@tanstack/react-query";
import { usePeriod } from "@/contexts/PeriodContext";

export function useCategorySpending() {
  const { period } = usePeriod();

  const { data = [], isLoading } = useQuery({
    queryKey: ["/api/analytics/expenses-by-category", { period }],
    queryFn: async () => {
      const response = await fetch(
        `/api/analytics/expenses-by-category?period=${period}`,
        { credentials: "include" }
      );
      if (!response.ok) return [];
      const data = await response.json();
      return data.map((item: any) => ({
        categoria: item.categoria,
        valor: parseFloat(item.total || 0),
        percentual: parseFloat(item.percentual || 0),
      }));
    },
  });

  return { data, isLoading };
}
