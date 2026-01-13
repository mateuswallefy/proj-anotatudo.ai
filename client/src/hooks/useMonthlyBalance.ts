import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useDashboardPeriod } from "./useDashboardPeriod";
import { apiRequest } from "@/lib/queryClient";

export function useMonthlyBalance() {
  const { dateRange } = useDashboardPeriod();

  // Format dates for API
  const startDate = format(dateRange.start, "yyyy-MM-dd");
  const endDate = format(dateRange.end, "yyyy-MM-dd");

  const { data = [], isLoading } = useQuery({
    queryKey: ["/api/dashboard/chart-data", { startDate, endDate }],
    queryFn: async () => {
      try {
        const response = await apiRequest(
          "GET",
          `/api/dashboard/chart-data?startDate=${startDate}&endDate=${endDate}`
        );
        return response.json();
      } catch {
        return [];
      }
    },
  });

  return { data, isLoading };
}
