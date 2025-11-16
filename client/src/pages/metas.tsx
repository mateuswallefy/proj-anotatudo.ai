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

const formSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  valorObjetivo: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
  valorAtual: z.coerce.number().min(0).optional().default(0),
  dataFim: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

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
          variant="default"
          size="lg"
          data-testid="button-add-goal"
          onClick={() => setDialogOpen(true)}
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

        {allGoals && allGoals.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {allGoals.map((goal, index) => {
              const valorAtual = parseFloat(goal.valorAtual);
              const valorAlvo = parseFloat(goal.valorAlvo);
              const progresso = valorAlvo > 0 ? (valorAtual / valorAlvo) * 100 : 0;
              const faltam = valorAlvo - valorAtual;
              const isCompleted = goal.status === 'concluida';
              
              return (
                <Card
                  key={goal.id}
                  className={`hover-elevate active-elevate-2 ${isCompleted ? 'border-green-500/50' : ''}`}
                  data-testid={`goal-card-${index}`}
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex gap-2 mb-2 flex-wrap">
                          {isCompleted && (
                            <Badge 
                              variant="default"
                              className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                              data-testid={`badge-completed-${index}`}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Concluída
                            </Badge>
                          )}
                          {goal.prioridade && (
                            <Badge 
                              variant={goal.prioridade === 'alta' ? 'destructive' : 'default'}
                              className={`${
                                goal.prioridade === 'media' ? 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20' :
                                goal.prioridade === 'baixa' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' :
                                ''
                              }`}
                              data-testid={`badge-priority-${index}`}
                            >
                              {goal.prioridade === 'alta' ? 'Alta' : goal.prioridade === 'media' ? 'Média' : 'Baixa'}
                            </Badge>
                          )}
                        </div>
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
              <Button 
                data-testid="button-add-first-goal"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Meta
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Nova Meta Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" data-testid="dialog-nova-meta">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title">Nova Meta Financeira</DialogTitle>
            <DialogDescription data-testid="dialog-description">
              Defina uma nova meta financeira para acompanhar seu progresso
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Meta</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Viagem para Europa" 
                        data-testid="input-nome"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valorObjetivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Objetivo (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0.01"
                        placeholder="0.00" 
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
                    <FormLabel>Valor Atual (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0"
                        placeholder="0.00" 
                        data-testid="input-valor-atual"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataFim"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Limite (opcional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
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
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => {
                            field.onChange(date ? date.toISOString().split('T')[0] : "");
                          }}
                          disabled={(date) => date < new Date()}
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
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createGoalMutation.isPending}
                  data-testid="button-submit"
                >
                  {createGoalMutation.isPending ? "Criando..." : "Criar Meta"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
