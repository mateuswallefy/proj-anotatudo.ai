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
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
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

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2" data-testid="title-orcamento">
            Orçamento Mensal
          </h1>
          <p className="text-muted-foreground" data-testid="subtitle-orcamento">
            Controle seus gastos por categoria
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            variant="default"
            size="lg"
            data-testid="button-novo-orcamento"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Orçamento
          </Button>
          <div className="text-left md:text-right">
            <p className="text-sm text-muted-foreground mb-1">Orçamento Total</p>
            <p className="text-2xl font-bold font-mono tabular-nums" data-testid="text-total-budget">
              R$ {totalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Budget Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          icon={Sparkles}
          label="Disponível"
          value={`R$ ${Math.max(0, totalAvailable).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
          subtitle={`${percentAvailable.toFixed(1)}% do orçamento`}
          iconColor="text-purple-600"
          iconBg="bg-purple-100 dark:bg-purple-950"
          valueColor="text-purple-600 dark:text-purple-400"
          data-testid="card-disponivel"
        />
        
        <MetricCard
          icon={ShoppingCart}
          label="Gasto"
          value={`R$ ${totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
          subtitle={`${percentSpent.toFixed(1)}% do orçamento`}
          iconColor="text-blue-600"
          iconBg="bg-blue-100 dark:bg-blue-950"
          valueColor="text-blue-600 dark:text-blue-400"
          data-testid="card-gasto"
        />
        
        <MetricCard
          icon={Heart}
          label="Excedido"
          value={`R$ ${totalExceeded.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
          subtitle={totalExceeded > 0 ? `${percentExceeded.toFixed(1)}% acima` : '0% acima'}
          iconColor="text-red-600"
          iconBg="bg-red-100 dark:bg-red-950"
          valueColor="text-red-600 dark:text-red-400"
          data-testid="card-excedido"
        />
      </div>

      {/* Categories Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold" data-testid="title-categorias">
            Categorias de Orçamento
          </h2>
          <Button variant="ghost" size="icon" data-testid="button-filter">
            <Filter className="h-5 w-5" />
          </Button>
        </div>

        {categoryBudgets.length > 0 ? (
          <div className="space-y-3">
            {categoryBudgets.map((category, index) => {
              const Icon = categoryIcons[category.categoria || ''] || Home;
              const progressColor = getProgressColor(category.percentualUsado);
              
              return (
                <Card key={category.id} className="hover-elevate" data-testid={`category-card-${index}`}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold" data-testid={`text-category-name-${index}`}>
                          {category.categoria}
                        </h3>
                      </div>
                      <span 
                        className={`text-sm font-medium ${
                          category.percentualUsado >= 100 
                            ? 'text-red-600 dark:text-red-400' 
                            : category.percentualUsado >= 75 
                            ? 'text-orange-600 dark:text-orange-400' 
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                        data-testid={`text-percentage-${index}`}
                      >
                        {category.percentualUsado.toFixed(1)}% usado
                      </span>
                    </div>

                    <Progress 
                      value={Math.min(category.percentualUsado, 100)} 
                      className="h-2 mb-3"
                      data-testid={`progress-${index}`}
                    />

                    <div className="flex items-center justify-between text-sm">
                      <span className="font-mono text-muted-foreground" data-testid={`text-spent-${index}`}>
                        R$ {category.gastoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                      </span>
                      <span className="text-muted-foreground">/</span>
                      <span className="font-mono font-semibold" data-testid={`text-limit-${index}`}>
                        R$ {category.limiteValor.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12">
            <div className="text-center">
              <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum orçamento configurado</h3>
              <p className="text-muted-foreground mb-6">
                Comece definindo limites de gastos para suas categorias
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Novo Orçamento Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Orçamento</DialogTitle>
            <DialogDescription>
              Defina um limite de gastos para uma categoria específica
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-categoria">
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
                    <FormLabel>Valor Limite (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        data-testid="input-valor-limite"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={createOrcamentoMutation.isPending}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createOrcamentoMutation.isPending}
                  data-testid="button-submit-orcamento"
                >
                  {createOrcamentoMutation.isPending ? "Salvando..." : "Criar Orçamento"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
