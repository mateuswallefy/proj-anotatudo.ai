import { Calendar, CreditCard } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { usePeriod } from "@/contexts/PeriodContext";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import type { Cartao } from "@shared/schema";

export function DashboardAgendaWidget() {
  const { period } = usePeriod();
  const [year, month] = period
    ? period.split("-").map(Number)
    : [new Date().getFullYear(), new Date().getMonth() + 1];

  const { data: cards, isLoading } = useQuery<Cartao[]>({
    queryKey: ["/api/cartoes"],
    queryFn: async () => {
      const response = await fetch("/api/cartoes", {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Calculate upcoming due dates
  const getUpcomingDates = () => {
    if (!cards || cards.length === 0) return [];

    const today = new Date();
    const upcoming: Array<{
      card: Cartao;
      dueDate: Date;
      type: "vencimento" | "fechamento";
    }> = [];

    cards.forEach((card) => {
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;

      // Due date
      const dueDate = new Date(
        currentYear,
        currentMonth - 1,
        card.diaVencimento
      );
      if (dueDate >= today) {
        upcoming.push({ card, dueDate, type: "vencimento" });
      }

      // Closing date
      const closingDate = new Date(
        currentYear,
        currentMonth - 1,
        card.diaFechamento
      );
      if (closingDate >= today) {
        upcoming.push({ card, dueDate: closingDate, type: "fechamento" });
      }
    });

    return upcoming
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
      .slice(0, 5);
  };

  const upcoming = getUpcomingDates();

  if (isLoading) {
    return (
      <Card className="rounded-[20px]">
        <CardContent className="p-4 sm:p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[20px]">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Agenda Financeira</h3>
        </div>

        {upcoming.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium mb-1">Nenhum evento próximo</p>
            <p className="text-xs text-muted-foreground">
              Seus vencimentos aparecerão aqui
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((item, index) => (
              <div
                key={`${item.card.id}-${item.type}-${index}`}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.card.nomeCartao}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.type === "vencimento" ? "Vencimento" : "Fechamento"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {format(item.dueDate, "d MMM", { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

