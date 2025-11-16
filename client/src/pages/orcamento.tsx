import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Wallet, Plus, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePeriod } from "@/contexts/PeriodContext";
import { apiRequest, queryClient } from "@/lib/queryClient";

type SpendingLimit = {
  id: string;
  userId: string;
  categoria: string;
  limite: string;
  periodo: 'mensal' | 'semanal' | 'anual';
};

type CategoryData = {
  categoria: string;
  total: number;
  percentual: number;
};

export default function Orcamento() {
  const { period } = usePeriod();

  const { data: limits, isLoading: loadingLimits } = useQuery<SpendingLimit[]>({
    queryKey: ["/api/spending-limits"],
  });

  const { data: despesas, isLoading: loadingDespesas } = useQuery<CategoryData[]>({
    queryKey: ["/api/analytics/expenses-by-category", { period }],
  });

  const isLoading = loadingLimits || loadingDespesas;

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  // Match spending limits with actual spending
  const orcamentoComGastos = limits?.map(limit => {
    const gastoCategoria = despesas?.find(d => d.categoria === limit.categoria);
    const gastoAtual = gastoCategoria?.total || 0;
    const limiteValor = parseFloat(limit.limite);
    const percentualUsado = limiteValor > 0 ? (gastoAtual / limiteValor) * 100 : 0;
    const status = percentualUsado >= 100 ? 'excedido' : percentualUsado >= 80 ? 'alerta' : 'ok';
    
    return {
      ...limit,
      gastoAtual,
      limiteValor,
      percentualUsado,
      status,
    };
  }) || [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Orçamento</h1>
          <p className="text-muted-foreground">
            Gerencie seus limites de gastos por categoria
          </p>
        </div>
        <Button data-testid="button-add-limit">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Limite
        </Button>
      </div>

      {/* Budget Overview */}
      {orcamentoComGastos.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {orcamentoComGastos.map((item, index) => (
            <Card 
              key={item.id} 
              className={`p-6 ${item.status === 'excedido' ? 'border-red-500/50' : item.status === 'alerta' ? 'border-orange-500/50' : ''}`}
              data-testid={`orcamento-card-${index}`}
            >
              <CardContent className="p-0">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{item.categoria}</h3>
                      {item.status === 'excedido' && (
                        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Período: {item.periodo}
                    </p>
                  </div>
                  <Wallet className="h-6 w-6 text-muted-foreground" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Gasto atual</span>
                    <span className="font-semibold">
                      R$ {item.gastoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Limite</span>
                    <span className="font-semibold">
                      R$ {item.limiteValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  
                  <Progress 
                    value={Math.min(item.percentualUsado, 100)} 
                    className="h-2"
                  />
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${
                      item.status === 'excedido' ? 'text-red-600 dark:text-red-400' : 
                      item.status === 'alerta' ? 'text-orange-600 dark:text-orange-400' : 
                      'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {item.percentualUsado.toFixed(1)}% usado
                    </span>
                    {item.percentualUsado < 100 && (
                      <span className="text-sm text-muted-foreground">
                        Restam R$ {(item.limiteValor - item.gastoAtual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                    {item.percentualUsado >= 100 && (
                      <span className="text-sm text-red-600 dark:text-red-400">
                        Excedido em R$ {(item.gastoAtual - item.limiteValor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum orçamento configurado</h3>
            <p className="text-muted-foreground mb-6">
              Comece definindo limites de gastos para suas categorias
            </p>
            <Button data-testid="button-add-first-limit">
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Orçamento
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
