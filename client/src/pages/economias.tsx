import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PiggyBank, TrendingUp, Percent, Plus, Calendar } from "lucide-react";
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
import { PageHeader, PremiumButton, AppCard, SectionTitle, DataBadge, PremiumInput } from "@/components/design-system";

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
      <div className="min-h-screen bg-background">
        <div className="space-y-8 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-12 w-48 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const totalReceitas = periodSummary?.totalReceitas || 0;
  const totalDespesas = periodSummary?.totalDespesas || 0;
  const totalEconomias = periodSummary?.totalEconomias || 0;
  const taxaEconomia = totalReceitas > 0 ? (totalEconomias / totalReceitas) * 100 : 0;
  const variacaoEconomias = periodSummary?.variacaoEconomias || 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-8 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Premium Header */}
        <PageHeader
          title="Economias"
          subtitle="Acompanhe quanto você está guardando"
          action={
            <PremiumButton
              size="lg"
              data-testid="button-registrar-economia"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-5 w-5 mr-2" />
              Registrar Economia
            </PremiumButton>
          }
        />

        {/* Metric Cards - Premium Design */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          <MetricCard
            icon={PiggyBank}
            label="Total Economizado"
            value={formatCurrency(totalEconomias)}
            subtitle={`${taxaEconomia.toFixed(1)}% da renda`}
            iconColor="text-purple-600 dark:text-purple-400"
            iconBg="bg-purple-500/10"
            data-testid="card-total-economizado"
          />
          
          <MetricCard
            icon={TrendingUp}
            label="Este Mês"
            value={formatCurrency(totalEconomias)}
            subtitle={variacaoEconomias >= 0 ? `+${variacaoEconomias.toFixed(1)}% vs mês anterior` : `${variacaoEconomias.toFixed(1)}% vs mês anterior`}
            iconColor="text-emerald-600 dark:text-emerald-400"
            iconBg="bg-emerald-500/10"
            data-testid="card-este-mes"
          />
          
          <MetricCard
            icon={Percent}
            label="% da Renda"
            value={`${taxaEconomia.toFixed(1)}%`}
            subtitle={totalEconomias >= 0 ? `Economizando ${taxaEconomia.toFixed(1)}%` : `Gastando mais que a renda`}
            iconColor="text-blue-600 dark:text-blue-400"
            iconBg="bg-blue-500/10"
            data-testid="card-percentual-renda"
          />
        </div>

        {/* Summary Card - Premium Design */}
        <AppCard className="p-6 md:p-8" borderAccent="purple" data-testid="card-resumo-economias">
          <SectionTitle title="Resumo do Período" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
            <AppCard className="p-5" hover>
              <p className="text-sm text-muted-foreground mb-2">Total de Receitas</p>
              <p className="text-2xl md:text-3xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400" data-testid="text-total-receitas">
                {formatCurrency(totalReceitas)}
              </p>
            </AppCard>
            <AppCard className="p-5" hover>
              <p className="text-sm text-muted-foreground mb-2">Total de Despesas</p>
              <p className="text-2xl md:text-3xl font-bold font-mono tabular-nums text-red-600 dark:text-red-400" data-testid="text-total-despesas">
                {formatCurrency(totalDespesas)}
              </p>
            </AppCard>
            <AppCard className="p-5" hover borderAccent={totalEconomias >= 0 ? "emerald" : "red"}>
              <p className="text-sm text-muted-foreground mb-2">Economias do Período</p>
              <p className={`text-2xl md:text-3xl font-bold font-mono tabular-nums ${totalEconomias >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} data-testid="text-economias-periodo">
                {formatCurrency(totalEconomias)}
              </p>
            </AppCard>
          </div>
        </AppCard>

        {/* Lista de Economias Registradas - Premium Design */}
        {economias.length > 0 && (
          <div className="space-y-6">
            <SectionTitle title="Economias Registradas" subtitle={`${economias.length} ${economias.length === 1 ? 'registro' : 'registros'}`} />
            <div className="space-y-3">
              {economias
                .sort((a, b) => new Date(b.dataReal).getTime() - new Date(a.dataReal).getTime())
                .map((economia) => {
                  const goalName = economia.goalId 
                    ? goals?.find(g => g.id === economia.goalId)?.nome 
                    : null;
                  
                  return (
                    <AppCard 
                      key={economia.id} 
                      className="p-5 md:p-6"
                      borderAccent="emerald"
                      hover
                      data-testid={`economia-${economia.id}`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                            <PiggyBank className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <h3 className="font-semibold text-base md:text-lg leading-tight">
                              {economia.descricao || 'Economia'}
                            </h3>
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{new Date(economia.dataReal).toLocaleDateString('pt-BR')}</span>
                              </div>
                              {goalName && (
                                <DataBadge variant="outline">
                                  Meta: {goalName}
                                </DataBadge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-2 flex-shrink-0">
                          <p className="text-lg md:text-xl lg:text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                            + {formatCurrency(parseFloat(economia.valor))}
                          </p>
                        </div>
                      </div>
                    </AppCard>
                  );
                })}
            </div>
          </div>
        )}

        {/* Premium Registrar Economia Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <div className="space-y-4 md:space-y-6">
              <DialogHeader>
                <DialogTitle className="text-xl md:text-2xl font-bold tracking-tight">Registrar Economia</DialogTitle>
                <DialogDescription className="text-sm md:text-base">
                  Registre o valor que você guardou para alcançar seus objetivos
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: Guardei para viagem"
                          className="min-h-[100px] rounded-xl border-2 text-base"
                          {...field}
                          data-testid="input-descricao"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="valor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">Valor (R$)</FormLabel>
                        <FormControl>
                          <PremiumInput
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            className="font-mono"
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
                        <FormLabel className="text-sm font-semibold">Data</FormLabel>
                        <FormControl>
                          <PremiumInput
                            type="date"
                            className="font-mono"
                            {...field}
                            data-testid="input-data"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="goalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Vincular a Meta? (opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 md:h-12 rounded-xl border-2" data-testid="select-goal">
                            <SelectValue placeholder="Nenhuma meta" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activeGoals.map((goal) => (
                            <SelectItem key={goal.id} value={goal.id}>
                              {goal.nome} - {formatCurrency(parseFloat(goal.valorAtual || '0'))} / {formatCurrency(parseFloat(goal.valorAlvo))}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <PremiumButton
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={createEconomiaMutation.isPending}
                    className="w-full md:w-auto h-11 md:h-12 px-6"
                    data-testid="button-cancel"
                  >
                    Cancelar
                  </PremiumButton>
                  <PremiumButton
                    type="submit"
                    disabled={createEconomiaMutation.isPending}
                    className="w-full md:w-auto h-11 md:h-12 px-6"
                    data-testid="button-submit"
                  >
                    {createEconomiaMutation.isPending ? "Salvando..." : "Registrar Economia"}
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
