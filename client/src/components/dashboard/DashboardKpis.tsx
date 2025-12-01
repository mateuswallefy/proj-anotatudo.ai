import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, PiggyBank } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardKpisProps {
  entradas?: number;
  despesas?: number;
  economias?: number;
  variacaoEntradas?: number;
  variacaoDespesas?: number;
  variacaoEconomias?: number;
  isLoading?: boolean;
}

export function DashboardKpis({
  entradas = 0,
  despesas = 0,
  economias = 0,
  variacaoEntradas = 0,
  variacaoDespesas = 0,
  variacaoEconomias = 0,
  isLoading = false,
}: DashboardKpisProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-3 md:grid md:grid-cols-3 md:gap-4 md:space-y-0">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  const kpis = [
    {
      title: "ENTRADAS",
      value: entradas,
      variation: variacaoEntradas,
      icon: ArrowDownCircle,
      iconBg: "bg-[var(--accent-green)]/10",
      iconColor: "text-[var(--accent-green)]",
    },
    {
      title: "DESPESAS",
      value: despesas,
      variation: variacaoDespesas,
      icon: ArrowUpCircle,
      iconBg: "bg-[var(--accent-orange)]/10",
      iconColor: "text-[var(--accent-orange)]",
    },
    {
      title: "ECONOMIAS",
      value: economias,
      variation: variacaoEconomias,
      icon: PiggyBank,
      iconBg: "bg-[var(--accent-blue)]/10",
      iconColor: "text-[var(--accent-blue)]",
    },
  ];

  return (
    <div className="space-y-3 md:grid md:grid-cols-3 md:gap-4 md:space-y-0">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        const isPositive = kpi.variation >= 0;
        const TrendIcon = isPositive ? TrendingUp : TrendingDown;

        return (
          <Card
            key={index}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm p-4 md:p-5 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
            data-testid={`kpi-card-${kpi.title.toLowerCase()}`}
          >
            <CardContent className="p-0">
              {/* Label */}
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] mb-2">
                {kpi.title}
              </p>

              {/* Value and Icon Row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <p className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                  {formatCurrency(kpi.value)}
                </p>
                <div className={`p-2 rounded-full ${kpi.iconBg} flex-shrink-0`}>
                  <Icon className={`h-5 w-5 ${kpi.iconColor}`} />
                </div>
              </div>

              {/* Variation */}
              <div className="flex items-center gap-1 text-xs">
                <TrendIcon
                  className={`h-3 w-3 ${
                    isPositive ? 'text-[var(--accent-green)]' : 'text-[#EF4444]'
                  }`}
                />
                <span
                  className={
                    isPositive ? 'text-[var(--accent-green)]' : 'text-[#EF4444]'
                  }
                >
                  {isPositive ? '+' : ''}
                  {kpi.variation.toFixed(1).replace('.', ',')}%
                </span>
                <span className="text-[var(--text-secondary)]">vs mês anterior</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
