import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, Plus, Wallet, CheckCircle2, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DashboardContainer } from "@/components/dashboard/DashboardContainer";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Goal } from "@shared/schema";
import { AddContributionDialog } from "@/components/dashboard/AddContributionDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { cn } from "@/lib/utils";

const goalSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  valorAlvo: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
  dataFim: z.string().optional(),
  prioridade: z.enum(["baixa", "media", "alta"]).optional().default("media"),
});

const contributionSchema = z.object({
  amount: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
  date: z.string().min(1, "Data obrigatória"),
  accountId: z.string().optional(),
});

type GoalFormData = z.infer<typeof goalSchema>;
type ContributionFormData = z.infer<typeof contributionSchema>;

export default function Metas() {
  const { toast } = useToast();
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [contributionDialogOpen, setContributionDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [filter, setFilter] = useState<"todas" | "ativas" | "concluidas">("todas");

  const { data: goals, isLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
    queryFn: async () => {
      const response = await fetch("/api/goals", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch goals");
      return response.json();
    },
  });

  const goalForm = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      nome: "",
      valorAlvo: 0,
      dataFim: "",
      prioridade: "media",
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: async (data: GoalFormData) => {
      const today = new Date().toISOString().split("T")[0];
      const payload = {
        nome: data.nome,
        valorAlvo: data.valorAlvo.toString(),
        dataInicio: today,
        dataFim: data.dataFim || undefined,
        prioridade: data.prioridade,
      };
      return await apiRequest("POST", "/api/goals", payload);
    },
    onSuccess: () => {
      toast({ title: "Meta criada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      setGoalDialogOpen(false);
      goalForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar meta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const archiveGoalMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/goals/${id}/status`, { status });
    },
    onSuccess: () => {
      toast({ title: "Meta atualizada!" });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    },
  });

  const filteredGoals = goals?.filter((goal) => {
    if (filter === "ativas") return goal.status === "ativa";
    if (filter === "concluidas") return goal.status === "concluida";
    return true;
  }) || [];

  const formatCurrency = (value: number | string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(typeof value === "string" ? parseFloat(value) : value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d 'de' MMM 'de' yyyy", {
      locale: ptBR,
    });
  };

  const getProgressColor = (percent: number) => {
    if (percent < 30) return "bg-red-500";
    if (percent < 70) return "bg-yellow-500";
    return "bg-emerald-500";
  };

  const getProgressStatus = (percent: number) => {
    if (percent < 30) return "Iniciando";
    if (percent < 70) return "Em andamento";
    return "Quase lá!";
  };

  if (isLoading) {
    return (
      <DashboardContainer>
        <div className="space-y-6 pb-24">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        </div>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <div className="space-y-6 pb-24">
        <div className="flex items-center justify-between">
          <DashboardHeader />
          <Button
            onClick={() => {
              goalForm.reset();
              setGoalDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Meta
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Button
            variant={filter === "todas" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("todas")}
          >
            Todas
          </Button>
          <Button
            variant={filter === "ativas" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("ativas")}
          >
            Ativas
          </Button>
          <Button
            variant={filter === "concluidas" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("concluidas")}
          >
            Concluídas
          </Button>
        </div>

        {/* Goals List */}
        {filteredGoals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredGoals.map((goal) => {
              const valorAtual = parseFloat(goal.valorAtual || "0");
              const valorAlvo = parseFloat(goal.valorAlvo);
              const percent = valorAlvo > 0 ? (valorAtual / valorAlvo) * 100 : 0;
              const isCompleted = goal.status === "concluida";

              return (
                <Card
                  key={goal.id}
                  className={cn(
                    "rounded-2xl border-2 hover:shadow-lg transition-all",
                    isCompleted && "opacity-75"
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold text-lg">
                            {goal.nome}
                          </h3>
                        </div>
                        {goal.descricao && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {goal.descricao}
                          </p>
                        )}
                        {goal.dataFim && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Até {formatDate(goal.dataFim)}</span>
                          </div>
                        )}
                      </div>
                      <Badge
                        variant={
                          isCompleted
                            ? "default"
                            : percent >= 70
                            ? "default"
                            : percent >= 30
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : null}
                        {isCompleted
                          ? "Concluída"
                          : getProgressStatus(percent)}
                      </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-semibold">{percent.toFixed(0)}%</span>
                      </div>
                      <Progress
                        value={Math.min(percent, 100)}
                        className="h-3"
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatCurrency(valorAtual)}</span>
                        <span>{formatCurrency(valorAlvo)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    {!isCompleted && (
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => {
                          setSelectedGoal(goal);
                          setContributionDialogOpen(true);
                        }}
                      >
                        <Wallet className="h-4 w-4" />
                        Adicionar Aporte
                      </Button>
                    )}

                    {isCompleted && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          archiveGoalMutation.mutate({
                            id: goal.id,
                            status: "ativa",
                          })
                        }
                      >
                        Reativar Meta
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="rounded-2xl">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Nenhuma meta encontrada
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {filter === "todas"
                  ? "Crie sua primeira meta financeira"
                  : filter === "ativas"
                  ? "Você não tem metas ativas no momento"
                  : "Você ainda não concluiu nenhuma meta"}
              </p>
              <Button
                onClick={() => {
                  goalForm.reset();
                  setGoalDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Meta
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create Goal Dialog */}
        <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nova Meta</DialogTitle>
              <DialogDescription>
                Defina uma meta financeira para alcançar
              </DialogDescription>
            </DialogHeader>
            <Form {...goalForm}>
              <form
                onSubmit={goalForm.handleSubmit((data) =>
                  createGoalMutation.mutate(data)
                )}
                className="space-y-4"
              >
                <FormField
                  control={goalForm.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Meta</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Viagem para Europa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={goalForm.control}
                  name="valorAlvo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Alvo (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={goalForm.control}
                  name="dataFim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Limite (opcional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={goalForm.control}
                  name="prioridade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="baixa">Baixa</SelectItem>
                          <SelectItem value="media">Média</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setGoalDialogOpen(false)}
                    disabled={createGoalMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createGoalMutation.isPending}>
                    {createGoalMutation.isPending ? "Criando..." : "Criar Meta"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Contribution Dialog */}
        {selectedGoal && (
          <AddContributionDialog
            open={contributionDialogOpen}
            onOpenChange={setContributionDialogOpen}
            goalId={selectedGoal.id}
            goalName={selectedGoal.nome}
          />
        )}
      </div>
    </DashboardContainer>
  );
}

