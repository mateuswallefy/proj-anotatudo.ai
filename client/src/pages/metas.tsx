import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, Plus, CheckCircle, PiggyBank, Clock, Filter, CalendarIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from "@/components/cards/MetricCard";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { usePeriod } from "@/contexts/PeriodContext";
import type { Goal } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PageHeader, PremiumButton, AppCard, SectionTitle, DataBadge, PremiumInput } from "@/components/design-system";

const formSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  valorObjetivo: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
  valorAtual: z.coerce.number().min(0).optional().default(0),
  dataFim: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Função global de normalização de datas para evitar problemas de timezone
const normalizeDate = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

export default function Metas() {
  const { period } = usePeriod();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { data: goals, isLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      valorObjetivo: 0,
      valorAtual: 0,
      dataFim: "",
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const today = new Date().toISOString().split('T')[0];
      const payload = {
        nome: data.nome,
        valorAlvo: data.valorObjetivo.toString(),
        dataInicio: today,
        dataFim: data.dataFim || undefined,
      };
      return await apiRequest("POST", "/api/goals", payload);
    },
    onSuccess: () => {
      toast({
        title: "Meta criada com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar meta",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    createGoalMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="space-y-8 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const allGoals = goals || [];
  const activeGoals = goals?.filter(g => g.status === 'ativa') || [];
  const completedGoals = goals?.filter(g => g.status === 'concluida') || [];
  const currentYear = new Date().getFullYear();
  const completedThisYear = completedGoals.filter(g => {
    if (!g.createdAt) return false;
    const createdYear = new Date(g.createdAt).getFullYear();
    return createdYear === currentYear;
  });

  const totalSaved = allGoals.reduce((sum, goal) => {
    return sum + parseFloat(goal.valorAtual || '0');
  }, 0);

  const nextDeadlineGoal = activeGoals
    .filter(g => g.dataFim)
    .sort((a, b) => {
      const dateA = new Date(a.dataFim!).getTime();
      const dateB = new Date(b.dataFim!).getTime();
      return dateA - dateB;
    })[0];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getProgressColor = (progresso: number, isCompleted: boolean) => {
    if (isCompleted) return "bg-emerald-500";
    if (progresso >= 75) return "bg-blue-500";
    if (progresso >= 50) return "bg-purple-500";
    return "bg-primary";
  };

  return (
    <div className="min-h-screen bg-background" data-testid="page-metas">
      <div className="space-y-8 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Premium Header */}
        <PageHeader
          title="Metas Financeiras"
          subtitle="Defina e acompanhe seus objetivos financeiros"
          action={
            <PremiumButton
              size="lg"
              data-testid="button-add-goal"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-5 w-5 mr-2" />
              Nova Meta
            </PremiumButton>
          }
        />

        {/* Statistics Cards - Premium Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6" data-testid="statistics-section">
          <MetricCard
            icon={Target}
            label="Total de Metas"
            value={activeGoals.length}
            subtitle="Ativas"
            iconColor="text-blue-600 dark:text-blue-400"
            iconBg="bg-blue-500/10"
            data-testid="card-total-metas"
          />
          <MetricCard
            icon={CheckCircle}
            label="Metas Atingidas"
            value={completedThisYear.length}
            subtitle="Este ano"
            iconColor="text-purple-600 dark:text-purple-400"
            iconBg="bg-purple-500/10"
            data-testid="card-metas-atingidas"
          />
          <MetricCard
            icon={PiggyBank}
            label="Total Poupado"
            value={formatCurrency(totalSaved)}
            subtitle="Todas as metas"
            iconColor="text-emerald-600 dark:text-emerald-400"
            iconBg="bg-emerald-500/10"
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
            iconColor="text-orange-600 dark:text-orange-400"
            iconBg="bg-orange-500/10"
            data-testid="card-proximo-prazo"
          />
        </div>

        {/* Goals List Section - Premium Design */}
        <div className="space-y-6" data-testid="goals-list-section">
          <SectionTitle
            title="Todas as Metas"
            subtitle={`${allGoals.length} ${allGoals.length === 1 ? 'meta' : 'metas'}`}
            action={
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-2" data-testid="button-filter">
                <Filter className="h-4 w-4" />
              </Button>
            }
          />

          {allGoals && allGoals.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {allGoals.map((goal, index) => {
                const valorAtual = parseFloat(goal.valorAtual || '0');
                const valorAlvo = parseFloat(goal.valorAlvo);
                const progresso = valorAlvo > 0 ? (valorAtual / valorAlvo) * 100 : 0;
                const faltam = Math.max(0, valorAlvo - valorAtual);
                const isCompleted = goal.status === 'concluida';
                const borderAccent = isCompleted ? "emerald" : progresso >= 75 ? "blue" : "purple";
                
                return (
                  <AppCard
                    key={goal.id}
                    className="p-5 md:p-6"
                    borderAccent={borderAccent}
                    hover
                    data-testid={`goal-card-${index}`}
                  >
                    <div className="space-y-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex gap-2 mb-3 flex-wrap">
                            {isCompleted && (
                              <DataBadge
                                variant="default"
                                color="hsl(142, 71%, 45%)"
                                icon={<CheckCircle className="h-3 w-3" />}
                                data-testid={`badge-completed-${index}`}
                              >
                                Concluída
                              </DataBadge>
                            )}
                            {goal.prioridade && (
                              <DataBadge
                                variant="outline"
                                color={
                                  goal.prioridade === 'alta' ? 'hsl(0, 72%, 51%)' :
                                  goal.prioridade === 'media' ? 'hsl(25, 95%, 53%)' :
                                  'hsl(217, 91%, 60%)'
                                }
                                data-testid={`badge-priority-${index}`}
                              >
                                {goal.prioridade === 'alta' ? 'Alta' : goal.prioridade === 'media' ? 'Média' : 'Baixa'}
                              </DataBadge>
                            )}
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Target className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base md:text-lg mb-1" data-testid={`goal-name-${index}`}>
                                {goal.nome}
                              </h3>
                              {goal.descricao && (
                                <p className="text-sm text-muted-foreground" data-testid={`goal-description-${index}`}>
                                  {goal.descricao}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-semibold" data-testid={`goal-progress-${index}`}>
                            {progresso.toFixed(0)}%
                          </span>
                        </div>
                        <Progress 
                          value={Math.min(progresso, 100)} 
                          className="h-3 rounded-full"
                          indicatorClassName={getProgressColor(progresso, isCompleted)}
                          data-testid={`progress-bar-${index}`} 
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4 pt-2">
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">Atual</p>
                          <p className="font-semibold font-mono tabular-nums text-sm" data-testid={`goal-current-${index}`}>
                            {formatCurrency(valorAtual)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs mb-1">Faltam</p>
                          <p className="font-semibold font-mono tabular-nums text-sm text-orange-600 dark:text-orange-400" data-testid={`goal-remaining-${index}`}>
                            {formatCurrency(faltam)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground text-xs mb-1">Meta</p>
                          <p className="font-semibold font-mono tabular-nums text-sm" data-testid={`goal-target-${index}`}>
                            {formatCurrency(valorAlvo)}
                          </p>
                        </div>
                      </div>

                      {goal.dataFim && (
                        <div className="pt-3 border-t border-border/50">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <CalendarIcon className="w-3.5 h-3.5" />
                              Prazo
                            </span>
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
                    </div>
                  </AppCard>
                );
              })}
            </div>
          ) : (
            <AppCard className="p-12 md:p-16">
              <div className="text-center">
                <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Target className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2" data-testid="empty-title">
                  Nenhuma meta cadastrada
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto" data-testid="empty-description">
                  Comece definindo suas metas financeiras para acompanhar seu progresso
                </p>
                <PremiumButton 
                  data-testid="button-add-first-goal"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Criar Primeira Meta
                </PremiumButton>
              </div>
            </AppCard>
          )}
        </div>

        {/* Premium Nova Meta Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent data-testid="dialog-nova-meta">
            <div className="space-y-4 md:space-y-6">
              <DialogHeader>
                <DialogTitle className="text-xl md:text-2xl font-bold tracking-tight" data-testid="dialog-title">Nova Meta Financeira</DialogTitle>
                <DialogDescription className="text-sm md:text-base" data-testid="dialog-description">
                  Defina uma nova meta financeira para acompanhar seu progresso
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Nome da Meta</FormLabel>
                      <FormControl>
                        <PremiumInput 
                          placeholder="Ex: Viagem para Europa" 
                          data-testid="input-nome"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="valorObjetivo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">Valor Objetivo (R$)</FormLabel>
                        <FormControl>
                          <PremiumInput 
                            type="number" 
                            step="0.01" 
                            min="0.01"
                            placeholder="0,00" 
                            className="font-mono"
                            data-testid="input-valor-objetivo"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="valorAtual"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">Valor Atual (R$)</FormLabel>
                        <FormControl>
                          <PremiumInput 
                            type="number" 
                            step="0.01" 
                            min="0"
                            placeholder="0,00" 
                            className="font-mono"
                            data-testid="input-valor-atual"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="dataFim"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-sm font-semibold">Data Limite (opcional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full h-11 md:h-12 pl-3 text-left font-normal rounded-xl border-2",
                                !field.value && "text-muted-foreground"
                              )}
                              data-testid="button-date-picker"
                            >
                              {field.value ? (
                                format(new Date(field.value), "dd/MM/yyyy")
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const normalized = normalizeDate(date);
                                field.onChange(normalized.toISOString().split('T')[0]);
                              } else {
                                field.onChange("");
                              }
                            }}
                            disabled={(date) => {
                              const today = normalizeDate(new Date());
                              return normalizeDate(date) < today;
                            }}
                            initialFocus
                            data-testid="calendar-data-fim"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <PremiumButton 
                    type="button" 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                    className="w-full md:w-auto h-11 md:h-12 px-6"
                    data-testid="button-cancel"
                  >
                    Cancelar
                  </PremiumButton>
                  <PremiumButton 
                    type="submit" 
                    disabled={createGoalMutation.isPending}
                    className="w-full md:w-auto h-11 md:h-12 px-6"
                    data-testid="button-submit"
                  >
                    {createGoalMutation.isPending ? "Criando..." : "Criar Meta"}
                  </PremiumButton>
                </DialogFooter>
                </form>
              </Form>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
