import { Calendar, CreditCard, AlertCircle, Clock, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { usePeriod } from "@/contexts/PeriodContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format, differenceInDays, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { motion } from "framer-motion";
import { useTab } from "@/contexts/TabContext";
import { cn } from "@/lib/utils";
import type { Cartao } from "@shared/schema";

export function DashboardAgendaWidget() {
  const { setActiveTab } = useTab();
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
      daysUntil: number;
    }> = [];

    cards.forEach((card) => {
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();

      // Due date (this month and next)
      for (let monthOffset = 0; monthOffset <= 1; monthOffset++) {
        const dueDate = new Date(
          currentYear,
          currentMonth + monthOffset,
          card.diaVencimento
        );
        const daysUntil = differenceInDays(dueDate, today);
        if (daysUntil >= 0 && daysUntil <= 30) {
          upcoming.push({ card, dueDate, type: "vencimento", daysUntil });
        }

        // Closing date
        const closingDate = new Date(
          currentYear,
          currentMonth + monthOffset,
          card.diaFechamento
        );
        const daysUntilClosing = differenceInDays(closingDate, today);
        if (daysUntilClosing >= 0 && daysUntilClosing <= 30) {
          upcoming.push({ card, dueDate: closingDate, type: "fechamento", daysUntil: daysUntilClosing });
        }
      }
    });

    // Remove duplicates and sort
    const uniqueUpcoming = upcoming.filter((item, index, self) =>
      index === self.findIndex((t) =>
        t.card.id === item.card.id && t.type === item.type && t.dueDate.getTime() === item.dueDate.getTime()
      )
    );

    return uniqueUpcoming
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 4);
  };

  const upcoming = getUpcomingDates();

  const getDateLabel = (date: Date, daysUntil: number) => {
    if (isToday(date)) return "Hoje";
    if (isTomorrow(date)) return "Amanhã";
    if (daysUntil <= 7) return `Em ${daysUntil} dias`;
    return format(date, "d 'de' MMM", { locale: ptBR });
  };

  const getUrgencyColor = (daysUntil: number, type: string) => {
    if (type === "vencimento") {
      if (daysUntil === 0) return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      if (daysUntil <= 3) return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    }
    return "bg-blue-500/10 text-blue-500 border-blue-500/20";
  };

  const getUrgencyIcon = (daysUntil: number, type: string) => {
    if (type === "vencimento" && daysUntil <= 3) {
      return <AlertCircle className="h-4 w-4" />;
    }
    return <Clock className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <Card className="rounded-[24px] border-0 shadow-xl bg-gradient-to-br from-card to-card/80">
        <CardContent className="p-5 sm:p-6">
          <Skeleton className="h-7 w-40 mb-5" />
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="rounded-[24px] border-0 shadow-xl bg-gradient-to-br from-card via-card to-card/90 overflow-hidden relative h-full">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-full blur-3xl" />

        <CardContent className="p-5 sm:p-6 relative">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Agenda</h3>
                <p className="text-xs text-muted-foreground">Próximos vencimentos</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("contas")}
              className="text-xs h-8 px-2 hover:bg-muted/50"
            >
              Ver cartões
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>

          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="p-4 rounded-2xl bg-muted/30 mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Nenhum vencimento próximo
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Cadastre seus cartões para acompanhar
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcoming.map((item, index) => (
                <motion.div
                  key={`${item.card.id}-${item.type}-${item.dueDate.getTime()}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => setActiveTab("contas")}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border",
                      getUrgencyColor(item.daysUntil, item.type)
                    )}
                  >
                    <CreditCard className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {item.card.nomeCartao}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      {getUrgencyIcon(item.daysUntil, item.type)}
                      <span>
                        {item.type === "vencimento" ? "Vencimento" : "Fechamento"}
                      </span>
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p
                      className={cn(
                        "text-sm font-bold",
                        item.daysUntil === 0 && item.type === "vencimento"
                          ? "text-rose-500"
                          : item.daysUntil <= 3 && item.type === "vencimento"
                            ? "text-amber-500"
                            : "text-foreground"
                      )}
                    >
                      {getDateLabel(item.dueDate, item.daysUntil)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(item.dueDate, "dd/MM", { locale: ptBR })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
