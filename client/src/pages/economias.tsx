import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PiggyBank, TrendingUp, Percent, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePeriod } from "@/contexts/PeriodContext";
import { MetricCard } from "@/components/cards/MetricCard";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Goal, Transacao } from "@shared/schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type CategoryData = {
  categoria: string;
  total: number;
  percentual: number;
};

type PeriodSummary = {
  totalReceitas: number;
  totalDespesas: number;
  totalEconomias: number;
  saldo: number;
  variacaoReceitas: number;
  variacaoDespesas: number;
  variacaoEconomias: number;
  variacaoSaldo: number;
  transacoesTotal: number;
};

const formSchema = z.object({
  descricao: z.string().min(1, "Descrição obrigatória"),
  valor: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
  data: z.string().optional(),
  goalId: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function Economias() {
  const { period } = usePeriod();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: periodSummary, isLoading: loadingSummary } = useQuery<PeriodSummary>({
    queryKey: ["/api/analytics/period-summary", { period }],
  });

  const { data: receitas, isLoading: loadingReceitas } = useQuery<CategoryData[]>({
    queryKey: ["/api/analytics/income-by-category", { period }],
  });

  const { data: despesas, isLoading: loadingDespesas } = useQuery<CategoryData[]>({
    queryKey: ["/api/analytics/expenses-by-category", { period }],
  });

  const { data: goals } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const { data: allTransacoes } = useQuery<Transacao[]>({
    queryKey: ["/api/transacoes", { period }],
  });

  const economias = allTransacoes?.filter(t => t.tipo === 'economia') || [];

  const activeGoals = goals?.filter(g => g.status === 'ativa') || [];

  const isLoading = loadingSummary || loadingReceitas || loadingDespesas;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricao: "",
      valor: 0,
      data: new Date().toISOString().split('T')[0],
      goalId: "",
    },
  });

  const createEconomiaMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload: any = {
        descricao: data.descricao,
        valor: data.valor.toString(),
        tipo: "economia",
        categoria: "Economia",
        dataReal: data.data || new Date().toISOString().split('T')[0],
        origem: "manual",
      };
      
      if (data.goalId) {
        payload.goalId = data.goalId;
      }
      
      return await apiRequest("POST", "/api/transacoes", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transacoes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/period-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/income-by-category"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({
        title: "Economia registrada com sucesso!",
      });
      setDialogOpen(false);
      form.reset({
        descricao: "",
        valor: 0,
        data: new Date().toISOString().split('T')[0],
        goalId: "",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao registrar economia",
        description: "Não foi possível registrar a economia. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createEconomiaMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const totalReceitas = periodSummary?.totalReceitas || 0;
  const totalDespesas = periodSummary?.totalDespesas || 0;
  const totalEconomias = periodSummary?.totalEconomias || 0;
  const taxaEconomia = totalReceitas > 0 ? (totalEconomias / totalReceitas) * 100 : 0;
  const variacaoEconomias = periodSummary?.variacaoEconomias || 0;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="space-y-2" data-testid="header-economias">
        <h1 className="text-3xl font-bold tracking-tight">Economias</h1>
        <p className="text-muted-foreground">
          Acompanhe quanto você está guardando
        </p>
      </div>

      {/* CTA Button */}
      <Button
        variant="default"
        size="lg"
        data-testid="button-registrar-economia"
        onClick={() => setDialogOpen(true)}
      >
        <Plus className="h-4 w-4" />
        Registrar Economia
      </Button>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={PiggyBank}
          label="Total Economizado"
          value={`R$ ${totalEconomias.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle={`${taxaEconomia.toFixed(1)}% da renda`}
          iconColor="text-purple-600 dark:text-purple-400"
          iconBg="bg-purple-600/10"
          data-testid="card-total-economizado"
        />
        
        <MetricCard
          icon={TrendingUp}
          label="Este Mês"
          value={`R$ ${totalEconomias.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle={variacaoEconomias >= 0 ? `+${variacaoEconomias.toFixed(1)}% vs mês anterior` : `${variacaoEconomias.toFixed(1)}% vs mês anterior`}
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-600/10"
          data-testid="card-este-mes"
        />
        
        <MetricCard
          icon={Percent}
          label="% da Renda"
          value={`${taxaEconomia.toFixed(1)}%`}
          subtitle={totalEconomias >= 0 ? `Economizando ${taxaEconomia.toFixed(1)}%` : `Gastando mais que a renda`}
          iconColor="text-purple-600 dark:text-purple-400"
          iconBg="bg-purple-600/10"
          data-testid="card-percentual-renda"
        />
      </div>

      {/* Summary Card */}
      <Card className="p-6" data-testid="card-resumo-economias">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Resumo do Período</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">Total de Receitas</p>
              <p className="text-2xl font-bold text-success" data-testid="text-total-receitas">
                R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">Total de Despesas</p>
              <p className="text-2xl font-bold text-destructive" data-testid="text-total-despesas">
                R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">Economias do Período</p>
              <p className={`text-2xl font-bold ${totalEconomias >= 0 ? 'text-success' : 'text-destructive'}`} data-testid="text-economias-periodo">
                R$ {totalEconomias.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Lista de Economias Registradas */}
      {economias.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Economias Registradas</h3>
          <div className="space-y-3">
            {economias
              .sort((a, b) => new Date(b.dataReal).getTime() - new Date(a.dataReal).getTime())
              .map((economia) => {
                const goalName = economia.goalId 
                  ? goals?.find(g => g.id === economia.goalId)?.nome 
                  : null;
                
                return (
                  <div 
                    key={economia.id} 
                    className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                    data-testid={`economia-${economia.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <PiggyBank className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <p className="font-medium">{economia.descricao || 'Economia'}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground">
                          {new Date(economia.dataReal).toLocaleDateString('pt-BR')}
                        </p>
                        {goalName && (
                          <>
                            <span className="text-sm text-muted-foreground">•</span>
                            <Badge variant="outline" className="text-xs">
                              Meta: {goalName}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-success">
                        + R$ {parseFloat(economia.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      {/* Registrar Economia Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Economia</DialogTitle>
            <DialogDescription>
              Registre o valor que você guardou para alcançar seus objetivos
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Guardei para viagem"
                        {...field}
                        data-testid="input-descricao"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        data-testid="input-valor"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        data-testid="input-data"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="goalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vincular a Meta? (opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-goal">
                          <SelectValue placeholder="Nenhuma meta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeGoals.map((goal) => (
                          <SelectItem key={goal.id} value={goal.id}>
                            {goal.nome} - R$ {parseFloat(goal.valorAtual || '0').toFixed(2)} / {parseFloat(goal.valorAlvo).toFixed(2)}
                          </SelectItem>
                        ))}
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
                  onClick={() => setDialogOpen(false)}
                  disabled={createEconomiaMutation.isPending}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createEconomiaMutation.isPending}
                  data-testid="button-submit"
                >
                  {createEconomiaMutation.isPending ? "Salvando..." : "Registrar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
