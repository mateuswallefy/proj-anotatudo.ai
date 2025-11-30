import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Transacao, Goal } from "@shared/schema";
import { RecentTransactions } from "@/components/RecentTransactions";
import { AlertasImportantes } from "@/components/AlertasImportantes";
import { usePeriod } from "@/contexts/PeriodContext";
import { DashboardOverviewCards } from "@/components/dashboard/DashboardOverviewCards";
import { DashboardGoalsStrip } from "@/components/dashboard/DashboardGoalsStrip";
import { DashboardBudgetsList } from "@/components/dashboard/DashboardBudgetsList";
import { DashboardCardsStrip } from "@/components/dashboard/DashboardCardsStrip";
import { DashboardInsightsCard } from "@/components/dashboard/DashboardInsightsCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { period } = usePeriod();
  
  // Parse period (format: "YYYY-MM")
  const [year, month] = period ? period.split('-').map(Number) : [
    new Date().getFullYear(),
    new Date().getMonth() + 1
  ];

  // Fetch dashboard overview
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ["/api/dashboard/overview", { year, month }],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/overview?year=${year}&month=${month}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch dashboard overview');
      return response.json();
    },
  });

  // Fetch saving goals
  const { data: savingGoals, isLoading: loadingGoals } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
    queryFn: async () => {
      const response = await fetch(`/api/goals`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch goals');
      return response.json();
    },
  });

  // Fetch monthly savings
  const { data: monthlySavings, isLoading: loadingMonthlySavings } = useQuery({
    queryKey: ["/api/monthly-savings", { year, month }],
    queryFn: async () => {
      const response = await fetch(`/api/monthly-savings?year=${year}&month=${month}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch monthly savings');
      return response.json();
    },
  });

  // Fetch budgets
  const { data: budgets, isLoading: loadingBudgets } = useQuery({
    queryKey: ["/api/budgets", { year, month }],
    queryFn: async () => {
      const response = await fetch(`/api/budgets?year=${year}&month=${month}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch budgets');
      return response.json();
    },
  });

  // Fetch cards overview
  const { data: cardsOverview, isLoading: loadingCards } = useQuery({
    queryKey: ["/api/credit-cards/overview", { year, month }],
    queryFn: async () => {
      const response = await fetch(`/api/credit-cards/overview?year=${year}&month=${month}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch cards overview');
      return response.json();
    },
  });

  // Fetch insights overview
  const { data: insights, isLoading: loadingInsights } = useQuery({
    queryKey: ["/api/insights/overview", { year, month }],
    queryFn: async () => {
      const response = await fetch(`/api/insights/overview?year=${year}&month=${month}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch insights overview');
      return response.json();
    },
  });

  // Fetch recent transactions
  const { data: recentTransactions, isLoading: loadingTransactions } = useQuery<Transacao[]>({
    queryKey: ["/api/transacoes", { period }],
    queryFn: async () => {
      const response = await fetch(`/api/transacoes?period=${period}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
  });

  // Prefetch other tabs data for instant navigation
  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ["/api/cartoes"],
    });
    
    queryClient.prefetchQuery({
      queryKey: ["/api/spending-limits"],
    });

    queryClient.prefetchQuery({
      queryKey: ["/api/account-members"],
    });
  }, [queryClient]);

  const isLoading = loadingOverview || loadingGoals || loadingMonthlySavings || loadingBudgets || loadingCards || loadingInsights || loadingTransactions;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="flex gap-4 overflow-x-auto pb-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-[280px] rounded-2xl flex-shrink-0" />
            ))}
          </div>
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="px-4 space-y-6 md:px-8 md:space-y-8 max-w-7xl mx-auto">
        {/* Alertas Importantes */}
        <AlertasImportantes />

        {/* 1. Cards principais */}
        <section>
          <DashboardOverviewCards overview={overview} isLoading={loadingOverview} />
        </section>

        {/* 2. Metas & Economias */}
        <section>
          <DashboardGoalsStrip
            savingGoals={savingGoals}
            monthlySavings={monthlySavings}
            isLoading={loadingGoals || loadingMonthlySavings}
            onCreateGoal={() => {
              // Navigate to goals page or open dialog
              console.log("Create goal");
            }}
          />
        </section>

        {/* 3. Orçamentos */}
        <section>
          <DashboardBudgetsList
            budgets={budgets}
            isLoading={loadingBudgets}
            onViewAll={() => {
              // Navigate to budgets page
              console.log("View all budgets");
            }}
          />
        </section>

        {/* 4. Cartões */}
        <section>
          <DashboardCardsStrip
            cards={cardsOverview}
            isLoading={loadingCards}
            onCreateCard={() => {
              // Navigate to cards page or open dialog
              console.log("Create card");
            }}
          />
        </section>

        {/* 5. Insights */}
        <section>
          <DashboardInsightsCard insights={insights} isLoading={loadingInsights} />
        </section>

        {/* 6. Últimas transações */}
        <section>
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-base font-semibold">Últimas Transações</h3>
              <Button variant="ghost" size="sm" className="h-auto p-1 text-xs" onClick={() => {
                // Navigate to transactions page
                console.log("View all transactions");
              }}>
                Ver todas
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            {recentTransactions && recentTransactions.length > 0 ? (
              <RecentTransactions transacoes={recentTransactions.slice(0, 6)} />
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Nenhuma transação encontrada
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Desktop Layout - 2 columns for some sections */}
      <div className="hidden lg:block px-4 md:px-8 max-w-7xl mx-auto mt-8">
        <div className="grid grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            {/* Additional desktop content can go here */}
          </div>
          
          {/* Right column */}
          <div className="space-y-6">
            {/* Additional desktop content can go here */}
          </div>
        </div>
      </div>
    </div>
  );
}
