import { CreditCard, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTab } from "@/contexts/TabContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import type { Cartao } from "@shared/schema";

export function DashboardCardsWidget() {
  const { setActiveTab } = useTab();

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
      <Card className="rounded-[20px]">
        <CardContent className="p-4 sm:p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayCards = cards?.slice(0, 3) || [];

  return (
    <Card className="rounded-[20px]">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Meus Cartões</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("contas")}
            className="text-xs"
          >
            Ver mais
          </Button>
        </div>

        {displayCards.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium mb-1">Nenhum cartão cadastrado</p>
            <p className="text-xs text-muted-foreground mb-4">
              Adicione um cartão para começar
            </p>
            <Button
              size="sm"
              onClick={() => setActiveTab("contas")}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar cartão
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {displayCards.map((card) => {
              const percent = calculatePercentage(
                card.limiteUsado || "0",
                card.limiteTotal
              );
              const statusColor =
                percent >= 70
                  ? "text-red-600"
                  : percent >= 50
                  ? "text-orange-600"
                  : "text-emerald-600";

              return (
                <div
                  key={card.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#005CA9] to-[#F39200] rounded-xl flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{card.nomeCartao}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(card.limiteUsado || "0")} de{" "}
                        {formatCurrency(card.limiteTotal)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${statusColor}`}>
                      {percent.toFixed(0)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

