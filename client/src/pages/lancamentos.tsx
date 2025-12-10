import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePeriod } from "@/contexts/PeriodContext";
import { ArrowDownCircle, ArrowUpCircle, Wallet, Clock, TrendingUp } from "lucide-react";
import { DashboardContainer } from "@/components/dashboard/DashboardContainer";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { QuickTransactionDialog } from "@/components/dashboard/QuickTransactionDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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

  // Calculate KPIs based on new status fields
  const calculateKPIs = () => {
    if (!transactions) {
      return {
        receitasPaid: 0,
        despesasPaid: 0,
        saldoReal: 0,
        aPagar: 0,
        aReceber: 0,
      };
    }

    // Filter by status and type
    const incomesPaid = transactions.filter(
      (t) => t.tipo === "entrada" && (t.status === "paid" || !t.status)
    );
    const incomesPending = transactions.filter(
      (t) => t.tipo === "entrada" && t.status === "pending" && t.pendingKind === "to_receive"
    );
    const expensesPaid = transactions.filter(
      (t) => t.tipo === "saida" && (t.status === "paid" || !t.status)
    );
    const expensesPending = transactions.filter(
      (t) => t.tipo === "saida" && t.status === "pending" && t.pendingKind === "to_pay"
    );

    // Calculate totals
    const receitasPaid = incomesPaid.reduce((sum, t) => sum + parseFloat(t.valor), 0);
    const despesasPaid = expensesPaid.reduce((sum, t) => sum + parseFloat(t.valor), 0);
    const aReceber = incomesPending.reduce((sum, t) => sum + parseFloat(t.valor), 0);
    const aPagar = expensesPending.reduce((sum, t) => sum + parseFloat(t.valor), 0);
    const saldoReal = receitasPaid - despesasPaid;

    return {
      receitasPaid,
      despesasPaid,
      saldoReal,
      aPagar,
      aReceber,
    };
  };

  const kpis = calculateKPIs();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <DashboardContainer>
      <div className="space-y-4 sm:space-y-6 pb-24">
        {/* KPIs Grid 2x2 estilo MeuSimplifique */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Receita */}
          <Card className="rounded-[20px] border bg-card p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <ArrowDownCircle className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Receita</p>
            {isLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <p className="text-xl sm:text-2xl font-bold text-foreground">
                {formatCurrency(kpis.receitasPaid)}
              </p>
            )}
          </Card>

          {/* Despesa */}
          <Card className="rounded-[20px] border bg-card p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <ArrowUpCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Despesa</p>
            {isLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <p className="text-xl sm:text-2xl font-bold text-foreground">
                {formatCurrency(kpis.despesasPaid)}
              </p>
            )}
          </Card>

          {/* A pagar */}
          <Card className="rounded-[20px] border bg-card p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-1">A pagar</p>
            {isLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <p className="text-xl sm:text-2xl font-bold text-foreground">
                {formatCurrency(kpis.aPagar)}
              </p>
            )}
          </Card>

          {/* A receber */}
          <Card className="rounded-[20px] border bg-card p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-1">A receber</p>
            {isLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <p className="text-xl sm:text-2xl font-bold text-foreground">
                {formatCurrency(kpis.aReceber)}
              </p>
            )}
          </Card>
        </div>

        {/* Saldo Card (full width) */}
        <Card className="rounded-[20px] border bg-card p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Saldo</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  <p className={cn(
                    "text-xl sm:text-2xl font-bold",
                    kpis.saldoReal >= 0 ? "text-emerald-600" : "text-red-600"
                  )}>
                    {formatCurrency(kpis.saldoReal)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

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
                        {/* Status badge */}
                        {transaction.status === "pending" && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              transaction.pendingKind === "to_receive"
                                ? "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800"
                                : "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800"
                            )}
                          >
                            {transaction.pendingKind === "to_receive" ? "A receber" : "A pagar"}
                          </Badge>
                        )}
                        {(!transaction.status || transaction.status === "paid") && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                          >
                            Pago
                          </Badge>
                        )}
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

