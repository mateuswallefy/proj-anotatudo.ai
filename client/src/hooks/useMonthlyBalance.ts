import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useDashboardPeriod } from "./useDashboardPeriod";

export function useMonthlyBalance() {
  const { dateRange } = useDashboardPeriod();

  // Format dates for API
  const startDate = format(dateRange.start, "yyyy-MM-dd");
  const endDate = format(dateRange.end, "yyyy-MM-dd");

  const { data = [], isLoading } = useQuery({
    queryKey: ["/api/dashboard/chart-data", { startDate, endDate }],
    queryFn: async () => {
      const response = await fetch(
        `/api/dashboard/chart-data?startDate=${startDate}&endDate=${endDate}`,
        { credentials: "include" }
      );
      if (!response.ok) return [];
      return response.json();
    },
  });

  return { data, isLoading };
}
