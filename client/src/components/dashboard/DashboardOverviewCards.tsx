import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Wallet, PiggyBank } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardOverview {
  entradas: string;
  despesas: string;
  saldo: string;
  economias: string;
  variacaoEntradas: string;
  variacaoDespesas: string;
  variacaoSaldo: string;
}

interface DashboardOverviewCardsProps {
  overview?: DashboardOverview;
  isLoading?: boolean;
}

export function DashboardOverviewCards({ overview, isLoading }: DashboardOverviewCardsProps) {
  if (isLoading || !overview) {
    return (
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide -mx-4 px-4 lg:grid lg:grid-cols-4 lg:overflow-visible">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-[280px] rounded-2xl flex-shrink-0 lg:w-full" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Saldo do Mês",
      value: parseFloat(overview.saldo),
      variation: parseFloat(overview.variacaoSaldo),
      gradient: "from-blue-500/10 to-blue-600/10",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-600 dark:text-blue-400",
      icon: Wallet,
      testId: "saldo-card",
    },
    {
      title: "Entradas",
      value: parseFloat(overview.entradas),
      variation: parseFloat(overview.variacaoEntradas),
      gradient: "from-emerald-500/10 to-emerald-600/10",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      icon: TrendingUp,
      testId: "entradas-card",
    },
    {
      title: "Despesas",
      value: parseFloat(overview.despesas),
      variation: parseFloat(overview.variacaoDespesas),
      gradient: "from-red-500/10 to-red-600/10",
      iconBg: "bg-red-500/10",
      iconColor: "text-red-600 dark:text-red-400",
      icon: TrendingDown,
      testId: "despesas-card",
    },
    {
      title: "Economias",
      value: parseFloat(overview.economias),
      variation: 0,
      gradient: "from-purple-500/10 to-purple-600/10",
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-600 dark:text-purple-400",
      icon: PiggyBank,
      testId: "economias-card",
    },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide -mx-4 px-4 lg:grid lg:grid-cols-4 lg:overflow-visible lg:mx-0 lg:px-0">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const isPositive = card.variation >= 0;
        const VariationIcon = isPositive ? ArrowUpRight : ArrowDownRight;
        
        return (
          <Card
            key={index}
            className={`p-5 rounded-2xl shadow-sm bg-gradient-to-br ${card.gradient} hover-elevate active-elevate-2 flex-shrink-0 w-[280px] lg:w-full`}
            data-testid={card.testId}
          >
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground tracking-wide">
                  {card.title}
                </p>
                <div className={`p-2 rounded-full ${card.iconBg}`}>
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <p className="text-2xl font-bold" data-testid={`${card.testId}-value`}>
                  {formatCurrency(card.value)}
                </p>
                
                {card.variation !== 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <VariationIcon className={`h-3 w-3 ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} />
                    <span className={isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                      {isPositive ? '+' : ''}{card.variation.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">
                      vs mês anterior
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

