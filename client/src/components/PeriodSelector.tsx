import { Button } from "@/components/ui/button";
import { usePeriod } from "@/contexts/PeriodContext";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function PeriodSelector() {
  const { period, goToPrevMonth, goToNextMonth, goToCurrentMonth, isCurrentMonth } = usePeriod();

  const formatPeriodDisplay = (periodStr: string): string => {
    const [year, month] = periodStr.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return format(date, "MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <div className="flex items-center gap-2" data-testid="period-selector">
      <Button
        onClick={goToPrevMonth}
        size="icon"
        variant="outline"
        data-testid="button-prev-month"
        aria-label="Mês anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      <div className="flex items-center gap-2 min-w-[200px] justify-center">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium capitalize" data-testid="period-display">
          {formatPeriodDisplay(period)}
        </span>
      </div>

      <Button
        onClick={goToNextMonth}
        size="icon"
        variant="outline"
        data-testid="button-next-month"
        aria-label="Próximo mês"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>

      {!isCurrentMonth && (
        <Button
          onClick={goToCurrentMonth}
          variant="secondary"
          size="sm"
          data-testid="button-current-month"
        >
          Este mês
        </Button>
      )}
    </div>
  );
}
