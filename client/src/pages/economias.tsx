import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PiggyBank, TrendingUp, Percent, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePeriod } from "@/contexts/PeriodContext";
import { MetricCard } from "@/components/cards/MetricCard";
import { useToast } from "@/hooks/use-toast";

type CategoryData = {
  categoria: string;
  total: number;
  percentual: number;
};

type PeriodSummary = {
  totalReceitas: number;
  totalDespesas: number;
  saldoPeriodo: number;
  variacaoReceitas: number;
  variacaoDespesas: number;
};

export default function Economias() {
  const { period } = usePeriod();
  const { toast } = useToast();

  const { data: periodSummary, isLoading: loadingSummary } = useQuery<PeriodSummary>({
    queryKey: ["/api/analytics/period-summary", { period }],
  });

  const { data: receitas, isLoading: loadingReceitas } = useQuery<CategoryData[]>({
    queryKey: ["/api/analytics/income-by-category", { period }],
  });

  const { data: despesas, isLoading: loadingDespesas } = useQuery<CategoryData[]>({
    queryKey: ["/api/analytics/expenses-by-category", { period }],
  });

  const isLoading = loadingSummary || loadingReceitas || loadingDespesas;

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const totalReceitas = periodSummary?.totalReceitas || 0;
  const totalDespesas = periodSummary?.totalDespesas || 0;
  const economia = totalReceitas - totalDespesas;
  const taxaEconomia = totalReceitas > 0 ? (economia / totalReceitas) * 100 : 0;
  const variacaoReceitas = periodSummary?.variacaoReceitas || 0;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="space-y-2" data-testid="header-economias">
        <h1 className="text-3xl font-bold tracking-tight">Economias</h1>
        <p className="text-muted-foreground">
          Acompanhe quanto você está guardando
        </p>
      </div>

      {/* CTA Button */}
      <Button
        variant="default"
        size="lg"
        data-testid="button-registrar-economia"
        onClick={() => {
          toast({
            title: "Em breve",
            description: "Esta funcionalidade será implementada em breve.",
          });
        }}
      >
        <Plus className="h-4 w-4" />
        Registrar Economia
      </Button>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={PiggyBank}
          label="Total Economizado"
          value={`R$ ${economia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle={`${taxaEconomia.toFixed(1)}% da renda`}
          iconColor="text-purple-600 dark:text-purple-400"
          iconBg="bg-purple-600/10"
          data-testid="card-total-economizado"
        />
        
        <MetricCard
          icon={TrendingUp}
          label="Este Mês"
          value={`R$ ${economia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle={variacaoReceitas >= 0 ? `+${variacaoReceitas.toFixed(1)}% vs mês anterior` : `${variacaoReceitas.toFixed(1)}% vs mês anterior`}
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-600/10"
          data-testid="card-este-mes"
        />
        
        <MetricCard
          icon={Percent}
          label="% da Renda"
          value={`${taxaEconomia.toFixed(1)}%`}
          subtitle={economia >= 0 ? `Economizando ${taxaEconomia.toFixed(1)}%` : `Gastando mais que a renda`}
          iconColor="text-purple-600 dark:text-purple-400"
          iconBg="bg-purple-600/10"
          data-testid="card-percentual-renda"
        />
      </div>

      {/* Summary Card */}
      <Card className="p-6" data-testid="card-resumo-economias">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Resumo do Período</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">Total de Receitas</p>
              <p className="text-2xl font-bold text-success" data-testid="text-total-receitas">
                R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">Total de Despesas</p>
              <p className="text-2xl font-bold text-destructive" data-testid="text-total-despesas">
                R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">Saldo do Período</p>
              <p className={`text-2xl font-bold ${economia >= 0 ? 'text-success' : 'text-destructive'}`} data-testid="text-saldo-periodo">
                R$ {economia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
