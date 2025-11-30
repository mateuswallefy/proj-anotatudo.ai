import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Goal } from "@shared/schema";

interface MonthlySavings {
  id: string;
  targetAmount: string;
  savedAmount: string;
  year: number;
  month: number;
}

interface DashboardGoalsStripProps {
  savingGoals?: Goal[];
  monthlySavings?: MonthlySavings;
  isLoading?: boolean;
  onCreateGoal?: () => void;
}

export function DashboardGoalsStrip({
  savingGoals = [],
  monthlySavings,
  isLoading,
  onCreateGoal,
}: DashboardGoalsStripProps) {
  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide -mx-4 px-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-[280px] rounded-2xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  const activeGoals = savingGoals.filter(g => g.status === 'ativa').slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Metas */}
      <div>
        <h3 className="text-base font-semibold mb-3 px-1">Metas & Economias</h3>
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide -mx-4 px-4">
          {activeGoals.map((goal) => {
            const valorAtual = parseFloat(goal.valorAtual || '0');
            const valorAlvo = parseFloat(goal.valorAlvo || '1');
            const percent = valorAlvo > 0 ? (valorAtual / valorAlvo) * 100 : 0;
            const dataFim = formatDate(goal.dataFim);

            return (
              <Card
                key={goal.id}
                className="p-4 rounded-xl shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/30 flex-shrink-0 w-[280px] hover-elevate"
                data-testid={`goal-card-${goal.id}`}
              >
                <CardContent className="p-0 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold truncate">{goal.nome}</h4>
                      {goal.descricao && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {goal.descricao}
                        </p>
                      )}
                    </div>
                    <Target className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 ml-2" />
                  </div>

                  <div className="space-y-1.5">
                    <Progress value={Math.min(percent, 100)} className="h-2" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">
                        {formatCurrency(valorAtual)} de {formatCurrency(valorAlvo)}
                      </span>
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        {percent.toFixed(0)}%
                      </Badge>
                    </div>
                  </div>

                  {dataFim && (
                    <p className="text-xs text-muted-foreground">
                      Até {dataFim}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Card de criar meta */}
          <Card
            className="p-4 rounded-xl shadow-sm border-2 border-dashed border-muted-foreground/30 flex-shrink-0 w-[280px] hover:border-primary/50 transition-colors cursor-pointer"
            onClick={onCreateGoal}
            data-testid="create-goal-card"
          >
            <CardContent className="p-0 h-full flex flex-col items-center justify-center space-y-2">
              <div className="p-3 rounded-full bg-primary/10">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-center">Criar meta</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Economias do mês */}
      {monthlySavings && parseFloat(monthlySavings.targetAmount || '0') > 0 && (
        <Card className="p-4 rounded-xl shadow-sm bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-100 dark:border-purple-900/30">
          <CardContent className="p-0 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Economias do Mês</h4>
              <Badge variant="outline" className="text-xs">
                {monthlySavings.month}/{monthlySavings.year}
              </Badge>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">
                  {formatCurrency(monthlySavings.savedAmount)} de {formatCurrency(monthlySavings.targetAmount)}
                </span>
                {(() => {
                  const saved = parseFloat(monthlySavings.savedAmount || '0');
                  const target = parseFloat(monthlySavings.targetAmount || '1');
                  const percent = target > 0 ? (saved / target) * 100 : 0;
                  return (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                      {percent.toFixed(0)}%
                    </Badge>
                  );
                })()}
              </div>
              <Progress
                value={(() => {
                  const saved = parseFloat(monthlySavings.savedAmount || '0');
                  const target = parseFloat(monthlySavings.targetAmount || '1');
                  const percent = target > 0 ? (saved / target) * 100 : 0;
                  return Math.min(percent, 100);
                })()}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

