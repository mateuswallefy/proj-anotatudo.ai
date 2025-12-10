import { useState } from "react";
import { usePeriod } from "@/contexts/PeriodContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PeriodType = "mensal" | "semanal" | "diario";

export function DashboardPeriodTabs() {
  const { period, goToCurrentMonth } = usePeriod();
  const [activeTab, setActiveTab] = useState<PeriodType>("mensal");

  // For now, we'll keep monthly as default since the PeriodContext is monthly-based
  // Weekly and daily views would require additional implementation

  return (
    <div className="flex items-center gap-2 bg-muted rounded-full p-1">
      <Button
        variant={activeTab === "mensal" ? "default" : "ghost"}
        size="sm"
        onClick={() => {
          setActiveTab("mensal");
          goToCurrentMonth();
        }}
        className={cn(
          "rounded-full px-4",
          activeTab === "mensal" && "bg-[#005CA9] hover:bg-[#003f73] text-white shadow-sm"
        )}
      >
        Mensal
      </Button>
      <Button
        variant={activeTab === "semanal" ? "default" : "ghost"}
        size="sm"
        onClick={() => setActiveTab("semanal")}
        className={cn(
          "rounded-full px-4",
          activeTab === "semanal" && "bg-[#005CA9] hover:bg-[#003f73] text-white shadow-sm"
        )}
        disabled
      >
        Semanal
      </Button>
      <Button
        variant={activeTab === "diario" ? "default" : "ghost"}
        size="sm"
        onClick={() => setActiveTab("diario")}
        className={cn(
          "rounded-full px-4",
          activeTab === "diario" && "bg-[#005CA9] hover:bg-[#003f73] text-white shadow-sm"
        )}
        disabled
      >
        Diário
      </Button>
    </div>
  );
}

