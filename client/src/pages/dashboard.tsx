import { ArrowDownCircle, ArrowUpCircle, Wallet, CreditCard } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { DashboardContainer } from "@/components/dashboard/DashboardContainer";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { DashboardCardsWidget } from "@/components/dashboard/DashboardCardsWidget";
import { DashboardAgendaWidget } from "@/components/dashboard/DashboardAgendaWidget";
import { DashboardLastMovements } from "@/components/dashboard/DashboardLastMovements";
import { DashboardMonthlyBalance } from "@/components/dashboard/DashboardMonthlyBalance";
import { DashboardCategoryChart } from "@/components/dashboard/DashboardCategoryChart";
import { FabActions } from "@/components/dashboard/FabActions";

export default function Dashboard() {
  const stats = useDashboardStats();

  return (
    <DashboardContainer>
      <div className="space-y-4 sm:space-y-5 md:space-y-6 pb-20 sm:pb-24">
        {/* Header */}
        <DashboardHeader />

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
            icon={<Wallet className="h-6 w-6" />}
            color="blue"
            isLoading={stats.isLoading}
          />
          <DashboardStatCard
            title="Faturas do Cartão"
            value={stats.faturasCartao}
            variation={0}
            icon={<CreditCard className="h-6 w-6" />}
            color="orange"
            isLoading={stats.isLoading}
          />
        </div>

        {/* Widgets Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <DashboardCardsWidget />
          <DashboardAgendaWidget />
          <DashboardLastMovements />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          <DashboardMonthlyBalance />
          <DashboardCategoryChart />
        </div>
      </div>

      {/* FAB */}
      <FabActions />
    </DashboardContainer>
  );
}

