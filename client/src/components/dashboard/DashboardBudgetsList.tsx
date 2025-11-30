import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { SpendingLimit } from "@shared/schema";

interface BudgetWithSpent extends SpendingLimit {
  spent: string;
  percent: string;
  status: 'ok' | 'atenção' | 'estourado';
}

interface DashboardBudgetsListProps {
  budgets?: BudgetWithSpent[];
  isLoading?: boolean;
  onViewAll?: () => void;
}

export function DashboardBudgetsList({ budgets = [], isLoading, onViewAll }: DashboardBudgetsListProps) {
  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const getStatusColor = (status: 'ok' | 'atenção' | 'estourado') => {
    switch (status) {
      case 'ok':
        return 'bg-emerald-500';
      case 'atenção':
        return 'bg-yellow-500';
      case 'estourado':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: 'ok' | 'atenção' | 'estourado') => {
    switch (status) {
      case 'ok':
        return 'Dentro do limite';
      case 'atenção':
        return 'Atenção';
      case 'estourado':
        return 'Estourado';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <Card className="p-4 rounded-xl shadow-sm">
        <CardContent className="p-0 space-y-4">
          <Skeleton className="h-6 w-32" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const displayBudgets = budgets.slice(0, 5);

  if (displayBudgets.length === 0) {
    return (
      <Card className="p-4 rounded-xl shadow-sm">
        <CardContent className="p-0 space-y-3">
          <h3 className="text-base font-semibold">Orçamentos por Categoria</h3>
          <p className="text-sm text-muted-foreground">
            Nenhum orçamento configurado para este período.
          </p>
          {onViewAll && (
            <Button variant="outline" size="sm" onClick={onViewAll} className="w-full">
              Configurar Orçamentos
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="p-4 rounded-xl shadow-sm">
      <CardContent className="p-0 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Orçamentos por Categoria</h3>
          {onViewAll && (
            <Button variant="ghost" size="sm" onClick={onViewAll} className="h-auto p-1 text-xs">
              Ver todos
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {displayBudgets.map((budget) => {
            const spent = parseFloat(budget.spent || '0');
            const limit = parseFloat(budget.valorLimite || '0');
            const percent = parseFloat(budget.percent || '0');
            const statusColor = getStatusColor(budget.status);
            const statusLabel = getStatusLabel(budget.status);

            return (
              <div
                key={budget.id}
                className="space-y-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                data-testid={`budget-item-${budget.id}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">
                    {budget.categoria || 'Sem categoria'}
                  </span>
                  <Badge
                    variant={budget.status === 'estourado' ? 'destructive' : budget.status === 'atenção' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {statusLabel}
                  </Badge>
                </div>

                <Progress
                  value={Math.min(percent, 100)}
                  className="h-2"
                />

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {formatCurrency(spent)} de {formatCurrency(limit)} ({percent.toFixed(1)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

