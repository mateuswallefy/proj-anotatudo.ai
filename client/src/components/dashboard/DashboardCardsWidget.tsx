import { CreditCard, Plus, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTab } from "@/contexts/TabContext";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import type { Cartao } from "@shared/schema";

export function DashboardCardsWidget() {
  const { setActiveTab } = useTab();

  const { data: cards, isLoading } = useQuery<Cartao[]>({
    queryKey: ["/api/cartoes"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/cartoes");
        return response.json();
      } catch {
        return [];
      }
    },
  });

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(parseFloat(value));
  };

  const calculatePercentage = (used: string, total: string) => {
    const usedNum = parseFloat(used);
    const totalNum = parseFloat(total);
    if (totalNum === 0) return 0;
    return (usedNum / totalNum) * 100;
  };

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-card to-card/80">
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

  const displayCards = cards?.slice(0, 3) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-card via-card to-card/90 overflow-hidden relative h-full">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-full blur-3xl" />

        <CardContent className="p-5 sm:p-6 relative">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/10">
                <CreditCard className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Meus Cartões</h3>
                <p className="text-xs text-muted-foreground">Limites e faturas</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("contas")}
              className="text-xs h-8 px-2 hover:bg-muted/50"
            >
              Ver mais
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>

          {displayCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="p-4 rounded-2xl bg-muted/30 mb-4">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Nenhum cartão cadastrado
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Adicione um cartão para começar
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("contas")}
                className="mt-4 gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar cartão
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {displayCards.map((card, index) => {
                const percent = calculatePercentage(
                  card.limiteUsado || "0",
                  card.limiteTotal
                );
                const statusColor =
                  percent >= 70
                    ? "text-rose-500"
                    : percent >= 50
                    ? "text-amber-500"
                    : "text-emerald-500";
                const statusBg =
                  percent >= 70
                    ? "bg-rose-500"
                    : percent >= 50
                    ? "bg-amber-500"
                    : "bg-emerald-500";

                return (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                    onClick={() => setActiveTab("contas")}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-[#005CA9] to-[#F39200] rounded-xl flex items-center justify-center flex-shrink-0">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {card.nomeCartao}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(card.limiteUsado || "0")} de{" "}
                        {formatCurrency(card.limiteTotal)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <p className={`text-sm font-bold ${statusColor}`}>
                        {percent.toFixed(0)}%
                      </p>
                      <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${statusBg} rounded-full transition-all`}
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

