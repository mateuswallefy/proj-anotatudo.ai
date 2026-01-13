import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePeriod } from "@/contexts/PeriodContext";
import { apiRequest } from "@/lib/queryClient";
import { ArrowDownCircle, ArrowUpCircle, Wallet, Clock, TrendingUp, Edit, MoreVertical } from "lucide-react";
import { DashboardContainer } from "@/components/dashboard/DashboardContainer";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { QuickTransactionDialog } from "@/components/dashboard/QuickTransactionDialog";
import { EditTransactionDialog } from "@/components/edit-transaction-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [editingTransaction, setEditingTransaction] = useState<Transacao | null>(null);

  // Sincronizar filters.period com period do contexto quando mudar
  useEffect(() => {
    setFilters((prev) => ({ ...prev, period }));
  }, [period]);

  // Build query string
  const buildQueryString = () => {
    const params = new URLSearchParams();
    // SEMPRE passar period (mesmo que seja o período atual do contexto ou o mês atual como fallback)
    const periodToUse = filters.period || period || (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    })();
    // SEMPRE adicionar period, mesmo que seja o mês atual
    params.set("period", periodToUse);
    if (filters.type) params.set("tipo", filters.type);
    if (filters.category) params.set("categoria", filters.category);
    if (filters.accountId) params.set("cartaoId", filters.accountId);
    if (filters.goalId) params.set("goalId", filters.goalId);
    if (filters.search) params.set("search", filters.search);
    if (filters.minAmount !== undefined) params.set("minAmount", filters.minAmount.toString());
    if (filters.maxAmount !== undefined) params.set("maxAmount", filters.maxAmount.toString());
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    return params.toString();
  };

  const { data: transactions, isLoading, error, refetch } = useQuery<Transacao[]>({
    queryKey: ["/api/transacoes", { ...filters, period: filters.period || period }],
    queryFn: async () => {
      const isDev = import.meta.env.DEV;
      const queryString = buildQueryString();
      const effectivePeriod = filters.period || period;
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/36b56b69-0d80-4b8b-953b-55356f395306',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lancamentos.tsx:67',message:'QueryFn entry - filters and period',data:{filtersPeriod:filters.period,contextPeriod:period,effectivePeriod:effectivePeriod,queryString:queryString,isDev:isDev},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      if (isDev) {
        console.log("═══════════════════════════════════════════════════");
        console.log("[Lancamentos] 🔍 INICIANDO BUSCA DE TRANSAÇÕES");
        console.log("[Lancamentos] Filters completo:", JSON.stringify(filters, null, 2));
        console.log("[Lancamentos] Period do contexto:", period);
        console.log("[Lancamentos] Filters period:", filters.period);
        console.log("[Lancamentos] Query string:", queryString);
      }
      
      const url = `/api/transacoes${queryString ? `?${queryString}` : ''}`;
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/36b56b69-0d80-4b8b-953b-55356f395306',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lancamentos.tsx:81',message:'Before fetch request',data:{url:url,hasCookies:!!document.cookie},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      if (isDev) {
        console.log("[Lancamentos] URL completa:", url);
        console.log("[Lancamentos] Cookies no navegador:", document.cookie);
      }
      
      // Usar apiRequest para garantir fallback automático e credentials corretos
      // apiRequest já trata erros e retorna response válido ou lança exceção
      const response = await apiRequest("GET", url);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/36b56b69-0d80-4b8b-953b-55356f395306',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lancamentos.tsx:94',message:'After apiRequest - response received',data:{status:response.status,statusText:response.statusText,ok:response.ok,contentType:response.headers.get('content-type')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      if (isDev) {
        console.log("[Lancamentos] ✅ Response recebida via apiRequest");
        console.log("[Lancamentos] Response status:", response.status);
        console.log("[Lancamentos] Response URL:", response.url);
      }
      
      let data;
      try {
        data = await response.json();
      } catch (parseError: any) {
        if (isDev) {
          console.error("[Lancamentos] ❌ ERRO AO PARSEAR JSON:", parseError);
        }
        throw new Error("Resposta inválida do servidor");
      }
      
      if (isDev) {
        console.log("[Lancamentos] ✅ JSON parseado com sucesso");
        console.log("[Lancamentos] Tipo de data:", typeof data);
        console.log("[Lancamentos] É array?", Array.isArray(data));
        console.log("[Lancamentos] Transações recebidas:", Array.isArray(data) ? data.length : 'NÃO É ARRAY');
        
        if (Array.isArray(data) && data.length > 0) {
          console.log("[Lancamentos] Primeira transação:", {
            id: data[0].id,
            tipo: data[0].tipo,
            dataReal: data[0].dataReal,
            valor: data[0].valor,
            categoria: data[0].categoria,
            userId: data[0].userId,
          });
        } else if (Array.isArray(data) && data.length === 0) {
          console.warn("[Lancamentos] ⚠️ ARRAY VAZIO - Nenhuma transação encontrada");
        } else {
          console.error("[Lancamentos] ❌ RESPOSTA NÃO É ARRAY:", data);
        }
        console.log("═══════════════════════════════════════════════════");
      }
      
      return Array.isArray(data) ? data : [];
    },
    enabled: true, // Sempre habilitado - buildQueryString garante que sempre tem period
    retry: 1,
    staleTime: 0, // Sempre refetch ao invés de usar cache
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Sempre refetch quando montar
  });

  // Log de renderização para debug
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/36b56b69-0d80-4b8b-953b-55356f395306',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lancamentos.tsx:183',message:'Render state logged',data:{isLoading:isLoading,hasTransactions:!!transactions,transactionsLength:transactions?.length||0,hasError:!!error,errorMessage:error?.message||null,willRenderLoading:isLoading,willRenderList:!!transactions&&transactions.length>0,willRenderEmpty:!!transactions&&transactions.length===0,willRenderError:!!error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
  }, [isLoading, transactions, error]);

  // Sincronizar filters.period com period do contexto quando mudar
  useEffect(() => {
    if (period && filters.period !== period) {
      setFilters((prev) => ({ ...prev, period }));
    }
  }, [period]); // Apenas quando period mudar, não filters (evitar loop)

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

        {/* Debug info em DEV */}
        {import.meta.env.DEV && (
          <Card className="rounded-xl border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 p-4 text-xs">
            <div className="space-y-1">
              <div><strong>Estado da Query:</strong></div>
              <div>Loading: {isLoading ? '✅ Sim' : '❌ Não'}</div>
              <div>Error: {error ? `❌ ${error instanceof Error ? error.message : 'Erro desconhecido'}` : '✅ Nenhum'}</div>
              <div>Transações: {transactions ? `${transactions.length} encontradas` : '⚠️ null/undefined'}</div>
              <div>Period: {period || '⚠️ Não definido'}</div>
              <div>Filters.period: {filters.period || '⚠️ Não definido'}</div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => refetch()} 
                className="mt-2"
              >
                🔄 Forçar Refetch
              </Button>
            </div>
          </Card>
        )}

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
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setEditingTransaction(transaction)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
        onOpenChange={(open) => {
          setDialogOpen(open);
          // Quando fechar o dialog após criar/editar, forçar refetch
          if (!open) {
            refetch();
          }
        }}
        defaultType={transactionType}
      />

      {/* Edit Transaction Dialog */}
      {editingTransaction && (
        <EditTransactionDialog
          transaction={editingTransaction}
          open={!!editingTransaction}
          onOpenChange={(open) => {
            if (!open) {
              setEditingTransaction(null);
              // Forçar refetch ao fechar após editar/excluir
              refetch();
            }
          }}
        />
      )}
    </DashboardContainer>
  );
}

