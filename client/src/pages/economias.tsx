import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PiggyBank, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePeriod } from "@/contexts/PeriodContext";

type CategoryData = {
  categoria: string;
  total: number;
  percentual: number;
};

type PeriodSummary = {
  totalReceitas: number;
  totalDespesas: number;
  saldoPeriodo: number;
};

export default function Economias() {
  const { period } = usePeriod();

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
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const totalReceitas = periodSummary?.totalReceitas || 0;
  const totalDespesas = periodSummary?.totalDespesas || 0;
  const economia = totalReceitas - totalDespesas;
  const taxaEconomia = totalReceitas > 0 ? (economia / totalReceitas) * 100 : 0;

  // Calculate savings by category (where you saved money)
  const economiasPorCategoria = receitas?.map(receita => {
    const despesaCategoria = despesas?.find(d => d.categoria === receita.categoria);
    const despesaTotal = despesaCategoria?.total || 0;
    const economiaCategoria = receita.total - despesaTotal;
    
    return {
      categoria: receita.categoria,
      economia: economiaCategoria,
      percentual: totalReceitas > 0 ? (economiaCategoria / totalReceitas) * 100 : 0,
    };
  }).filter(e => e.economia > 0) || [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Suas Economias</h1>
        <p className="text-muted-foreground">
          Acompanhe onde você está economizando dinheiro
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-emerald-500/5 to-emerald-500/15">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-muted-foreground">Economia Mensal</p>
              <PiggyBank className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-3xl font-bold" data-testid="economia-total">
              R$ {economia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {economia >= 0 ? 'Economia positiva' : 'Déficit'}
            </p>
          </CardContent>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-teal-500/5 to-teal-500/15">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-muted-foreground">Taxa de Economia</p>
              <TrendingUp className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            </div>
            <p className="text-3xl font-bold" data-testid="taxa-economia">
              {taxaEconomia.toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Da renda mensal
            </p>
          </CardContent>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-500/5 to-blue-500/15">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-muted-foreground">Categorias Positivas</p>
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-3xl font-bold" data-testid="categorias-positivas">
              {economiasPorCategoria.length}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Com economia
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Savings Breakdown */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle>Economia por Categoria</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="space-y-4">
            {economiasPorCategoria.length > 0 ? (
              economiasPorCategoria.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-card border hover-elevate">
                  <div className="flex-1">
                    <p className="font-semibold">{item.categoria}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.percentual.toFixed(0)}% da economia total
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      R$ {item.economia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma economia registrada neste período
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
