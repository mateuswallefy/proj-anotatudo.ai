import {
  TrendingUp,
  TrendingDown,
  Wallet2,
  CreditCard,
} from "lucide-react";
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
      <div className="space-y-6 pb-20 sm:pb-24">
        {/* Header */}
        <DashboardHeader />

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <DashboardStatCard
            title="Receitas"
            value={stats.receitas}
            variation={stats.variacaoReceitas}
            icon={<TrendingUp className="h-5 w-5" />}
            color="green"
            isLoading={stats.isLoading}
            index={0}
          />
          <DashboardStatCard
            title="Despesas"
            value={stats.despesas}
            variation={stats.variacaoDespesas}
            icon={<TrendingDown className="h-5 w-5" />}
            color="red"
            isLoading={stats.isLoading}
            index={1}
          />
          <DashboardStatCard
            title="Saldo"
            value={stats.saldo}
            variation={stats.variacaoSaldo}
            icon={<Wallet2 className="h-5 w-5" />}
            color="blue"
            isLoading={stats.isLoading}
            index={2}
          />
          <DashboardStatCard
            title="Faturas"
            value={stats.faturasCartao}
            variation={0}
            icon={<CreditCard className="h-5 w-5" />}
            color="orange"
            isLoading={stats.isLoading}
            index={3}
          />
        </div>

        {/* Widgets Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <DashboardCardsWidget />
          <DashboardAgendaWidget />
          <DashboardLastMovements />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <DashboardMonthlyBalance />
          <DashboardCategoryChart />
        </div>
      </div>

      {/* FAB */}
      <FabActions />
    </DashboardContainer>
  );
}
