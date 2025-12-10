import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { X, Lightbulb, Calendar } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DashboardPeriodTabs } from "./DashboardPeriodTabs";

export function DashboardHeader() {
  const { user } = useAuth();
  const [dismissedTip, setDismissedTip] = useState(
    localStorage.getItem("dashboard-tip-dismissed") === "true"
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const formatDate = () => {
    return format(new Date(), "EEEE, d 'de' MMM. yyyy", { locale: ptBR });
  };

  const handleDismissTip = () => {
    setDismissedTip(true);
    localStorage.setItem("dashboard-tip-dismissed", "true");
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Greeting */}
      <div>
        <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground">
          {getGreeting()}, {user?.firstName || "Usuário"}
        </h1>
      </div>

      {/* Calendar and Date */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 text-[#F39200]" />
          <span className="capitalize">{formatDate()}</span>
        </div>
        <DashboardPeriodTabs />
      </div>

      {/* Tip Banner with Astro */}
      {!dismissedTip && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border border-blue-200 dark:border-blue-800 rounded-[20px] p-4 flex items-start gap-3 relative">
          {/* Astro Avatar */}
          <div className="flex-shrink-0 w-12 h-12 bg-[#005CA9] rounded-[20px] flex items-center justify-center shadow-sm">
            <span className="text-white text-xl">⭐</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm">Dica do dia</h3>
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 h-6 w-6"
                onClick={handleDismissTip}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Organize suas finanças categorizando todas as transações. Isso
              ajuda a entender melhor seus gastos!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
