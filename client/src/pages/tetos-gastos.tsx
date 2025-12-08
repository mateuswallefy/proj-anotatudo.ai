import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DashboardContainer } from "@/components/dashboard/DashboardContainer";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Filter, Plus, AlertTriangle, CheckCircle2, Pause } from "lucide-react";
import { usePeriod } from "@/contexts/PeriodContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { categorias } from "@shared/schema";
import { cn } from "@/lib/utils";

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

const formSchema = z.object({
  categoria: z.string().min(1, "Categoria obrigatória"),
  valorLimite: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
});

type FormData = z.infer<typeof formSchema>;

export default function TetosGastos() {
  const { period } = usePeriod();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    "todos" | "ativo" | "excedido" | "pausado"
  >("todos");

  const [year, month] = period
    ? period.split("-").map(Number)
    : [new Date().getFullYear(), new Date().getMonth() + 1];

  const { data: limits, isLoading: loadingLimits } = useQuery<SpendingLimit[]>(
    {
      queryKey: ["/api/spending-limits", { period }],
      queryFn: async () => {
        const response = await fetch(
          `/api/spending-limits?year=${year}&month=${month}`,
          { credentials: "include" }
        );
        if (!response.ok) return [];
        return response.json();
      },
    }
  );

  const { data: despesas, isLoading: loadingDespesas } =
    useQuery<CategoryData[]>({
      queryKey: ["/api/analytics/expenses-by-category", { period }],
      queryFn: async () => {
        const response = await fetch(
          `/api/analytics/expenses-by-category?period=${period}`,
          { credentials: "include" }
        );
        if (!response.ok) return [];
        return response.json();
      },
    });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoria: "",
      valorLimite: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
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
      toast({ title: "Teto criado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/spending-limits"] });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar teto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/spending-limits/${id}`, {});
    },
    onSuccess: () => {
      toast({ title: "Teto excluído!" });
      queryClient.invalidateQueries({ queryKey: ["/api/spending-limits"] });
    },
  });

  // Calculate tetos with status
  const tetosComStatus = limits
    ?.filter((limit) => limit.categoria && limit.ativo === "sim")
    .map((limit) => {
      const gastoCategoria = despesas?.find(
        (d) => d.categoria === limit.categoria
      );
      const gastoAtual = gastoCategoria?.total || 0;
      const limiteValor = parseFloat(limit.valorLimite);
      const percentualUsado = limiteValor > 0 ? (gastoAtual / limiteValor) * 100 : 0;

      // Determine status
      let status: "ativo" | "excedido" | "pausado" = "ativo";
      if (percentualUsado >= 100) {
        status = "excedido";
      } else if (limit.ativo === "nao") {
        status = "pausado";
      }

      return {
        ...limit,
        gastoAtual,
        limiteValor,
        percentualUsado,
        status,
      };
    }) || [];

  const filteredTetos = tetosComStatus.filter((teto) => {
    if (statusFilter === "todos") return true;
    return teto.status === statusFilter;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excedido":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "pausado":
        return <Pause className="h-4 w-4 text-gray-600" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excedido":
        return "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800";
      case "pausado":
        return "bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800";
      default:
        return "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800";
    }
  };

  const getProgressColor = (percent: number, status: string) => {
    if (status === "excedido") return "bg-red-500";
    if (status === "pausado") return "bg-gray-500";
    if (percent >= 75) return "bg-orange-500";
    return "bg-emerald-500";
  };

  if (loadingLimits || loadingDespesas) {
    return (
      <DashboardContainer>
        <div className="space-y-6 pb-24">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
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
              form.reset();
              setDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Teto
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Button
            variant={statusFilter === "todos" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("todos")}
          >
            Todos
          </Button>
          <Button
            variant={statusFilter === "ativo" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("ativo")}
          >
            Ativo
          </Button>
          <Button
            variant={statusFilter === "excedido" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("excedido")}
          >
            Excedido
          </Button>
          <Button
            variant={statusFilter === "pausado" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("pausado")}
          >
            Pausado
          </Button>
        </div>

        {/* Tetos List */}
        {filteredTetos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredTetos.map((teto) => (
              <Card
                key={teto.id}
                className={cn(
                  "rounded-2xl border-2 hover:shadow-lg transition-all",
                  getStatusColor(teto.status)
                )}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {teto.categoria}
                      </h3>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(teto.status)}
                        <Badge
                          variant={
                            teto.status === "excedido"
                              ? "destructive"
                              : teto.status === "pausado"
                              ? "secondary"
                              : "default"
                          }
                        >
                          {teto.status === "excedido"
                            ? "Excedido"
                            : teto.status === "pausado"
                            ? "Pausado"
                            : "Ativo"}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(teto.id)}
                    >
                      <span className="text-destructive">×</span>
                    </Button>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Usado</span>
                      <span className="font-semibold">
                        {teto.percentualUsado.toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={Math.min(teto.percentualUsado, 100)}
                      className="h-3"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatCurrency(teto.gastoAtual)}</span>
                      <span>{formatCurrency(teto.limiteValor)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="rounded-2xl">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Filter className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Nenhum teto configurado
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {statusFilter !== "todos"
                  ? "Nenhum teto encontrado com este status"
                  : "Comece definindo limites de gastos para suas categorias"}
              </p>
              <Button
                onClick={() => {
                  form.reset();
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Teto
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Novo Teto de Gasto</DialogTitle>
              <DialogDescription>
                Defina um limite de gastos para uma categoria
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) =>
                  createMutation.mutate(data)
                )}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="categoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
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
                          placeholder="0,00"
                          {...field}
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
                    disabled={createMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? "Criando..." : "Criar Teto"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardContainer>
  );
}

