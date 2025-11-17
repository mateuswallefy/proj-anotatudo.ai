import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Filter, Home, ShoppingCart, Car, Utensils, Heart, GraduationCap, Sparkles, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePeriod } from "@/contexts/PeriodContext";
import { MetricCard } from "@/components/cards/MetricCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import { categorias } from "@shared/schema";
import { PageHeader, PremiumButton, AppCard, SectionTitle, PremiumInput } from "@/components/design-system";

type SpendingLimit = {
  id: string;
  userId: string;
  tipo: string;
  categoria: string | null;
  valorLimite: string;
  mes: number | null;
  ano: number | null;
  ativo: string;
};

type CategoryData = {
  categoria: string;
  total: number;
  percentual: number;
};

const categoryIcons: Record<string, any> = {
  'Moradia': Home,
  'Alimentação': Utensils,
  'Transporte': Car,
  'Compras': ShoppingCart,
  'Saúde': Heart,
  'Educação': GraduationCap,
  'Lazer': Sparkles,
};

const formSchema = z.object({
  categoria: z.string().min(1, "Categoria obrigatória"),
  valorLimite: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
});

type FormData = z.infer<typeof formSchema>;

export default function Orcamento() {
  const { period } = usePeriod();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: limits, isLoading: loadingLimits } = useQuery<SpendingLimit[]>({
    queryKey: ["/api/spending-limits", { period }],
  });

  const { data: despesas, isLoading: loadingDespesas } = useQuery<CategoryData[]>({
    queryKey: ["/api/analytics/expenses-by-category", { period }],
  });

  const isLoading = loadingLimits || loadingDespesas;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoria: "",
      valorLimite: 0,
    },
  });

  const createOrcamentoMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const [year, month] = period.split('-').map(Number);
      return await apiRequest("POST", "/api/spending-limits", {
        tipo: "mensal_categoria",
        categoria: data.categoria,
        valorLimite: data.valorLimite.toString(),
        mes: month,
        ano: year,
        ativo: "sim",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spending-limits"] });
      toast({
        title: "Orçamento criado com sucesso!",
      });
      setDialogOpen(false);
      form.reset({
        categoria: "",
        valorLimite: 0,
      });
    },
    onError: () => {
      toast({
        title: "Erro ao criar orçamento",
        description: "Não foi possível criar o orçamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createOrcamentoMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="space-y-8 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalBudget = limits?.reduce((sum, limit) => {
    if (limit.categoria && limit.ativo === 'sim') {
      return sum + parseFloat(limit.valorLimite);
    }
    return sum;
  }, 0) || 0;

  const totalSpent = despesas?.reduce((sum, cat) => sum + cat.total, 0) || 0;
  const totalAvailable = totalBudget - totalSpent;
  const totalExceeded = totalSpent > totalBudget ? totalSpent - totalBudget : 0;

  // Calculate percentages
  const percentSpent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const percentAvailable = totalBudget > 0 ? (totalAvailable / totalBudget) * 100 : 0;
  const percentExceeded = totalBudget > 0 ? (totalExceeded / totalBudget) * 100 : 0;

  // Match spending limits with actual spending
  const categoryBudgets = limits
    ?.filter(limit => limit.categoria && limit.ativo === 'sim')
    .map(limit => {
      const gastoCategoria = despesas?.find(d => d.categoria === limit.categoria);
      const gastoAtual = gastoCategoria?.total || 0;
      const limiteValor = parseFloat(limit.valorLimite);
      const percentualUsado = limiteValor > 0 ? (gastoAtual / limiteValor) * 100 : 0;
      
      return {
        ...limit,
        gastoAtual,
        limiteValor,
        percentualUsado,
      };
    })
    .sort((a, b) => b.percentualUsado - a.percentualUsado) || [];

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 75) return "bg-orange-500";
    return "bg-emerald-500";
  };

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
          title="Orçamento Mensal"
          subtitle="Controle seus gastos por categoria"
          action={
            <div className="flex flex-col gap-3">
              <PremiumButton
                size="lg"
                data-testid="button-novo-orcamento"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-5 w-5 mr-2" />
                Novo Orçamento
              </PremiumButton>
              <div className="text-left md:text-right">
                <p className="text-sm text-muted-foreground mb-1">Orçamento Total</p>
                <p className="text-2xl md:text-3xl font-bold font-mono tabular-nums" data-testid="text-total-budget">
                  {formatCurrency(totalBudget)}
                </p>
              </div>
            </div>
          }
        />

        {/* Budget Summary Cards - Premium Design */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          <MetricCard
            icon={Sparkles}
            label="Disponível"
            value={formatCurrency(Math.max(0, totalAvailable))}
            subtitle={`${percentAvailable.toFixed(1)}% do orçamento`}
            iconColor="text-purple-600 dark:text-purple-400"
            iconBg="bg-purple-500/10"
            data-testid="card-disponivel"
          />
          
          <MetricCard
            icon={ShoppingCart}
            label="Gasto"
            value={formatCurrency(totalSpent)}
            subtitle={`${percentSpent.toFixed(1)}% do orçamento`}
            iconColor="text-blue-600 dark:text-blue-400"
            iconBg="bg-blue-500/10"
            data-testid="card-gasto"
          />
          
          <MetricCard
            icon={Heart}
            label="Excedido"
            value={formatCurrency(totalExceeded)}
            subtitle={totalExceeded > 0 ? `${percentExceeded.toFixed(1)}% acima` : '0% acima'}
            iconColor="text-red-600 dark:text-red-400"
            iconBg="bg-red-500/10"
            data-testid="card-excedido"
          />
        </div>

        {/* Categories Section - Premium Design */}
        <div className="space-y-6">
          <SectionTitle
            title="Categorias de Orçamento"
            subtitle={`${categoryBudgets.length} ${categoryBudgets.length === 1 ? 'categoria' : 'categorias'}`}
            action={
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-2" data-testid="button-filter">
                <Filter className="h-4 w-4" />
              </Button>
            }
          />

          {categoryBudgets.length > 0 ? (
            <div className="space-y-3">
              {categoryBudgets.map((category, index) => {
                const Icon = categoryIcons[category.categoria || ''] || Home;
                const progressColor = getProgressColor(category.percentualUsado);
                const borderAccent = category.percentualUsado >= 100 ? "red" : category.percentualUsado >= 75 ? "red" : "emerald";
                
                return (
                  <AppCard key={category.id} className="p-5 md:p-6" borderAccent={borderAccent} hover data-testid={`category-card-${index}`}>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-7 w-7 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base md:text-lg" data-testid={`text-category-name-${index}`}>
                            {category.categoria}
                          </h3>
                        </div>
                        <span 
                          className={`text-sm font-semibold px-3 py-1 rounded-full ${
                            category.percentualUsado >= 100 
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400' 
                              : category.percentualUsado >= 75 
                              ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' 
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}
                          data-testid={`text-percentage-${index}`}
                        >
                          {category.percentualUsado.toFixed(1)}% usado
                        </span>
                      </div>

                      <Progress 
                        value={Math.min(category.percentualUsado, 100)} 
                        className="h-3 rounded-full"
                        indicatorClassName={progressColor}
                        data-testid={`progress-${index}`}
                      />

                      <div className="flex items-center justify-between text-sm">
                        <span className="font-mono text-muted-foreground" data-testid={`text-spent-${index}`}>
                          {formatCurrency(category.gastoAtual)}
                        </span>
                        <span className="text-muted-foreground">/</span>
                        <span className="font-mono font-semibold" data-testid={`text-limit-${index}`}>
                          {formatCurrency(category.limiteValor)}
                        </span>
                      </div>
                    </div>
                  </AppCard>
                );
              })}
            </div>
          ) : (
            <AppCard className="p-12 md:p-16">
              <div className="text-center">
                <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Filter className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Nenhum orçamento configurado</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Comece definindo limites de gastos para suas categorias
                </p>
                <PremiumButton onClick={() => setDialogOpen(true)}>
                  <Plus className="h-5 w-5 mr-2" />
                  Criar Primeiro Orçamento
                </PremiumButton>
              </div>
            </AppCard>
          )}
        </div>

        {/* Premium Novo Orçamento Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[540px] rounded-2xl">
            <DialogHeader className="space-y-2 pb-2">
              <DialogTitle className="text-2xl font-bold tracking-tight">Novo Orçamento</DialogTitle>
              <DialogDescription className="text-base">
                Defina um limite de gastos para uma categoria específica
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-2">
                <FormField
                  control={form.control}
                  name="categoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Categoria</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl border-2" data-testid="select-categoria">
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categorias.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valorLimite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Valor Limite (R$)</FormLabel>
                      <FormControl>
                        <PremiumInput
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          className="font-mono"
                          {...field}
                          data-testid="input-valor-limite"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <PremiumButton
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={createOrcamentoMutation.isPending}
                    className="h-11 px-6"
                    data-testid="button-cancel"
                  >
                    Cancelar
                  </PremiumButton>
                  <PremiumButton
                    type="submit"
                    disabled={createOrcamentoMutation.isPending}
                    className="h-11 px-6"
                    data-testid="button-submit-orcamento"
                  >
                    {createOrcamentoMutation.isPending ? "Salvando..." : "Criar Orçamento"}
                  </PremiumButton>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
