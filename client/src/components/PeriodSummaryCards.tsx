import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, DollarSign, Wallet, PiggyBank } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePeriod } from "@/contexts/PeriodContext";

interface PeriodSummary {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  variacaoReceitas: number;
  variacaoDespesas: number;
  transacoesTotal: number;
}

export function PeriodSummaryCards() {
  const { period } = usePeriod();
  const { data: summary, isLoading } = useQuery<PeriodSummary>({
    queryKey: ["/api/analytics/period-summary", { period }],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/period-summary?period=${period}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch period summary');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const cards = [
    {
      title: "TOTAL DE RECEITAS",
      value: summary.totalReceitas,
      variation: summary.variacaoReceitas,
      icon: DollarSign,
      gradient: "from-emerald-500/10 to-emerald-600/5",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      valueColor: "text-emerald-600 dark:text-emerald-400",
      borderColor: "border-emerald-500/20",
    },
    {
      title: "TOTAL DE DESPESAS",
      value: summary.totalDespesas,
      variation: summary.variacaoDespesas,
      icon: Wallet,
      gradient: "from-orange-500/10 to-orange-600/5",
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-600 dark:text-orange-400",
      valueColor: "text-orange-600 dark:text-orange-400",
      borderColor: "border-orange-500/20",
    },
    {
      title: "SALDO DO PERÍODO",
      value: summary.saldo,
      variation: null,
      icon: PiggyBank,
      gradient: summary.saldo >= 0 ? "from-teal-500/10 to-teal-600/5" : "from-red-500/10 to-red-600/5",
      iconBg: summary.saldo >= 0 ? "bg-teal-500/10" : "bg-red-500/10",
      iconColor: summary.saldo >= 0 ? "text-teal-600 dark:text-teal-400" : "text-red-600 dark:text-red-400",
      valueColor: summary.saldo >= 0 ? "text-teal-600 dark:text-teal-400" : "text-red-600 dark:text-red-400",
      borderColor: summary.saldo >= 0 ? "border-teal-500/20" : "border-red-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-testid="period-summary-cards">
      {cards.map((card, index) => (
        <Card
          key={index}
          className={`relative overflow-hidden p-6 transition-all hover-elevate active-elevate-2 border ${card.borderColor}`}
          data-testid={`summary-card-${index}`}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} pointer-events-none`} />
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                <card.icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
              
              {card.variation !== null && (
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  card.variation >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {card.variation >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {Math.abs(card.variation).toFixed(1)}%
                </div>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
                {card.title}
              </p>
              <p className={`text-3xl font-bold font-mono tabular-nums ${card.valueColor}`}>
                R$ {card.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {index < 2 && card.variation !== null && (
              <p className="text-xs text-muted-foreground">
                {card.variation >= 0 ? '+' : ''}{card.variation.toFixed(1)}% vs mês anterior
              </p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
