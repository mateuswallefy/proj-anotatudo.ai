import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePeriod } from "@/contexts/PeriodContext";
import { ArrowDownCircle, ArrowUpCircle, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { DashboardContainer } from "@/components/dashboard/DashboardContainer";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { QuickTransactionDialog } from "@/components/dashboard/QuickTransactionDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import type { TransactionFilters as FilterType } from "@/types/financial";
import type { Transacao } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { cn } from "@/lib/utils";

export default function Lancamentos() {
  const { period } = usePeriod();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"entrada" | "saida" | undefined>();
  const [filters, setFilters] = useState<FilterType>({ period });

  const stats = useDashboardStats();

  // Build query string
  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (filters.period) params.set("period", filters.period);
    if (filters.type) params.set("tipo", filters.type);
    if (filters.category) params.set("categoria", filters.category);
    if (filters.accountId) params.set("cartaoId", filters.accountId);
    if (filters.search) params.set("search", filters.search);
    return params.toString();
  };

  const { data: transactions, isLoading } = useQuery<Transacao[]>({
    queryKey: ["/api/transacoes", filters],
    queryFn: async () => {
      const queryString = buildQueryString();
      const response = await fetch(`/api/transacoes?${queryString}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d 'de' MMM", { locale: ptBR });
  };

  const getTransactionIcon = (tipo: string) => {
    switch (tipo) {
      case "entrada":
        return <ArrowDownCircle className="h-5 w-5 text-emerald-600" />;
      default:
        return <ArrowUpCircle className="h-5 w-5 text-pink-600" />;
    }
  };

  const getTransactionColor = (tipo: string) => {
    return tipo === "entrada" ? "text-emerald-600" : "text-pink-600";
  };

  const getTransactionBg = (tipo: string) => {
    return tipo === "entrada"
      ? "bg-emerald-50 dark:bg-emerald-950/20"
      : "bg-pink-50 dark:bg-pink-950/20";
  };

  return (
    <DashboardContainer>
      <div className="space-y-6 pb-24">
        {/* Header */}
        <DashboardHeader />

        {/* Variation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Card className="rounded-2xl border-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Variação Mensal
                    </p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {stats.variacaoReceitas >= 0 ? "+" : ""}
                      {stats.variacaoReceitas.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Comparado ao mês anterior
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Variação Mensal
                    </p>
                    <p className="text-2xl font-bold text-pink-600">
                      {stats.variacaoDespesas >= 0 ? "+" : ""}
                      {stats.variacaoDespesas.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Comparado ao mês anterior
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <DashboardStatCard
            title="Receitas"
            value={stats.receitas}
            variation={stats.variacaoReceitas}
            icon={<ArrowDownCircle className="h-6 w-6" />}
            color="green"
            isLoading={stats.isLoading}
          />
          <DashboardStatCard
            title="Despesas"
            value={stats.despesas}
            variation={stats.variacaoDespesas}
            icon={<ArrowUpCircle className="h-6 w-6" />}
            color="pink"
            isLoading={stats.isLoading}
          />
          <DashboardStatCard
            title="Saldo"
            value={stats.saldo}
            variation={stats.variacaoSaldo}
            icon={<ArrowDownCircle className="h-6 w-6" />}
            color="blue"
            isLoading={stats.isLoading}
          />
          <DashboardStatCard
            title="Total"
            value={transactions?.length || 0}
            variation={0}
            icon={<ArrowUpCircle className="h-6 w-6" />}
            color="orange"
            isLoading={isLoading}
          />
        </div>

        {/* Filters */}
        <TransactionFilters filters={filters} onFiltersChange={setFilters} />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            size="lg"
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white h-14 rounded-xl"
            onClick={() => {
              setTransactionType("entrada");
              setDialogOpen(true);
            }}
          >
            <ArrowDownCircle className="h-5 w-5 mr-2" />
            Adicionar Receita
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="flex-1 border-2 h-14 rounded-xl"
            onClick={() => {
              setTransactionType("saida");
              setDialogOpen(true);
            }}
          >
            <ArrowUpCircle className="h-5 w-5 mr-2" />
            Adicionar Despesa
          </Button>
        </div>

        {/* Transactions List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : transactions && transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <Card
                key={transaction.id}
                className="rounded-xl hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                        getTransactionBg(transaction.tipo)
                      )}
                    >
                      {getTransactionIcon(transaction.tipo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base mb-1 truncate">
                        {transaction.descricao || transaction.categoria}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs text-muted-foreground">
                          {formatDate(transaction.dataReal)}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {transaction.categoria}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p
                        className={cn(
                          "text-lg font-bold font-mono",
                          getTransactionColor(transaction.tipo)
                        )}
                      >
                        {transaction.tipo === "entrada" ? "+" : "-"}
                        {formatCurrency(parseFloat(transaction.valor))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="rounded-2xl">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ArrowDownCircle className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Nenhuma transação encontrada
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {Object.values(filters).some((v) => v && v !== period)
                  ? "Tente ajustar os filtros"
                  : "Comece adicionando sua primeira transação"}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  className="bg-emerald-500 hover:bg-emerald-600"
                  onClick={() => {
                    setTransactionType("entrada");
                    setDialogOpen(true);
                  }}
                >
                  <ArrowDownCircle className="h-5 w-5 mr-2" />
                  Adicionar Receita
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    setTransactionType("saida");
                    setDialogOpen(true);
                  }}
                >
                  <ArrowUpCircle className="h-5 w-5 mr-2" />
                  Adicionar Despesa
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transaction Dialog */}
      <QuickTransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultType={transactionType}
      />
    </DashboardContainer>
  );
}

