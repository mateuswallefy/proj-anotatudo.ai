import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownCircle, ArrowUpCircle, PiggyBank, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePeriod } from "@/contexts/PeriodContext";

type PeriodSummary = {
  totalReceitas: number;
  totalDespesas: number;
  saldoPeriodo: number;
  receitasTotal: number;
  despesasTotal: number;
  variacaoReceitas: number;
  variacaoDespesas: number;
  transacoesTotal: number;
};

export function CardsMensais() {
  const { period } = usePeriod();
  
  const { data: periodSummary, isLoading } = useQuery<PeriodSummary>({
    queryKey: ["/api/analytics/period-summary", { period }],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/period-summary?period=${period}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch period summary');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-32 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  const entradas = periodSummary?.totalReceitas || 0;
  const despesas = periodSummary?.totalDespesas || 0;
  const economias = entradas - despesas;
  const saldoMes = economias; // Same as economias for now
  
  const variacaoReceitas = periodSummary?.variacaoReceitas || 0;
  const variacaoDespesas = periodSummary?.variacaoDespesas || 0;
  const variacaoEconomia = variacaoReceitas - variacaoDespesas;

  const cards = [
    {
      title: "ENTRADAS",
      value: entradas,
      variation: variacaoReceitas,
      variationLabel: "vs mês anterior",
      icon: ArrowDownCircle,
      gradient: "from-emerald-500/5 to-emerald-500/15",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      testId: "card-entradas"
    },
    {
      title: "DESPESAS",
      value: despesas,
      variation: variacaoDespesas,
      variationLabel: "vs mês anterior",
      icon: ArrowUpCircle,
      gradient: "from-orange-500/5 to-orange-500/15",
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-600 dark:text-orange-400",
      testId: "card-despesas"
    },
    {
      title: "ECONOMIAS",
      value: economias,
      variation: variacaoEconomia,
      variationLabel: "vs mês anterior",
      icon: PiggyBank,
      gradient: economias >= 0 ? "from-teal-500/5 to-teal-500/15" : "from-red-500/5 to-red-500/15",
      iconBg: economias >= 0 ? "bg-teal-500/10" : "bg-red-500/10",
      iconColor: economias >= 0 ? "text-teal-600 dark:text-teal-400" : "text-red-600 dark:text-red-400",
      testId: "card-economias"
    },
    {
      title: "SALDO DO MÊS",
      value: saldoMes,
      variation: variacaoEconomia,
      variationLabel: "vs mês anterior",
      icon: Wallet,
      gradient: saldoMes >= 0 ? "from-blue-500/5 to-blue-500/15" : "from-red-500/5 to-red-500/15",
      iconBg: saldoMes >= 0 ? "bg-blue-500/10" : "bg-red-500/10",
      iconColor: saldoMes >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400",
      testId: "card-saldo"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6" data-testid="cards-mensais">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const isPositive = card.variation >= 0;
        const TrendIcon = isPositive ? TrendingUp : TrendingDown;
        
        return (
          <Card 
            key={index}
            className={`p-6 bg-gradient-to-br ${card.gradient} hover-elevate active-elevate-2`}
            data-testid={card.testId}
          >
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-muted-foreground tracking-wide">
                  {card.title}
                </p>
                <div className={`p-3 rounded-full ${card.iconBg}`}>
                  <Icon className={`h-6 w-6 ${card.iconColor}`} />
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-3xl font-bold" data-testid={`${card.testId}-value`}>
                  R$ {card.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                
                <div className="flex items-center gap-1 text-sm">
                  <TrendIcon className={`h-4 w-4 ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} />
                  <span className={isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                    {isPositive ? '+' : ''}{card.variation.toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground">
                    {card.variationLabel}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
