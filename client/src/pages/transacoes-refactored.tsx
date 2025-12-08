import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Transacao } from "@shared/schema";
import { categorias } from "@shared/schema";
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Plus,
  Edit,
  Trash2,
  Search,
} from "lucide-react";
import { StatCard } from "@/components/cards/StatCard";
import { usePeriod } from "@/contexts/PeriodContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PageHeader, CardContainer } from "@/components/design-system";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import type { TransactionFilters as FilterType } from "@/types/financial";
import { useLocation, useSearch } from "wouter";

const formSchema = z.object({
  descricao: z.string().min(1, "Descrição obrigatória"),
  valor: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
  tipo: z.enum(["receita", "despesa"], { required_error: "Selecione o tipo" }),
  categoria: z.string().min(1, "Categoria obrigatória"),
  data: z.string().optional(),
  cartaoId: z.string().optional(),
});

interface PeriodSummary {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  variacaoReceitas: number;
  variacaoDespesas: number;
  transacoesTotal: number;
}

export default function Transacoes() {
  const { period } = usePeriod();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const searchParams = useSearch();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transacao | null>(null);

  // Parse filters from URL
  const urlParams = new URLSearchParams(searchParams);
  const initialFilters: FilterType = {
    period,
    type: (urlParams.get("type") as any) || undefined,
    category: urlParams.get("category") || undefined,
    accountId: urlParams.get("accountId") || undefined,
    search: urlParams.get("search") || undefined,
  };

  const [filters, setFilters] = useState<FilterType>(initialFilters);

  // Sync filters with URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.type) params.set("type", filters.type);
    if (filters.category) params.set("category", filters.category);
    if (filters.accountId) params.set("accountId", filters.accountId);
    if (filters.search) params.set("search", filters.search);
    if (period) params.set("period", period);

    const newSearch = params.toString();
    const currentPath = location.split("?")[0];
    setLocation(`${currentPath}${newSearch ? `?${newSearch}` : ""}`);
  }, [filters, period, location, setLocation]);

  // Build query string for API
  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (filters.period) params.set("period", filters.period);
    if (filters.type) params.set("tipo", filters.type);
    if (filters.category) params.set("categoria", filters.category);
    if (filters.accountId) params.set("cartaoId", filters.accountId);
    if (filters.goalId) params.set("goalId", filters.goalId);
    if (filters.search) params.set("search", filters.search);
    if (filters.minAmount !== undefined)
      params.set("minAmount", filters.minAmount.toString());
    if (filters.maxAmount !== undefined)
      params.set("maxAmount", filters.maxAmount.toString());
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    return params.toString();
  };

  // Fetch transactions with filters
  const { data: transacoes, isLoading: transacoesLoading } = useQuery<
    Transacao[]
  >({
    queryKey: ["/api/transacoes", filters],
    queryFn: async () => {
      const queryString = buildQueryString();
      const response = await fetch(`/api/transacoes?${queryString}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
  });

  // Fetch summary
  const { data: summary, isLoading: summaryLoading } = useQuery<PeriodSummary>({
    queryKey: ["/api/analytics/period-summary", { period }],
    queryFn: async () => {
      const response = await fetch(
        `/api/analytics/period-summary?period=${period}`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch period summary");
      return response.json();
    },
  });

  // Fetch cards
  const { data: cartoes } = useQuery<any[]>({
    queryKey: ["/api/cartoes"],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricao: "",
      valor: 0,
      tipo: undefined,
      categoria: "",
      data: new Date().toISOString().split("T")[0],
      cartaoId: undefined,
    },
  });

  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const dataToSend: any = {
        descricao: values.descricao,
        valor: values.valor.toString(),
        tipo: values.tipo === "receita" ? "entrada" : "saida",
        categoria: values.categoria,
        dataReal: values.data || new Date().toISOString().split("T")[0],
        origem: "manual",
      };

      if (values.cartaoId && values.cartaoId !== "none") {
        dataToSend.cartaoId = values.cartaoId;
      }

      return await apiRequest("POST", "/api/transacoes", dataToSend);
    },
    onSuccess: () => {
      toast({
        title: "Transação criada com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transacoes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/period-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/overview"] });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar transação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: z.infer<typeof formSchema>;
    }) => {
      const dataToSend: any = {
        descricao: values.descricao,
        valor: values.valor.toString(),
        tipo: values.tipo === "receita" ? "entrada" : "saida",
        categoria: values.categoria,
        dataReal: values.data || new Date().toISOString().split("T")[0],
      };

      if (values.cartaoId && values.cartaoId !== "none") {
        dataToSend.cartaoId = values.cartaoId;
      } else {
        dataToSend.cartaoId = null;
      }

      return await apiRequest("PATCH", `/api/transacoes/${id}`, dataToSend);
    },
    onSuccess: () => {
      toast({
        title: "Transação atualizada!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transacoes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/period-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/overview"] });
      setEditDialogOpen(false);
      setSelectedTransaction(null);
      editForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar transação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/transacoes/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Transação excluída!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transacoes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/period-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/overview"] });
      setDeleteDialogOpen(false);
      setSelectedTransaction(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir transação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createMutation.mutate(values);
  };

  const onEditSubmit = (values: z.infer<typeof formSchema>) => {
    if (selectedTransaction) {
      updateMutation.mutate({ id: selectedTransaction.id, values });
    }
  };

  const handleEdit = (transacao: Transacao) => {
    setSelectedTransaction(transacao);
    editForm.reset({
      descricao: transacao.descricao || "",
      valor: parseFloat(transacao.valor),
      tipo: transacao.tipo === "entrada" ? "receita" : "despesa",
      categoria: transacao.categoria,
      data: transacao.dataReal,
      cartaoId: transacao.cartaoId || undefined,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (transacao: Transacao) => {
    setSelectedTransaction(transacao);
    setDeleteDialogOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getTransactionIcon = (tipo: string) => {
    switch (tipo) {
      case "entrada":
        return <TrendingUp className="h-5 w-5 text-[#4ADE80]" />;
      case "economia":
        return <PiggyBank className="h-5 w-5 text-[#60A5FA]" />;
      default:
        return <TrendingDown className="h-5 w-5 text-[#FB7185]" />;
    }
  };

  const getTransactionColor = (tipo: string) => {
    switch (tipo) {
      case "entrada":
        return "text-[#4ADE80]";
      case "economia":
        return "text-[#60A5FA]";
      default:
        return "text-[#FB7185]";
    }
  };

  const getTransactionBg = (tipo: string) => {
    switch (tipo) {
      case "entrada":
        return "bg-[#4ADE80]/10";
      case "economia":
        return "bg-[#60A5FA]/10";
      default:
        return "bg-[#FB7185]/10";
    }
  };

  if (transacoesLoading || summaryLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="space-y-8 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <PageHeader
          title="Transações"
          subtitle="Gerencie todas as suas transações financeiras"
          action={
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-[#4ADE80] hover:bg-[#4ADE80]/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Transação
            </Button>
          }
        />

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <StatCard
              label="Total de Receitas"
              value={formatCurrency(summary.totalReceitas)}
              trend={summary.variacaoReceitas > 0 ? "up" : "down"}
              trendValue={Math.abs(summary.variacaoReceitas).toFixed(1)}
              icon={TrendingUp}
            />
            <StatCard
              label="Total de Despesas"
              value={formatCurrency(summary.totalDespesas)}
              trend={summary.variacaoDespesas < 0 ? "up" : "down"}
              trendValue={Math.abs(summary.variacaoDespesas).toFixed(1)}
              icon={TrendingDown}
            />
            <StatCard
              label="Saldo do Período"
              value={formatCurrency(summary.saldo)}
              trend={summary.saldo > 0 ? "up" : "down"}
              icon={PiggyBank}
            />
          </div>
        )}

        {/* Filters */}
        <TransactionFilters filters={filters} onFiltersChange={setFilters} />

        {/* Transactions List */}
        {transacoesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : transacoes && transacoes.length > 0 ? (
          <div className="space-y-3">
            {/* Desktop: Table view */}
            <div className="hidden md:block">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-4 text-sm font-semibold text-muted-foreground">
                            Data
                          </th>
                          <th className="text-left p-4 text-sm font-semibold text-muted-foreground">
                            Descrição
                          </th>
                          <th className="text-left p-4 text-sm font-semibold text-muted-foreground">
                            Categoria
                          </th>
                          <th className="text-right p-4 text-sm font-semibold text-muted-foreground">
                            Valor
                          </th>
                          <th className="text-right p-4 text-sm font-semibold text-muted-foreground">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {transacoes.map((transacao) => (
                          <tr
                            key={transacao.id}
                            className="border-b hover:bg-muted/50 transition-colors"
                          >
                            <td className="p-4 text-sm">
                              {formatDate(transacao.dataReal)}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`p-1.5 rounded-lg ${getTransactionBg(
                                    transacao.tipo
                                  )}`}
                                >
                                  {getTransactionIcon(transacao.tipo)}
                                </div>
                                <span className="font-medium">
                                  {transacao.descricao || transacao.categoria}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge variant="outline" className="text-xs">
                                {transacao.categoria}
                              </Badge>
                            </td>
                            <td className="p-4 text-right">
                              <span
                                className={`font-bold font-mono ${getTransactionColor(
                                  transacao.tipo
                                )}`}
                              >
                                {transacao.tipo === "entrada" ? "+" : "-"}
                                {formatCurrency(parseFloat(transacao.valor))}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(transacao)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(transacao)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mobile: Card view */}
            <div className="md:hidden space-y-3">
              {transacoes.map((transacao) => (
                <Card key={transacao.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className={`p-2 rounded-lg flex-shrink-0 ${getTransactionBg(
                            transacao.tipo
                          )}`}
                        >
                          {getTransactionIcon(transacao.tipo)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm mb-1 truncate">
                            {transacao.descricao || transacao.categoria}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs text-muted-foreground">
                              {formatDate(transacao.dataReal)}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {transacao.categoria}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p
                          className={`font-bold font-mono text-sm ${getTransactionColor(
                            transacao.tipo
                          )}`}
                        >
                          {transacao.tipo === "entrada" ? "+" : "-"}
                          {formatCurrency(parseFloat(transacao.valor))}
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(transacao)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDelete(transacao)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Nenhuma transação encontrada
              </h3>
              <p className="text-muted-foreground mb-6">
                {Object.values(filters).some((v) => v && v !== period)
                  ? "Tente ajustar os filtros"
                  : "Comece adicionando sua primeira transação"}
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Transação
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Transação</DialogTitle>
              <DialogDescription>
                Adicione uma nova transação ao seu registro
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="receita">Receita</SelectItem>
                          <SelectItem value="despesa">Despesa</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
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
                            placeholder="0,00"
                            {...field}
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
                        <FormLabel>Data</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva a transação..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("tipo") === "despesa" && cartoes && cartoes.length > 0 && (
                  <FormField
                    control={form.control}
                    name="cartaoId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cartão (opcional)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o cartão" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Sem cartão</SelectItem>
                            {cartoes.map((card) => (
                              <SelectItem key={card.id} value={card.id}>
                                {card.nomeCartao}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={createMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Transação</DialogTitle>
              <DialogDescription>
                Atualize os dados da transação
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form
                onSubmit={editForm.handleSubmit(onEditSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={editForm.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="receita">Receita</SelectItem>
                          <SelectItem value="despesa">Despesa</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="valor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor (R$)</FormLabel>
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
                    control={editForm.control}
                    name="data"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
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
                  control={editForm.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva a transação..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {editForm.watch("tipo") === "despesa" &&
                  cartoes &&
                  cartoes.length > 0 && (
                    <FormField
                      control={editForm.control}
                      name="cartaoId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cartão (opcional)</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || "none"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o cartão" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Sem cartão</SelectItem>
                              {cartoes.map((card) => (
                                <SelectItem key={card.id} value={card.id}>
                                  {card.nomeCartao}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditDialogOpen(false);
                      setSelectedTransaction(null);
                    }}
                    disabled={updateMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Transação</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta transação? Esta ação não
                pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (selectedTransaction) {
                    deleteMutation.mutate(selectedTransaction.id);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

