import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CardContainer } from "@/components/design-system/CardContainer";
import { SectionTitle } from "@/components/design-system/SectionTitle";

interface Goal {
  id: string;
  nome: string;
  valorAlvo: string;
  valorAtual: string;
  dataFim?: string | null;
}

interface GoalsPreviewProps {
  goals?: Goal[];
  isLoading?: boolean;
  onCreateGoal?: () => void;
}

// Mock data function - isolado para fácil substituição
function getMockGoals(): Goal[] {
  return [];
}

export function GoalsPreview({
  goals,
  isLoading = false,
  onCreateGoal,
}: GoalsPreviewProps) {
  const displayGoals = goals && goals.length > 0 ? goals : getMockGoals();

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num || 0);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    } catch {
      return null;
    }
  };

  if (isLoading) {
    return (
      <CardContainer className="p-4 md:p-5">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-36 w-[280px] rounded-xl flex-shrink-0" />
          ))}
        </div>
      </CardContainer>
    );
  }

  return (
    <CardContainer className="p-4 md:p-5" hover glow glowColor="green">
      <SectionTitle>Metas & Economias</SectionTitle>

      {displayGoals.length === 0 ? (
        <div className="text-center py-8">
          <Target className="h-12 w-12 mx-auto mb-3 text-[var(--text-secondary)]" />
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Nenhuma meta criada ainda
          </p>
          <Button
            onClick={onCreateGoal}
            className="bg-[var(--accent-green)] hover:bg-[var(--accent-green)]/90 text-white dark:bg-[var(--accent-green)] dark:hover:bg-[var(--accent-green)]/80"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar primeira meta
          </Button>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible">
          {displayGoals.slice(0, 3).map((goal) => {
            const valorAtual = parseFloat(goal.valorAtual || '0');
            const valorAlvo = parseFloat(goal.valorAlvo || '1');
            const percent = valorAlvo > 0 ? (valorAtual / valorAlvo) * 100 : 0;
            const dataFim = formatDate(goal.dataFim);

            return (
              <CardContainer
                key={goal.id}
                className="p-4 flex-shrink-0 w-[280px] md:w-full"
                hover
                glow
                glowColor="green"
                data-testid={`goal-card-${goal.id}`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] flex-1">
                      {goal.nome}
                    </h4>
                    <Target className="h-4 w-4 text-[var(--accent-blue)] flex-shrink-0 ml-2" />
                  </div>

                  <div className="space-y-2">
                    <Progress value={Math.min(percent, 100)} className="h-2" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[var(--text-primary)]">
                        {formatCurrency(valorAtual)} de {formatCurrency(valorAlvo)}
                      </span>
                      <Badge variant="secondary" className="text-xs px-2 py-0">
                        {percent.toFixed(0)}%
                      </Badge>
                    </div>
                  </div>

                  {dataFim && (
                    <p className="text-xs text-[var(--text-secondary)]">
                      Até {dataFim}
                    </p>
                  )}
                </div>
              </CardContainer>
            );
          })}
        </div>
      )}
    </CardContainer>
  );
}
