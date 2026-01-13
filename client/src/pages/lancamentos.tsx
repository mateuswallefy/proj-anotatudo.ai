import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePeriod } from "@/contexts/PeriodContext";
import { apiRequest } from "@/lib/queryClient";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  Filter,
  Download,
  Edit,
  MoreVertical,
  FileText,
  CheckCircle2,
  Clock,
  DollarSign,
  ShoppingCart,
} from "lucide-react";
import { PeriodSelector } from "@/components/PeriodSelector";
import { DashboardContainer } from "@/components/dashboard/DashboardContainer";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { QuickTransactionDialog } from "@/components/dashboard/QuickTransactionDialog";
import { EditTransactionDialog } from "@/components/edit-transaction-dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { TransactionFilters as FilterType } from "@/types/financial";
import type { Transacao } from "@shared/schema";
import { format, isToday, isYesterday, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { cn } from "@/lib/utils";

export default function Lancamentos() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/36b56b69-0d80-4b8b-953b-55356f395306',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lancamentos.tsx:41',message:'Lancamentos component rendering',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  let periodResult;
  try {
    periodResult = usePeriod();
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/36b56b69-0d80-4b8b-953b-55356f395306',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lancamentos.tsx:48',message:'usePeriod error',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    throw error;
  }
  
  const { period, goToNextMonth, goToPrevMonth, goToCurrentMonth, isCurrentMonth } = periodResult;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"entrada" | "saida" | undefined>();
  const [filters, setFilters] = useState<FilterType>({ period });
  const [editingTransaction, setEditingTransaction] = useState<Transacao | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/36b56b69-0d80-4b8b-953b-55356f395306',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lancamentos.tsx:57',message:'Lancamentos state initialized',data:{period},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  // Sincronizar filters.period com period do contexto quando mudar
  // Só atualizar se realmente mudou para evitar loops
  useEffect(() => {
    setFilters((prev) => {
      if (prev.period !== period) {
        return { ...prev, period };
      }
      return prev; // Retornar o mesmo objeto se não mudou
    });
  }, [period]);

  // Build query string
  const buildQueryString = () => {
    const params = new URLSearchParams();
    const periodToUse = filters.period || period || (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    })();
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

  // Estabilizar queryKey para evitar refetches desnecessários
  const queryKey = useMemo(() => {
    const periodToUse = filters.period || period;
    return ["/api/transacoes", { ...filters, period: periodToUse }];
  }, [filters, period]);
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/36b56b69-0d80-4b8b-953b-55356f395306',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lancamentos.tsx:92',message:'Before useQuery',data:{filters,period,queryKey},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  
  const { data: transactions, isLoading, error, refetch } = useQuery<Transacao[]>({
    queryKey,
    queryFn: async () => {
      console.log('[lancamentos] Query function executing');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/36b56b69-0d80-4b8b-953b-55356f395306',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lancamentos.tsx:98',message:'Query function executing',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      try {
        const queryString = buildQueryString();
        const url = `/api/transacoes${queryString ? `?${queryString}` : ''}`;
        console.log('[lancamentos] Before apiRequest, url:', url);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/36b56b69-0d80-4b8b-953b-55356f395306',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lancamentos.tsx:105',message:'Before apiRequest',data:{url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        let response: Response;
        try {
          response = await apiRequest("GET", url);
          console.log('[lancamentos] apiRequest completed, status:', response.status, response.ok);
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/36b56b69-0d80-4b8b-953b-55356f395306',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lancamentos.tsx:113',message:'apiRequest completed',data:{status:response.status,ok:response.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
        } catch (apiError) {
          console.error('[lancamentos] apiRequest error:', apiError);
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/36b56b69-0d80-4b8b-953b-55356f395306',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lancamentos.tsx:118',message:'apiRequest error',data:{error:apiError instanceof Error?apiError.message:String(apiError)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          throw apiError;
        }
        
        let data;
        try {
          data = await response.json();
          console.log('[lancamentos] JSON parsed, isArray:', Array.isArray(data), 'length:', Array.isArray(data) ? data.length : 0);
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/36b56b69-0d80-4b8b-953b-55356f395306',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lancamentos.tsx:126',message:'JSON parsed',data:{isArray:Array.isArray(data),length:Array.isArray(data)?data.length:0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
        } catch (jsonError) {
          console.error('[lancamentos] JSON parse error:', jsonError);
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/36b56b69-0d80-4b8b-953b-55356f395306',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lancamentos.tsx:131',message:'JSON parse error',data:{error:jsonError instanceof Error?jsonError.message:String(jsonError)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          throw jsonError;
        }
        
        const result = Array.isArray(data) ? data : [];
        console.log('[lancamentos] Query function success, returning', result.length, 'transactions');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/36b56b69-0d80-4b8b-953b-55356f395306',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lancamentos.tsx:137',message:'Query function success',data:{resultLength:result.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        return result;
      } catch (queryError) {
        console.error('[lancamentos] Query function error:', queryError);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/36b56b69-0d80-4b8b-953b-55356f395306',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lancamentos.tsx:142',message:'Query function error',data:{error:queryError instanceof Error?queryError.message:String(queryError),stack:queryError instanceof Error?queryError.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        throw queryError;
      }
    },
    enabled: true,
    retry: 1,
    staleTime: 30000, // 30 segundos - evitar refetches muito frequentes
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Mudar para false para evitar refetch a cada mount
  });
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/36b56b69-0d80-4b8b-953b-55356f395306',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lancamentos.tsx:100',message:'After useQuery',data:{isLoading,hasError:!!error,transactionsCount:transactions?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion

  // Agrupar transações por data
  const groupedTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const grouped: { date: Date; transactions: Transacao[]; total: number }[] = [];
    const dateMap = new Map<string, Transacao[]>();

    transactions.forEach((transaction) => {
      const date = parseISO(transaction.dataReal);
      const dateKey = format(date, "yyyy-MM-dd");
      
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      dateMap.get(dateKey)!.push(transaction);
    });

    // Ordenar por data (mais recente primeiro)
    const sortedDates = Array.from(dateMap.keys()).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    sortedDates.forEach((dateKey) => {
      const date = new Date(dateKey);
      const dayTransactions = dateMap.get(dateKey)!;
      const total = dayTransactions.reduce((sum, t) => {
        const value = parseFloat(t.valor);
        return sum + (t.tipo === "entrada" ? value : -value);
      }, 0);

      grouped.push({
        date,
        transactions: dayTransactions.sort((a, b) => 
          new Date(b.dataReal).getTime() - new Date(a.dataReal).getTime()
        ),
        total,
      });
    });

    return grouped;
  }, [transactions]);

  // Calcular saldo acumulado
  const calculateRunningBalance = () => {
    if (!transactions) return { runningBalance: 0, totals: { receitas: 0, despesas: 0 } };

    const totals = transactions.reduce(
      (acc, t) => {
        const value = parseFloat(t.valor);
        if (t.tipo === "entrada") {
          acc.receitas += value;
        } else {
          acc.despesas += value;
        }
        return acc;
      },
      { receitas: 0, despesas: 0 }
    );

    const runningBalance = totals.receitas - totals.despesas;

    return { runningBalance, totals };
  };

  const { runningBalance, totals } = calculateRunningBalance();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDateHeader = (date: Date) => {
    if (isToday(date)) return "Hoje";
    if (isYesterday(date)) return "Ontem";
    return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
  };

  const formatTime = (dateString: string) => {
    return format(parseISO(dateString), "HH:mm");
  };

  const getCategoryColor = (categoria: string) => {
    const colors = [
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
      "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
    ];
    const index = categoria.length % colors.length;
    return colors[index];
  };

  // Parse period to get month/year display
  const periodDisplay = useMemo(() => {
    if (!period) return "";
    const [year, month] = period.split("-");
    const monthName = format(new Date(parseInt(year), parseInt(month) - 1, 1), "MMMM yyyy", {
      locale: ptBR,
    });
    return monthName.charAt(0).toUpperCase() + monthName.slice(1);
  }, [period]);

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/36b56b69-0d80-4b8b-953b-55356f395306',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lancamentos.tsx:195',message:'About to render DashboardContainer',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  try {
    return (
      <DashboardContainer>
      <div className="space-y-6 pb-24">
        {/* Header Estilo Extrato Bancário */}
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6 shadow-lg">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 11px)`,
            }} />
          </div>

          <div className="relative space-y-4">
            {/* Title Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 shadow-md flex items-center justify-center">
                  <FileText className="h-6 w-6 text-slate-700 dark:text-slate-300" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Extrato de Lançamentos
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Visualize todas as suas transações financeiras
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              </div>
            </div>

            {/* Period Selector */}
            <div className="flex items-center justify-center sm:justify-start">
              <div className="bg-white dark:bg-slate-800 rounded-xl px-4 py-3 shadow-sm border border-slate-200 dark:border-slate-700">
                <PeriodSelector />
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Receitas */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Receitas
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(totals.receitas)}
                  </p>
                )}
              </div>

              {/* Despesas */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Despesas
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {formatCurrency(totals.despesas)}
                  </p>
                )}
              </div>

              {/* Saldo */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Saldo
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </div>
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p
                    className={cn(
                      "text-2xl font-bold",
                      runningBalance >= 0
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-orange-600 dark:text-orange-400"
                    )}
                  >
                    {formatCurrency(runningBalance)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div>
            <TransactionFilters filters={filters} onFiltersChange={setFilters} />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            size="lg"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-xl shadow-md"
            onClick={() => {
              setTransactionType("entrada");
              setDialogOpen(true);
            }}
          >
            <DollarSign className="h-5 w-5 mr-2" />
            Nova Receita
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="flex-1 border-2 border-orange-600 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 h-12 rounded-xl"
            onClick={() => {
              setTransactionType("saida");
              setDialogOpen(true);
            }}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Nova Despesa
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <Card className="rounded-xl border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-400 mb-1">
                    Erro ao carregar extrato
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-500">
                    {error instanceof Error ? error.message : "Não foi possível carregar os lançamentos."}
                  </p>
                </div>
                <Button onClick={() => refetch()} variant="outline" className="mt-2">
                  Tentar novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Extrato - Lista de Transações Agrupadas por Data */}
        {!error && (
          <>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="rounded-xl">
                    <CardHeader className="pb-3">
                      <Skeleton className="h-5 w-32" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[1, 2].map((j) => (
                        <Skeleton key={j} className="h-20 w-full" />
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : groupedTransactions.length > 0 ? (
              <div className="space-y-4">
                {groupedTransactions.map((group, groupIndex) => (
                  <div
                    key={format(group.date, "yyyy-MM-dd")}
                  >
                    <Card className="rounded-xl border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                      {/* Date Header */}
                      <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                              {formatDateHeader(group.date)}
                            </h3>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {group.transactions.length} {group.transactions.length === 1 ? "lançamento" : "lançamentos"}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Saldo do dia</p>
                          <p
                            className={cn(
                              "text-sm font-bold",
                              group.total >= 0
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-orange-600 dark:text-orange-400"
                            )}
                          >
                            {group.total >= 0 ? "+" : ""}
                            {formatCurrency(group.total)}
                          </p>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="p-0">
                        {/* Transactions List */}
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                          {group.transactions.map((transaction, index) => {
                            const isLast = index === group.transactions.length - 1;
                            return (
                              <div
                                key={transaction.id}
                                className={cn(
                                  "px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors cursor-pointer group",
                                  !isLast && "border-b border-slate-100 dark:border-slate-800"
                                )}
                                onClick={() => setEditingTransaction(transaction)}
                              >
                                <div className="flex items-center gap-4">
                                  {/* Icon & Type Indicator */}
                                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                    <div
                                      className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110",
                                        transaction.tipo === "entrada"
                                          ? "bg-emerald-100 dark:bg-emerald-900/30"
                                          : "bg-rose-100 dark:bg-rose-900/30"
                                      )}
                                    >
                                      {transaction.tipo === "entrada" ? (
                                        <ArrowDownCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                      ) : (
                                        <ArrowUpCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                                      )}
                                    </div>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                      {formatTime(transaction.dataReal)}
                                    </span>
                                  </div>

                                  {/* Transaction Details */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                      <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-900 dark:text-slate-100 truncate mb-1">
                                          {transaction.descricao || transaction.categoria || "Sem descrição"}
                                        </p>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <Badge
                                            variant="outline"
                                            className={cn("text-xs", getCategoryColor(transaction.categoria || "Outros"))}
                                          >
                                            {transaction.categoria || "Sem categoria"}
                                          </Badge>
                                          {transaction.status === "pending" ? (
                                            <Badge
                                              variant="outline"
                                              className={cn(
                                                "text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                                              )}
                                            >
                                              <Clock className="h-3 w-3 mr-1" />
                                              Pendente
                                            </Badge>
                                          ) : (
                                            <Badge
                                              variant="outline"
                                              className="text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                                            >
                                              <CheckCircle2 className="h-3 w-3 mr-1" />
                                              Confirmado
                                            </Badge>
                                          )}
                                        </div>
                                      </div>

                                      {/* Amount */}
                                      <div className="flex items-center gap-3 flex-shrink-0">
                                        <div className="text-right">
                                          <div className="flex items-center gap-2">
                                            {transaction.tipo === "entrada" ? (
                                              <ArrowDownCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            ) : (
                                              <ArrowUpCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                            )}
                                            <p
                                              className={cn(
                                                "text-lg font-bold font-mono tabular-nums",
                                                transaction.tipo === "entrada"
                                                  ? "text-blue-600 dark:text-blue-400"
                                                  : "text-orange-600 dark:text-orange-400"
                                              )}
                                            >
                                              {transaction.tipo === "entrada" ? "+" : "-"}
                                              {formatCurrency(parseFloat(transaction.valor))}
                                            </p>
                                          </div>
                                          <p className={cn(
                                            "text-xs mt-0.5 font-medium",
                                            transaction.tipo === "entrada"
                                              ? "text-blue-500 dark:text-blue-400"
                                              : "text-orange-500 dark:text-orange-400"
                                          )}>
                                            {transaction.tipo === "entrada" ? "Receita" : "Despesa"}
                                          </p>
                                        </div>

                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <MoreVertical className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingTransaction(transaction);
                                              }}
                                            >
                                              <Edit className="h-4 w-4 mr-2" />
                                              Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                // Duplicate functionality can be added here
                                              }}
                                            >
                                              Duplicar
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="rounded-xl border-slate-200 dark:border-slate-800">
                <CardContent className="p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <FileText className="h-8 w-8 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                        Nenhum lançamento encontrado
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {Object.values(filters).some((v) => v && v !== period)
                          ? "Tente ajustar os filtros para ver mais resultados"
                          : "Comece adicionando sua primeira transação"}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                      <Button
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => {
                          setTransactionType("entrada");
                          setDialogOpen(true);
                        }}
                      >
                        <DollarSign className="h-5 w-5 mr-2" />
                        Adicionar Receita
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-orange-600 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                        onClick={() => {
                          setTransactionType("saida");
                          setDialogOpen(true);
                        }}
                      >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        Adicionar Despesa
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Transaction Dialogs */}
      <QuickTransactionDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            refetch();
          }
        }}
        defaultType={transactionType}
      />

      {editingTransaction && (
        <EditTransactionDialog
          transaction={editingTransaction}
          open={!!editingTransaction}
          onOpenChange={(open) => {
            if (!open) {
              setEditingTransaction(null);
              refetch();
            }
          }}
        />
      )}
    </DashboardContainer>
    );
  } catch (renderError) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/36b56b69-0d80-4b8b-953b-55356f395306',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lancamentos.tsx:658',message:'Render error in Lancamentos',data:{error:renderError instanceof Error?renderError.message:String(renderError),stack:renderError instanceof Error?renderError.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    throw renderError;
  }
}
