import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, Plus, CheckCircle, PiggyBank, Clock, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from "@/components/cards/MetricCard";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { usePeriod } from "@/contexts/PeriodContext";
import type { Goal } from "@shared/schema";

export default function Metas() {
  const { period } = usePeriod();
  
  const { data: goals, isLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals", period],
  });

  if (isLoading) {
    return (
      <div className="space-y-8 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const activeGoals = goals?.filter(g => g.status === 'ativa') || [];
  const completedGoals = goals?.filter(g => g.status === 'concluida') || [];
  const currentYear = new Date().getFullYear();
  const completedThisYear = completedGoals.filter(g => {
    if (!g.createdAt) return false;
    const createdYear = new Date(g.createdAt).getFullYear();
    return createdYear === currentYear;
  });

  const totalSaved = activeGoals.reduce((sum, goal) => {
    return sum + parseFloat(goal.valorAtual || '0');
  }, 0);

  const nextDeadlineGoal = activeGoals
    .filter(g => g.dataFim)
    .sort((a, b) => {
      const dateA = new Date(a.dataFim!).getTime();
      const dateB = new Date(b.dataFim!).getTime();
      return dateA - dateB;
    })[0];

  return (
    <div className="space-y-8 p-6" data-testid="page-metas">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div data-testid="header-section">
          <h1 className="text-3xl font-bold tracking-tight mb-2" data-testid="title-metas">
            Metas Financeiras
          </h1>
          <p className="text-muted-foreground" data-testid="subtitle-metas">
            Defina e acompanhe seus objetivos financeiros
          </p>
        </div>
        <Button 
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 no-default-hover-elevate"
          data-testid="button-add-goal"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Meta
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="statistics-section">
        <MetricCard
          icon={Target}
          label="Total de Metas"
          value={activeGoals.length}
          subtitle="Ativas"
          iconColor="text-blue-600"
          iconBg="bg-blue-600/10"
          data-testid="card-total-metas"
        />
        <MetricCard
          icon={CheckCircle}
          label="Metas Atingidas"
          value={completedThisYear.length}
          subtitle="Este ano"
          iconColor="text-purple-600"
          iconBg="bg-purple-600/10"
          data-testid="card-metas-atingidas"
        />
        <MetricCard
          icon={PiggyBank}
          label="Total Poupado"
          value={`R$ ${totalSaved.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
          subtitle="Todas as metas"
          iconColor="text-blue-600"
          iconBg="bg-blue-600/10"
          data-testid="card-total-poupado"
        />
        <MetricCard
          icon={Clock}
          label="Próximo Prazo"
          value={nextDeadlineGoal?.dataFim 
            ? new Date(nextDeadlineGoal.dataFim).toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit' }).replace('/', '-')
            : '-'
          }
          subtitle={nextDeadlineGoal?.nome || 'Nenhum prazo'}
          iconColor="text-blue-600"
          iconBg="bg-blue-600/10"
          data-testid="card-proximo-prazo"
        />
      </div>

      {/* Goals List Section */}
      <div className="space-y-6" data-testid="goals-list-section">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold" data-testid="title-todas-metas">
            Todas as Metas
          </h2>
          <Button variant="ghost" size="icon" data-testid="button-filter">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {activeGoals && activeGoals.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeGoals.map((goal, index) => {
              const valorAtual = parseFloat(goal.valorAtual);
              const valorAlvo = parseFloat(goal.valorAlvo);
              const progresso = valorAlvo > 0 ? (valorAtual / valorAlvo) * 100 : 0;
              const faltam = valorAlvo - valorAtual;
              
              return (
                <Card
                  key={goal.id}
                  className="hover-elevate active-elevate-2"
                  data-testid={`goal-card-${index}`}
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {goal.prioridade && (
                          <Badge 
                            variant={goal.prioridade === 'alta' ? 'destructive' : 'default'}
                            className={`mb-2 ${
                              goal.prioridade === 'media' ? 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20' :
                              goal.prioridade === 'baixa' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' :
                              ''
                            }`}
                            data-testid={`badge-priority-${index}`}
                          >
                            {goal.prioridade === 'alta' ? 'Alta' : goal.prioridade === 'media' ? 'Média' : 'Baixa'}
                          </Badge>
                        )}
                        <h3 className="font-semibold text-lg mb-1" data-testid={`goal-name-${index}`}>
                          {goal.nome}
                        </h3>
                        {goal.descricao && (
                          <p className="text-sm text-muted-foreground" data-testid={`goal-description-${index}`}>
                            {goal.descricao}
                          </p>
                        )}
                      </div>
                      <Target className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-semibold" data-testid={`goal-progress-${index}`}>
                          {progresso.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={Math.min(progresso, 100)} className="h-2" data-testid={`progress-bar-${index}`} />
                    </div>

                    <div className="flex items-center justify-between text-sm gap-4">
                      <div className="flex-1">
                        <p className="text-muted-foreground text-xs mb-1">Atual</p>
                        <p className="font-semibold font-mono tabular-nums" data-testid={`goal-current-${index}`}>
                          R$ {valorAtual.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div className="flex-1 text-center">
                        <p className="text-muted-foreground text-xs mb-1">Faltam</p>
                        <p className="font-semibold font-mono tabular-nums text-orange-600 dark:text-orange-400" data-testid={`goal-remaining-${index}`}>
                          R$ {faltam.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-muted-foreground text-xs mb-1">Meta</p>
                        <p className="font-semibold font-mono tabular-nums" data-testid={`goal-target-${index}`}>
                          R$ {valorAlvo.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>

                    {goal.dataFim && (
                      <div className="pt-3 border-t border-border">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Prazo</span>
                          <span className="font-medium" data-testid={`goal-deadline-${index}`}>
                            {new Date(goal.dataFim).toLocaleDateString('pt-BR', { 
                              day: '2-digit',
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12">
            <div className="text-center">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2" data-testid="empty-title">
                Nenhuma meta cadastrada
              </h3>
              <p className="text-muted-foreground mb-6" data-testid="empty-description">
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
    </div>
  );
}
