import {
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  ChevronRight,
  MoreHorizontal,
  Receipt,
} from "lucide-react";
import { useTransactionsSummary } from "@/hooks/useTransactionsSummary";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getCategoryColor, getCategoryIcon } from "@/lib/categoryColors";

export function DashboardLastMovements() {
  const [, setLocation] = useLocation();
  const { recent, isLoading } = useTransactionsSummary(5);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getTransactionConfig = (tipo: string) => {
    switch (tipo) {
      case "entrada":
        return {
          icon: ArrowDownLeft,
          color: "text-emerald-500",
          bg: "bg-emerald-500/10",
          label: "Receita",
        };
      case "economia":
        return {
          icon: PiggyBank,
          color: "text-blue-500",
          bg: "bg-blue-500/10",
          label: "Economia",
        };
      default:
        return {
          icon: ArrowUpRight,
          color: "text-rose-500",
          bg: "bg-rose-500/10",
          label: "Despesa",
        };
    }
  };

  if (isLoading) {
    return (
      <Card className="rounded-[24px] border-0 shadow-xl bg-gradient-to-br from-card to-card/80">
        <CardContent className="p-5 sm:p-6">
          <Skeleton className="h-7 w-48 mb-5" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1.5" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
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
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="rounded-[24px] border-0 shadow-xl bg-gradient-to-br from-card via-card to-card/90 overflow-hidden relative h-full">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-violet-500/5 to-transparent rounded-full blur-3xl" />

        <CardContent className="p-5 sm:p-6 relative">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/10">
                <Receipt className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Movimentações</h3>
                <p className="text-xs text-muted-foreground">Últimas transações</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/transacoes")}
              className="text-xs h-8 px-2 hover:bg-muted/50"
            >
              Ver todas
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>

          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="p-4 rounded-2xl bg-muted/30 mb-4">
                <Receipt className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Nenhuma movimentação
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Suas transações aparecerão aqui
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setLocation("/transacoes")}
              >
                Adicionar transação
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {recent.map((transaction, index) => {
                const config = getTransactionConfig(transaction.tipo);
                const Icon = config.icon;
                const categoryColor = getCategoryColor(transaction.categoria || "Outros", index);
                const CategoryIcon = getCategoryIcon(transaction.categoria || "Outros");

                return (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-all cursor-pointer group"
                    onClick={() => setLocation("/transacoes")}
                  >
                    {/* Icon with category color */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                      style={{ backgroundColor: categoryColor.bg }}
                    >
                      <CategoryIcon
                        className="h-5 w-5"
                        style={{ color: categoryColor.main }}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {transaction.descricao || transaction.categoria || "Transação"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={cn(
                            "text-[10px] font-medium px-1.5 py-0.5 rounded",
                            config.bg,
                            config.color
                          )}
                        >
                          {config.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(transaction.dataReal), "dd MMM", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Value */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <p
                        className={cn(
                          "text-sm font-bold tabular-nums",
                          config.color
                        )}
                      >
                        {transaction.tipo === "entrada" ? "+" : "-"}
                        {formatCurrency(parseFloat(transaction.valor))}
                      </p>
                      <Icon className={cn("h-3.5 w-3.5", config.color)} />
                    </div>
                  </motion.div>
                );
              })}

              {/* View more button at bottom */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="pt-2"
              >
                <Button
                  variant="ghost"
                  className="w-full h-9 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  onClick={() => setLocation("/transacoes")}
                >
                  <MoreHorizontal className="h-4 w-4 mr-2" />
                  Ver todas as transações
                </Button>
              </motion.div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
