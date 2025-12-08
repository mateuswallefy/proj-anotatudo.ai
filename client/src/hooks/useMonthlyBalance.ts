import { useQuery } from "@tanstack/react-query";
import { usePeriod } from "@/contexts/PeriodContext";

export function useMonthlyBalance() {
  const { period } = usePeriod();

  const { data = [], isLoading } = useQuery({
    queryKey: ["/api/dashboard/chart-data", { period }],
    queryFn: async () => {
      const response = await fetch(
        `/api/dashboard/chart-data?period=${period}`,
        { credentials: "include" }
      );
      if (!response.ok) return [];
      return response.json();
    },
  });

  return { data, isLoading };
}
