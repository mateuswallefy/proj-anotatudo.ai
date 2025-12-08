import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { X, Lightbulb } from "lucide-react";
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
    <div className="space-y-4">
      {/* Greeting and Date */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {getGreeting()}, {user?.firstName || "Usuário"}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1 capitalize">
            {formatDate()}
          </p>
        </div>
        <DashboardPeriodTabs />
      </div>

      {/* Tip Banner */}
      {!dismissedTip && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
            <Lightbulb className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">Dica do dia</h3>
            <p className="text-sm text-muted-foreground">
              Organize suas finanças categorizando todas as transações. Isso
              ajuda a entender melhor seus gastos!
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-8 w-8"
            onClick={handleDismissTip}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
