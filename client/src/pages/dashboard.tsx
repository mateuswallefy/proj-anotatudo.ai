import { useQuery } from "@tanstack/react-query";
import type { Transacao, Goal } from "@shared/schema";
import { usePeriod } from "@/contexts/PeriodContext";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { GoalsPreview } from "@/components/dashboard/GoalsPreview";
import { BudgetsPreview } from "@/components/dashboard/BudgetsPreview";
import { CreditCardsPreview } from "@/components/dashboard/CreditCardsPreview";
import { InsightCarousel } from "@/components/dashboard/InsightCarousel";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { SectionTitle } from "@/components/design-system/SectionTitle";
import { RecentTransactions } from "@/components/RecentTransactions";
import { AlertasImportantes } from "@/components/AlertasImportantes";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { period } = usePeriod();
  const [, setLocation] = useLocation();
  
  // Parse period (format: "YYYY-MM")
  const [year, month] = period ? period.split('-').map(Number) : [
    new Date().getFullYear(),
    new Date().getMonth() + 1
  ];

  // Fetch dashboard overview for KPIs
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

  // Fetch recent transactions
  const { data: recentTransactions, isLoading: loadingTransactions } = useQuery<Transacao[]>({
    queryKey: ["/api/transacoes", { period }],
    queryFn: async () => {
      const response = await fetch(`/api/transacoes?period=${period}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
  });

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-20 transition-colors duration-200">
      <main className="px-4 space-y-6 py-6 max-w-7xl mx-auto">
        {/* Alertas Importantes */}
        <AlertasImportantes />

        {/* KPIs principais */}
        <KpiGrid
          entradas={overview ? parseFloat(overview.entradas || '0') : undefined}
          despesas={overview ? parseFloat(overview.despesas || '0') : undefined}
          economias={overview ? parseFloat(overview.economias || '0') : undefined}
          saldo={overview ? parseFloat(overview.saldo || '0') : undefined}
          variacaoEntradas={overview ? parseFloat(overview.variacaoEntradas || '0') : undefined}
          variacaoDespesas={overview ? parseFloat(overview.variacaoDespesas || '0') : undefined}
          variacaoEconomias={0}
          variacaoSaldo={overview ? parseFloat(overview.variacaoSaldo || '0') : undefined}
          isLoading={loadingOverview}
        />

        {/* Metas & Economias */}
        <GoalsPreview
          goals={savingGoals}
          isLoading={loadingGoals}
          onCreateGoal={() => setLocation('/metas/nova')}
        />

        {/* Orçamentos por Categoria */}
        <BudgetsPreview
          budgets={budgets}
          isLoading={loadingBudgets}
          onConfigure={() => setLocation('/orcamentos')}
        />

        {/* Cartões de Crédito */}
        <CreditCardsPreview
          cards={cardsOverview}
          isLoading={loadingCards}
          onCreateCard={() => setLocation('/cartoes/novo')}
        />

        {/* Insights da conta */}
        <div>
          <SectionTitle>Insights da sua conta</SectionTitle>
          <InsightCarousel insights={undefined} isLoading={false} />
        </div>

        {/* Ações rápidas */}
        <div>
          <SectionTitle>Ações rápidas</SectionTitle>
          <QuickActions />
        </div>

        {/* Últimas transações */}
        {recentTransactions && recentTransactions.length > 0 && (
          <div>
            <SectionTitle>Últimas transações</SectionTitle>
            <RecentTransactions transacoes={recentTransactions.slice(0, 6)} />
          </div>
        )}
      </main>
    </div>
  );
}
