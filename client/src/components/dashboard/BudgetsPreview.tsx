import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CardContainer } from "@/components/design-system/CardContainer";
import { SectionTitle } from "@/components/design-system/SectionTitle";

interface Budget {
  id: string;
  categoria: string;
  spent: number;
  limit: number;
  percent: number;
  status?: 'ok' | 'atenção' | 'estourado';
}

interface BudgetsPreviewProps {
  budgets?: Budget[];
  isLoading?: boolean;
  onConfigure?: () => void;
}

// Mock data function - isolado para fácil substituição
function getMockBudgets(): Budget[] {
  return [];
}

export function BudgetsPreview({
  budgets,
  isLoading = false,
  onConfigure,
}: BudgetsPreviewProps) {
  const displayBudgets = budgets && budgets.length > 0 ? budgets : getMockBudgets();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getStatusColor = (percent: number) => {
    if (percent < 70) return 'bg-[var(--accent-green)]';
    if (percent <= 100) return 'bg-[var(--accent-orange)]';
    return 'bg-[#EF4444]';
  };

  const getStatusLabel = (percent: number) => {
    if (percent < 70) return 'Dentro do limite';
    if (percent <= 100) return 'Atenção';
    return 'Estourou';
  };

  if (isLoading) {
    return (
      <CardContainer className="p-4 md:p-5">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </CardContainer>
    );
  }

  return (
    <CardContainer className="p-4 md:p-5" hover>
      <SectionTitle>Orçamentos por Categoria</SectionTitle>

      {displayBudgets.length === 0 ? (
        <div className="text-center py-8">
          <Settings className="h-12 w-12 mx-auto mb-3 text-[var(--text-secondary)]" />
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Nenhum orçamento configurado
          </p>
          <Button
            onClick={onConfigure}
            variant="outline"
            size="sm"
            className="border-[var(--accent-green)] text-[var(--accent-green)] hover:bg-[var(--accent-green)] hover:text-white dark:border-[var(--accent-green)] dark:text-[var(--accent-green)]"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurar orçamentos
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {displayBudgets.slice(0, 3).map((budget) => {
            const statusColor = getStatusColor(budget.percent);
            const statusLabel = getStatusLabel(budget.percent);

            return (
              <div
                key={budget.id}
                className="p-3 rounded-lg bg-[var(--card-contrast)] hover:bg-[var(--card-contrast)]/80 transition-colors"
                data-testid={`budget-item-${budget.id}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-[var(--text-primary)] capitalize">
                    {budget.categoria || 'Sem categoria'}
                  </span>
                  <Badge
                    variant={
                      budget.percent >= 100
                        ? 'destructive'
                        : budget.percent >= 70
                        ? 'default'
                        : 'secondary'
                    }
                    className="text-xs"
                  >
                    {statusLabel}
                  </Badge>
                </div>

                <div className="mb-2">
                  <Progress
                    value={Math.min(budget.percent, 100)}
                    className="h-2"
                  />
                </div>

                <p className="text-xs text-[var(--text-secondary)]">
                  {formatCurrency(budget.spent)} de {formatCurrency(budget.limit)} (
                  {budget.percent.toFixed(1)}%)
                </p>
              </div>
            );
          })}
          {displayBudgets.length > 3 && (
            <Button
              onClick={onConfigure}
              variant="ghost"
              size="sm"
              className="w-full text-[var(--accent-blue)] hover:text-[var(--accent-blue)]/80"
            >
              Ver todos os orçamentos
            </Button>
          )}
        </div>
      )}
    </CardContainer>
  );
}
