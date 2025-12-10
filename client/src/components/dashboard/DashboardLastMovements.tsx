import { ArrowDownCircle, ArrowUpCircle, PiggyBank, ChevronRight } from "lucide-react";
import { useTransactionsSummary } from "@/hooks/useTransactionsSummary";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { cn } from "@/lib/utils";

export function DashboardLastMovements() {
  const [, setLocation] = useLocation();
  const { recent, isLoading } = useTransactionsSummary(5);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getTransactionIcon = (tipo: string) => {
    switch (tipo) {
      case "entrada":
        return <ArrowDownCircle className="h-5 w-5 text-emerald-600" />;
      case "economia":
        return <PiggyBank className="h-5 w-5 text-blue-600" />;
      default:
        return <ArrowUpCircle className="h-5 w-5 text-pink-600" />;
    }
  };

  const getTransactionColor = (tipo: string) => {
    switch (tipo) {
      case "entrada":
        return "text-emerald-600";
      case "economia":
        return "text-blue-600";
      default:
        return "text-pink-600";
    }
  };

  const getTransactionBg = (tipo: string) => {
    switch (tipo) {
      case "entrada":
        return "bg-emerald-50 dark:bg-emerald-950/20";
      case "economia":
        return "bg-blue-50 dark:bg-blue-950/20";
      default:
        return "bg-pink-50 dark:bg-pink-950/20";
    }
  };

  if (isLoading) {
    return (
      <Card className="rounded-[20px]">
        <CardContent className="p-4 sm:p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
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
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Últimas Movimentações</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/transacoes")}
            className="text-xs gap-1"
          >
            Ver mais
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>

        {recent.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ArrowDownCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium mb-1">
              Nenhuma movimentação recente
            </p>
            <p className="text-xs text-muted-foreground">
              Suas transações aparecerão aqui
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((transaction) => (
              <div
                key={transaction.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-muted/50",
                  getTransactionBg(transaction.tipo)
                )}
              >
                <div className="flex-shrink-0">
                  {getTransactionIcon(transaction.tipo)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {transaction.descricao || transaction.categoria}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(transaction.dataReal), "d 'de' MMM", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      getTransactionColor(transaction.tipo)
                    )}
                  >
                    {transaction.tipo === "entrada" ? "+" : "-"}
                    {formatCurrency(parseFloat(transaction.valor))}
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

