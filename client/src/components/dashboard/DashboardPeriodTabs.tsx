import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDashboardPeriod } from "@/hooks/useDashboardPeriod";

export function DashboardPeriodTabs() {
  const { periodType, setPeriodType } = useDashboardPeriod();

  return (
    <div className="flex items-center gap-2 bg-muted rounded-full p-1">
      <Button
        variant={periodType === "mensal" ? "default" : "ghost"}
        size="sm"
        onClick={() => setPeriodType("mensal")}
        className={cn(
          "rounded-full px-4 transition-all",
          periodType === "mensal" 
            ? "bg-[#F39200] hover:bg-[#D87E00] text-white shadow-sm" 
            : "hover:bg-muted-foreground/10"
        )}
      >
        Mensal
      </Button>
      <Button
        variant={periodType === "semanal" ? "default" : "ghost"}
        size="sm"
        onClick={() => setPeriodType("semanal")}
        className={cn(
          "rounded-full px-4 transition-all",
          periodType === "semanal" 
            ? "bg-[#F39200] hover:bg-[#D87E00] text-white shadow-sm" 
            : "hover:bg-muted-foreground/10"
        )}
      >
        Semanal
      </Button>
      <Button
        variant={periodType === "diario" ? "default" : "ghost"}
        size="sm"
        onClick={() => setPeriodType("diario")}
        className={cn(
          "rounded-full px-4 transition-all",
          periodType === "diario" 
            ? "bg-[#F39200] hover:bg-[#D87E00] text-white shadow-sm" 
            : "hover:bg-muted-foreground/10"
        )}
      >
        Diário
      </Button>
    </div>
  );
}

