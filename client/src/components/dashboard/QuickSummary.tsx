import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { usePeriod } from "@/contexts/PeriodContext";
import { Skeleton } from "@/components/ui/skeleton";

type PeriodSummary = {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
};

export function QuickSummary() {
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
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const entradas = periodSummary?.totalReceitas || 0;
  const despesas = periodSummary?.totalDespesas || 0;
  const saldo = periodSummary?.saldo || 0;

  // Placeholder para gráfico simples (pode ser substituído por componente de gráfico real)
  const chartHeight = 120;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Resumo rápido do mês</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Gráfico placeholder simples */}
        <div className="mb-4">
          <div className="relative h-32 bg-muted/30 rounded-lg p-4 flex items-end justify-center gap-2">
            {/* Barra de entradas */}
            <div className="flex flex-col items-center gap-1 flex-1">
              <div 
                className="w-full bg-emerald-500 rounded-t transition-all"
                style={{ height: `${Math.max(10, (entradas / (entradas + Math.abs(despesas))) * 100)}%` }}
              />
              <span className="text-xs text-muted-foreground">Entradas</span>
            </div>
            
            {/* Barra de despesas */}
            <div className="flex flex-col items-center gap-1 flex-1">
              <div 
                className="w-full bg-orange-500 rounded-t transition-all"
                style={{ height: `${Math.max(10, (Math.abs(despesas) / (entradas + Math.abs(despesas))) * 100)}%` }}
              />
              <span className="text-xs text-muted-foreground">Despesas</span>
            </div>
          </div>
        </div>

        {/* Resumo numérico */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Entradas</p>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              R$ {entradas.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Despesas</p>
            <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
              R$ {despesas.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Saldo</p>
            <p className={`text-sm font-semibold ${saldo >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

