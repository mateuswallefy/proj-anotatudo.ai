import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardData } from "@/hooks/useDashboardData";
import { AlertasImportantes } from "@/components/AlertasImportantes";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardKpis } from "@/components/dashboard/DashboardKpis";
import { DashboardMainChart } from "@/components/dashboard/DashboardMainChart";
import { DashboardGoals } from "@/components/dashboard/DashboardGoals";
import { DashboardBudgets } from "@/components/dashboard/DashboardBudgets";
import { DashboardInsights } from "@/components/dashboard/DashboardInsights";
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";
import { DashboardCards } from "@/components/dashboard/DashboardCards";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: dashboardData, isLoading } = useDashboardData();

  // Fetch insights (if API exists)
  const { data: insights } = useQuery({
    queryKey: ["/api/insights-ai"],
    queryFn: async () => {
      const response = await fetch(`/api/insights-ai`, {
        credentials: "include",
      });
      if (!response.ok) return null;
      return response.json();
    },
    retry: false,
  });

  return (
    <DashboardShell>
      {/* Alertas Importantes */}
      <AlertasImportantes />

      {/* Header com saudação */}
      <DashboardHeader />

      {/* KPIs principais */}
      <DashboardKpis
        entradas={dashboardData?.kpis.find((k) => k.type === "income")?.value}
        despesas={dashboardData?.kpis.find((k) => k.type === "expense")?.value}
        economias={dashboardData?.kpis.find((k) => k.type === "savings")?.value}
        saldo={dashboardData?.kpis.find((k) => k.type === "balance")?.value}
        variacaoEntradas={
          dashboardData?.kpis.find((k) => k.type === "income")?.diffVsLastMonth
        }
        variacaoDespesas={
          dashboardData?.kpis.find((k) => k.type === "expense")?.diffVsLastMonth
        }
        variacaoEconomias={
          dashboardData?.kpis.find((k) => k.type === "savings")?.diffVsLastMonth
        }
        variacaoSaldo={
          dashboardData?.kpis.find((k) => k.type === "balance")?.diffVsLastMonth
        }
        isLoading={isLoading}
      />

      {/* Gráfico principal */}
      <DashboardMainChart chartData={dashboardData?.mainChartSeries} />

      {/* Metas & Economias */}
      <DashboardGoals
        goals={dashboardData?.goalsSummary}
        isLoading={isLoading}
        onCreateGoal={() => setLocation("/metas/nova")}
      />

      {/* Orçamentos por Categoria */}
      <DashboardBudgets
        budgets={dashboardData?.budgetsSummary}
        isLoading={isLoading}
        onConfigure={() => setLocation("/orcamento")}
      />

      {/* Insights da conta */}
      <DashboardInsights insights={insights} isLoading={false} />

      {/* Ações rápidas */}
      <DashboardQuickActions />

      {/* Cartões de Crédito */}
      <DashboardCards
        cards={dashboardData?.cardsSummary}
        isLoading={isLoading}
        onCreateCard={() => setLocation("/cartoes/novo")}
      />

      {/* Últimas transações */}
      {dashboardData?.recentTransactions &&
        dashboardData.recentTransactions.length > 0 && (
          <div className="bg-white/5 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
              Últimas transações
            </h3>
            <div className="space-y-3">
              {dashboardData.recentTransactions.map((transacao) => {
                const formatCurrency = (value: number) => {
                  return new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(value);
                };

                const formatDate = (dateString: string) => {
                  const date = new Date(dateString);
                  return date.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  });
                };

                return (
                  <div
                    key={transacao.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 dark:bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          transacao.type === "entrada"
                            ? "bg-[#4ADE80]/10"
                            : transacao.type === "economia"
                            ? "bg-[#60A5FA]/10"
                            : "bg-[#FB7185]/10"
                        }`}
                      >
                        {transacao.type === "entrada" ? (
                          <span className="text-[#4ADE80]">↑</span>
                        ) : transacao.type === "economia" ? (
                          <span className="text-[#60A5FA]">💰</span>
                        ) : (
                          <span className="text-[#FB7185]">↓</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-[var(--text-primary)] text-sm">
                          {transacao.description || transacao.category}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-[var(--text-secondary)]">
                            {formatDate(transacao.date)}
                          </p>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-[var(--text-secondary)]">
                            {transacao.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold font-sora text-sm ${
                          transacao.type === "entrada"
                            ? "text-[#4ADE80]"
                            : transacao.type === "economia"
                            ? "text-[#60A5FA]"
                            : "text-[#FB7185]"
                        }`}
                        style={{ fontFamily: "'Sora', sans-serif" }}
                      >
                        {transacao.type === "entrada" ? "+" : transacao.type === "economia" ? "+" : "-"}
                        {formatCurrency(transacao.amount)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
    </DashboardShell>
  );
}
