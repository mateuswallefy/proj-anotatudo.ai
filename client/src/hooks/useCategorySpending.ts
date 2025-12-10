import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useDashboardPeriod } from "./useDashboardPeriod";

export function useCategorySpending() {
  const { dateRange } = useDashboardPeriod();

  // Format dates for API
  const startDate = format(dateRange.start, "yyyy-MM-dd");
  const endDate = format(dateRange.end, "yyyy-MM-dd");

  const { data = [], isLoading } = useQuery({
    queryKey: ["/api/analytics/expenses-by-category", { startDate, endDate }],
    queryFn: async () => {
      const response = await fetch(
        `/api/analytics/expenses-by-category?startDate=${startDate}&endDate=${endDate}`,
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
