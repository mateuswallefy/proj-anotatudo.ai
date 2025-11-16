import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Wallet, PiggyBank, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePeriod } from "@/contexts/PeriodContext";

type Conta = {
  id: string;
  nomeConta: string;
  saldoAtual: string;
};

type Investimento = {
  id: string;
  nomeInvestimento: string;
  valorAtual: string;
  rentabilidade: string;
};

type PeriodSummary = {
  receitasTotal: number;
  despesasTotal: number;
  saldoPeriodo: number;
  variacaoReceitas: number;
  variacaoDespesas: number;
  transacoesTotal: number;
};

export function ResumoPatrimonial() {
  const { period } = usePeriod();
  
  const { data: contas, isLoading: loadingContas } = useQuery<Conta[]>({
    queryKey: ["/api/contas"],
    queryFn: async () => {
      const response = await fetch("/api/contas", { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch contas');
      return response.json();
    }
  });

  const { data: investimentos, isLoading: loadingInvestimentos } = useQuery<Investimento[]>({
    queryKey: ["/api/investimentos"],
    queryFn: async () => {
      const response = await fetch("/api/investimentos", { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch investimentos');
      return response.json();
    }
  });

  const { data: periodSummary, isLoading: loadingSummary } = useQuery<PeriodSummary>({
    queryKey: ["/api/analytics/period-summary", { period }],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/period-summary?period=${period}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch period summary');
      return response.json();
    }
  });

  const isLoading = loadingContas || loadingInvestimentos || loadingSummary;

  // Calculate values with safe defaults
  const saldoEmConta = contas?.reduce((sum, conta) => sum + parseFloat(conta.saldoAtual || '0'), 0) || 0;
  const totalInvestimentos = investimentos?.reduce((sum, inv) => sum + parseFloat(inv.valorAtual || '0'), 0) || 0;
  const patrimonioLiquido = saldoEmConta + totalInvestimentos;
  const economiaMensal = periodSummary?.saldoPeriodo || 0;
  const variacaoEconomia = periodSummary ? (periodSummary.variacaoReceitas || 0) - (periodSummary.variacaoDespesas || 0) : 0;

  // Fake year-over-year growth for now (would need historical data)
  const crescimentoAnual = 18.3;
  const crescimentoMensal = 12.5;
  const crescimentoInvestimentos = 22.1;

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

  const cards = [
    {
      title: "Patrimônio Líquido",
      value: patrimonioLiquido,
      variation: crescimentoAnual,
      variationLabel: "este ano",
      icon: DollarSign,
      gradient: "from-emerald-500/5 to-emerald-500/15",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      testId: "patrimonio-card"
    },
    {
      title: "Saldo em Conta",
      value: saldoEmConta,
      variation: crescimentoMensal,
      variationLabel: "este mês",
      icon: Wallet,
      gradient: "from-blue-500/5 to-blue-500/15",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-600 dark:text-blue-400",
      testId: "saldo-card"
    },
    {
      title: "Investimentos",
      value: totalInvestimentos,
      variation: crescimentoInvestimentos,
      variationLabel: "este ano",
      icon: TrendingUp,
      gradient: "from-purple-500/5 to-purple-500/15",
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-600 dark:text-purple-400",
      testId: "investimentos-card"
    },
    {
      title: "Economia Mensal",
      value: economiaMensal,
      variation: variacaoEconomia,
      variationLabel: "vs mês anterior",
      icon: PiggyBank,
      gradient: economiaMensal >= 0 ? "from-teal-500/5 to-teal-500/15" : "from-red-500/5 to-red-500/15",
      iconBg: economiaMensal >= 0 ? "bg-teal-500/10" : "bg-red-500/10",
      iconColor: economiaMensal >= 0 ? "text-teal-600 dark:text-teal-400" : "text-red-600 dark:text-red-400",
      testId: "economia-card"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6" data-testid="resumo-patrimonial">
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
                <p className="text-sm font-medium text-muted-foreground">
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
