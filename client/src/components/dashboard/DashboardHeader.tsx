import { useAuth } from "@/hooks/useAuth";
import { X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DashboardPeriodTabs } from "./DashboardPeriodTabs";
import { DashboardCalendar } from "./DashboardCalendar";
import { getGreetingMessage } from "@/lib/greeting";

export function DashboardHeader() {
  const { user } = useAuth();
  const [dismissedTip, setDismissedTip] = useState(
    localStorage.getItem("dashboard-tip-dismissed") === "true"
  );

  const { greeting, emoji } = getGreetingMessage();
  const userName = user?.firstName || "Usuário";

  const handleDismissTip = () => {
    setDismissedTip(true);
    localStorage.setItem("dashboard-tip-dismissed", "true");
  };

  return (
    <div className="space-y-4">
      {/* Greeting - Desktop only */}
      <div className="hidden md:block">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
          {greeting}, {userName}! {emoji}
        </h1>
      </div>

      {/* Mobile Layout: Greeting + Calendar (mesmo eixo vertical, alinhado à esquerda) */}
      <div className="md:hidden">
        {/* Greeting - Mobile only */}
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mt-2 mb-2">
          {greeting}, {userName}! {emoji}
        </h1>
        
        {/* Calendar - abaixo da saudação, mesmo eixo vertical */}
        <div>
          <DashboardCalendar />
        </div>
      </div>

      {/* Desktop: Calendar and Period Tabs */}
      <div className="hidden md:flex md:flex-row md:items-center md:justify-between gap-3">
        <DashboardCalendar />
        <DashboardPeriodTabs />
      </div>

      {/* Mobile: Period Tabs - abaixo do calendar */}
      <div className="md:hidden">
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
