import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDashboardPeriod } from "@/hooks/useDashboardPeriod";
import { useQueryClient } from "@tanstack/react-query";

export function DashboardPeriodTabs() {
  const { periodType, setPeriodType } = useDashboardPeriod();
  const queryClient = useQueryClient();

  const handlePeriodChange = (type: "mensal" | "semanal" | "diario") => {
    setPeriodType(type);
    // Invalidate all transaction queries to trigger recalculation
    queryClient.invalidateQueries({ queryKey: ["/api/transacoes"] });
    queryClient.invalidateQueries({ queryKey: ["/api/credit-cards/overview"] });
  };

  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
      <Button
        variant={periodType === "mensal" ? "default" : "ghost"}
        size="sm"
        onClick={() => handlePeriodChange("mensal")}
        className={cn(
          "rounded-lg px-3 sm:px-4 text-xs sm:text-sm h-8 transition-all duration-200",
          periodType === "mensal"
            ? "bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-sm"
            : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
        )}
      >
        Mensal
      </Button>
      <Button
        variant={periodType === "semanal" ? "default" : "ghost"}
        size="sm"
        onClick={() => handlePeriodChange("semanal")}
        className={cn(
          "rounded-lg px-3 sm:px-4 text-xs sm:text-sm h-8 transition-all duration-200",
          periodType === "semanal"
            ? "bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-sm"
            : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
        )}
      >
        Semanal
      </Button>
      <Button
        variant={periodType === "diario" ? "default" : "ghost"}
        size="sm"
        onClick={() => handlePeriodChange("diario")}
        className={cn(
          "rounded-lg px-3 sm:px-4 text-xs sm:text-sm h-8 transition-all duration-200",
          periodType === "diario"
            ? "bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-sm"
            : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
        )}
      >
        Diário
      </Button>
    </div>
  );
}

