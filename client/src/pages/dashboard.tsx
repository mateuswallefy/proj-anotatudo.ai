import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Transacao, Cartao, Goal } from "@shared/schema";
import { SpendingSpeedometer } from "@/components/SpendingSpeedometer";
import { InsightsCards } from "@/components/InsightsCards";
import { CategoryRanking } from "@/components/CategoryRanking";
import { WeekdayAnalysis } from "@/components/WeekdayAnalysis";
import { DailyAverageChart } from "@/components/DailyAverageChart";
import { RecentTransactions } from "@/components/RecentTransactions";
import { PeriodSummaryCards } from "@/components/PeriodSummaryCards";
import { MonthlyComparisonChart } from "@/components/MonthlyComparisonChart";
import { ExpensesByCategoryChart } from "@/components/ExpensesByCategoryChart";
import { IncomeByCategoryChart } from "@/components/IncomeByCategoryChart";
import { YearlyEvolutionChart } from "@/components/YearlyEvolutionChart";
import { AlertasImportantes } from "@/components/AlertasImportantes";
import { ResumoPatrimonial } from "@/components/ResumoPatrimonial";
import { PortfolioInvestimentos } from "@/components/PortfolioInvestimentos";
import { InsightsInteligentes } from "@/components/InsightsInteligentes";
import { LightbulbIcon } from "lucide-react";
import { usePeriod } from "@/contexts/PeriodContext";
import { PeriodSelector } from "@/components/PeriodSelector";

interface FinancialInsights {
  mediaDiariaGastos: number;
  mediaDiariaReceitas: number;
  totalGastosMes: number;
  totalReceitasMes: number;
  categoriaQueMaisGasta: {
    categoria: string;
    total: number;
    percentual: number;
  } | null;
  diaSemanaQueMaisGasta: {
    dia: string;
    total: number;
  } | null;
  topCategorias: Array<{
    categoria: string;
    total: number;
    percentual: number;
    transacoes: number;
  }>;
  dicasEconomia: string[];
  gastosPorDia: Array<{
    data: string;
    total: number;
  }>;
  receitasPorDia: Array<{
    data: string;
    total: number;
  }>;
  gastosPorDiaSemana: Record<string, number>;
  progressoMensal: {
    percentualGasto: number;
    diasDecorridos: number;
    diasRestantes: number;
    mediaDiariaAtual: number;
    mediaDiariaIdeal: number;
  };
}

interface SpendingProgress {
  gastoAtual: number;
  limiteTotal: number;
  percentualUsado: number;
  status: 'seguro' | 'alerta' | 'perigo';
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { period } = usePeriod();

  // Fetch insights
  const { data: insights, isLoading: loadingInsights} = useQuery<FinancialInsights>({
    queryKey: ["/api/insights", { period }],
    queryFn: async () => {
      const response = await fetch(`/api/insights?period=${period}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch insights');
      return response.json();
    }
  });

  // Fetch spending progress
  const { data: spendingProgress, isLoading: loadingProgress } = useQuery<SpendingProgress>({
    queryKey: ["/api/spending-progress", { period }],
    queryFn: async () => {
      const response = await fetch(`/api/spending-progress?period=${period}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch spending progress');
      return response.json();
    }
  });

  // Fetch transactions for recent list
  const { data: transacoes, isLoading: loadingTransacoes } = useQuery<Transacao[]>({
    queryKey: ["/api/transacoes", { period }],
    queryFn: async () => {
      const response = await fetch(`/api/transacoes?period=${period}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    }
  });

  // Fetch goals (not period-specific)
  const { data: goals, isLoading: loadingGoals } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  // Prefetch other tabs data for instant navigation
  useEffect(() => {
    // Prefetch cards data
    queryClient.prefetchQuery({
      queryKey: ["/api/cartoes"],
    });
    
    // Prefetch spending limits
    queryClient.prefetchQuery({
      queryKey: ["/api/spending-limits"],
    });

    // Prefetch account members
    queryClient.prefetchQuery({
      queryKey: ["/api/account-members"],
    });
  }, [queryClient]);

  const isLoading = loadingInsights || loadingProgress || loadingTransacoes || loadingGoals;

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const hasSpendingLimit = spendingProgress && spendingProgress.limiteTotal > 0;

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard Financeiro Premium</h1>
          <p className="text-muted-foreground">
            Visão completa e inteligente das suas finanças
          </p>
        </div>
        <PeriodSelector />
      </div>

      {/* Alertas Importantes - NOVO! */}
      <AlertasImportantes />

      {/* Resumo Patrimonial - 4 Cards Principais - NOVO! */}
      <ResumoPatrimonial />

      {/* Monthly Comparison Chart */}
      <MonthlyComparisonChart />

      {/* Category Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpensesByCategoryChart />
        <IncomeByCategoryChart />
      </div>

      {/* Yearly Evolution */}
      <YearlyEvolutionChart />

      {/* Portfólio e Insights - NOVO! */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PortfolioInvestimentos />
        <InsightsInteligentes />
      </div>

      {/* Insights Cards */}
      {insights && (
        <InsightsCards
          dicasEconomia={insights.dicasEconomia}
          mediaDiariaGastos={insights.mediaDiariaGastos}
          mediaDiariaReceitas={insights.mediaDiariaReceitas}
          totalGastosMes={insights.totalGastosMes}
          totalReceitasMes={insights.totalReceitasMes}
        />
      )}

      {/* Analysis Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Average Chart */}
        {insights && (
          <DailyAverageChart
            gastosPorDia={insights.gastosPorDia}
            receitasPorDia={insights.receitasPorDia}
          />
        )}

        {/* Weekday Analysis */}
        {insights && (
          <WeekdayAnalysis
            gastosPorDiaSemana={insights.gastosPorDiaSemana}
            diaSemanaQueMaisGasta={insights.diaSemanaQueMaisGasta}
          />
        )}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Speedometer */}
        {hasSpendingLimit && spendingProgress && (
          <div className="lg:col-span-1">
            <SpendingSpeedometer
              gastoAtual={spendingProgress.gastoAtual}
              limiteTotal={spendingProgress.limiteTotal}
              percentualUsado={spendingProgress.percentualUsado}
              status={spendingProgress.status}
            />
          </div>
        )}

        {/* Category Ranking */}
        {insights && (
          <div className={hasSpendingLimit ? "lg:col-span-2" : "lg:col-span-3"}>
            <CategoryRanking topCategorias={insights.topCategorias} />
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      {transacoes && transacoes.length > 0 && (
        <RecentTransactions transacoes={transacoes} />
      )}

      {/* Tips Section */}
      {insights && insights.dicasEconomia.length > 1 && (
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-6 border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <LightbulbIcon className="h-5 w-5 text-primary" />
            Mais Dicas para Economizar
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.dicasEconomia.slice(1).map((dica, index) => (
              <div
                key={index}
                className="bg-background/50 rounded-md p-4 hover-elevate"
              >
                <p className="text-sm leading-relaxed">{dica}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
