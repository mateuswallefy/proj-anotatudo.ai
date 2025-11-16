import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, Plus, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Goal } from "@shared/schema";

export default function Metas() {
  const { data: goals, isLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Metas Financeiras</h1>
          <p className="text-muted-foreground">
            Acompanhe o progresso das suas metas financeiras
          </p>
        </div>
        <Button data-testid="button-add-goal">
          <Plus className="h-4 w-4 mr-2" />
          Nova Meta
        </Button>
      </div>

      {/* Goals Grid */}
      {goals && goals.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {goals.map((goal, index) => {
            const valorAtual = parseFloat(goal.valorAtual);
            const valorAlvo = parseFloat(goal.valorAlvo);
            const progresso = valorAlvo > 0 ? (valorAtual / valorAlvo) * 100 : 0;
            const faltam = valorAlvo - valorAtual;
            
            const prioridadeColor = goal.prioridade === 'alta' 
              ? 'border-red-500/50' 
              : goal.prioridade === 'media' 
                ? 'border-orange-500/50' 
                : 'border-blue-500/50';
            
            return (
              <Card
                key={goal.id}
                className={`p-6 ${prioridadeColor} hover-elevate active-elevate-2`}
                data-testid={`meta-card-${index}`}
              >
                <CardContent className="p-0">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{goal.nome}</h3>
                      {goal.descricao && (
                        <p className="text-sm text-muted-foreground">{goal.descricao}</p>
                      )}
                    </div>
                    <Target className="h-6 w-6 text-muted-foreground" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-1">Progresso</p>
                        <p className="text-2xl font-bold">
                          {progresso.toFixed(0)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-1">Prazo</p>
                        <p className="font-semibold">
                          {goal.dataFim ? new Date(goal.dataFim).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : '-'}
                        </p>
                      </div>
                    </div>

                    <Progress value={Math.min(progresso, 100)} className="h-2" />

                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-muted-foreground">Atual</p>
                        <p className="font-semibold">
                          R$ {valorAtual.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Faltam</p>
                        <p className="font-semibold text-orange-600 dark:text-orange-400">
                          R$ {faltam.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">Meta</p>
                        <p className="font-semibold">
                          R$ {valorAlvo.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>

                    {goal.prioridade && (
                      <div className="pt-3 border-t border-border">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          goal.prioridade === 'alta' ? 'bg-red-500/10 text-red-700 dark:text-red-400' :
                          goal.prioridade === 'media' ? 'bg-orange-500/10 text-orange-700 dark:text-orange-400' :
                          'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                        }`}>
                          Prioridade {goal.prioridade}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma meta cadastrada</h3>
            <p className="text-muted-foreground mb-6">
              Comece definindo suas metas financeiras para acompanhar seu progresso
            </p>
            <Button data-testid="button-add-first-goal">
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Meta
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
