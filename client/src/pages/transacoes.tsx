import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import type { Transacao } from "@shared/schema";
import { categorias } from "@shared/schema";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  PiggyBank,
  Download,
  Filter,
  Plus,
  Utensils,
  Car,
  Home,
  Heart,
  BookOpen,
  Gamepad2,
  ShoppingBag,
  CreditCard,
  DollarSign,
  Package,
  Type,
  Image as ImageIcon,
  Mic,
  FileText,
  Video,
  Calendar,
  Clock
} from "lucide-react";
import { StatCard } from "@/components/cards/StatCard";
import { usePeriod } from "@/contexts/PeriodContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface PeriodSummary {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  variacaoReceitas: number;
  variacaoDespesas: number;
  transacoesTotal: number;
}

const formSchema = z.object({
  descricao: z.string().min(1, "Descrição obrigatória"),
  valor: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
  tipo: z.enum(["receita", "despesa"], { required_error: "Selecione o tipo" }),
  categoria: z.string().min(1, "Categoria obrigatória"),
  data: z.string().optional(),
  cartaoId: z.string().optional(),
});

export default function Transacoes() {
  const { period } = usePeriod();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { data: transacoes, isLoading: transacoesLoading } = useQuery<Transacao[]>({
    queryKey: ["/api/transacoes", { period }],
    queryFn: async () => {
      const response = await fetch(`/api/transacoes?period=${period}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    }
  });

  const { data: summary, isLoading: summaryLoading } = useQuery<PeriodSummary>({
    queryKey: ["/api/analytics/period-summary", { period }],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/period-summary?period=${period}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch period summary');
      return response.json();
    }
  });

  const { data: cartoes } = useQuery<any[]>({
    queryKey: ["/api/cartoes"],
  });

  const [searchTerm, setSearchTerm] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricao: "",
      valor: 0,
      tipo: undefined,
      categoria: "",
      data: new Date().toISOString().split('T')[0],
      cartaoId: undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const dataToSend: any = {
        descricao: values.descricao,
        valor: values.valor.toString(),
        tipo: values.tipo === "receita" ? "entrada" : "saida",
        categoria: values.categoria,
        dataReal: values.data || new Date().toISOString().split('T')[0],
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

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createMutation.mutate(values);
  };

  const filteredTransacoes = useMemo(() => {
    if (!transacoes) return [];

    return transacoes
      .filter(t => {
        const matchesSearch = t.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            t.categoria.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
      })
      .sort((a, b) => new Date(b.dataReal).getTime() - new Date(a.dataReal).getTime());
  }, [transacoes, searchTerm]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getCategoryIcon = (categoria: string) => {
    const iconMap: Record<string, any> = {
      'Alimentação': Utensils,
      'Transporte': Car,
      'Moradia': Home,
      'Saúde': Heart,
      'Educação': BookOpen,
      'Lazer': Gamepad2,
      'Compras': ShoppingBag,
      'Contas': CreditCard,
      'Salário': DollarSign,
      'Investimentos': TrendingUp,
      'Outros': Package,
    };
    return iconMap[categoria] || Package;
  };

  const getCategoryColor = (categoria: string) => {
    const colorMap: Record<string, string> = {
      'Alimentação': 'hsl(var(--chart-1))',
      'Transporte': 'hsl(var(--chart-2))',
      'Moradia': 'hsl(var(--chart-3))',
      'Saúde': 'hsl(var(--chart-4))',
      'Educação': 'hsl(var(--chart-5))',
      'Lazer': 'hsl(var(--chart-1))',
      'Compras': 'hsl(var(--chart-2))',
      'Contas': 'hsl(var(--chart-3))',
      'Salário': 'hsl(var(--primary))',
      'Investimentos': 'hsl(var(--primary))',
      'Outros': 'hsl(var(--muted-foreground))',
    };
    return colorMap[categoria] || 'hsl(var(--muted-foreground))';
  };

  const getOrigemIcon = (origem: string) => {
    const iconMap: Record<string, any> = {
      'texto': Type,
      'audio': Mic,
      'foto': ImageIcon,
      'video': Video,
      'manual': FileText,
    };
    return iconMap[origem] || FileText;
  };

  const getOrigemLabel = (origem: string) => {
    const labelMap: Record<string, string> = {
      'texto': 'Texto',
      'audio': 'Áudio',
      'foto': 'Foto',
      'video': 'Vídeo',
      'manual': 'Manual',
    };
    return labelMap[origem] || 'Manual';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (transacoesLoading || summaryLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const economias = (summary?.saldo || 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-8 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Premium Header Section */}
        <div className="space-y-4" data-testid="header-section">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent" data-testid="text-page-title">
                Registros Financeiros
              </h1>
              <p className="text-muted-foreground text-base md:text-lg" data-testid="text-page-subtitle">
                Todas as suas movimentações organizadas
              </p>
            </div>
            <Button 
              variant="default"
              size="lg"
              className="shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
              data-testid="button-new-transaction"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="w-5 h-5 mr-2" />
              Nova Transação
            </Button>
          </div>

          {/* Premium Search Bar */}
          <div className="relative max-w-2xl" data-testid="search-bar-section">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por descrição, categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 text-base border-2 focus:border-primary/50 transition-colors rounded-xl shadow-sm"
              data-testid="input-search-transactions"
            />
          </div>
        </div>

        {/* Premium Nova Transação Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[540px] rounded-2xl" data-testid="dialog-new-transaction">
            <DialogHeader className="space-y-2 pb-2">
              <DialogTitle className="text-2xl font-bold tracking-tight">Novo Registro Financeiro</DialogTitle>
              <DialogDescription className="text-base">
                Adicione uma nova transação manualmente ao seu controle financeiro
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">Tipo de Transação</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-xl border-2" data-testid="select-tipo">
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="receita" data-testid="option-receita">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-emerald-600" />
                                Receita (Entrada)
                              </div>
                            </SelectItem>
                            <SelectItem value="despesa" data-testid="option-despesa">
                              <div className="flex items-center gap-2">
                                <TrendingDown className="w-4 h-4 text-red-600" />
                                Despesa (Saída)
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="valor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">Valor (R$)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0,00" 
                            className="h-12 rounded-xl border-2 font-mono text-base"
                            data-testid="input-valor"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Descrição</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Almoço no restaurante" 
                          className="h-12 rounded-xl border-2 text-base"
                          data-testid="input-descricao"
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
                              <SelectItem key={cat} value={cat} data-testid={`option-categoria-${cat}`}>
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
                    name="data"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">Data</FormLabel>
                        <FormControl>
                          <Input 
                            type="date"
                            className="h-12 rounded-xl border-2 font-mono"
                            data-testid="input-data"
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
                  name="cartaoId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Cartão de Crédito (opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl border-2" data-testid="select-cartao">
                            <SelectValue placeholder="Nenhum cartão" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none" data-testid="option-cartao-none">
                            Nenhum cartão
                          </SelectItem>
                          {cartoes?.map((cartao) => (
                            <SelectItem key={cartao.id} value={cartao.id} data-testid={`option-cartao-${cartao.id}`}>
                              {cartao.nome} - {cartao.bandeira}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                    className="h-11 px-6 rounded-xl font-medium"
                    data-testid="button-cancel"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    className="h-11 px-6 rounded-xl font-medium shadow-lg hover:shadow-xl transition-shadow"
                    data-testid="button-submit"
                  >
                    {createMutation.isPending ? "Criando..." : "Registrar Transação"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Summary Cards - Premium Design */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6" data-testid="summary-cards-section">
          <StatCard
            icon={TrendingUp}
            label="Total Receitas"
            value={formatCurrency(summary?.totalReceitas || 0)}
            trend={summary?.variacaoReceitas ? `+${summary.variacaoReceitas.toFixed(1)}%` : '+0%'}
            iconColor="text-emerald-600 dark:text-emerald-400"
            iconBg="bg-emerald-500/10"
            className="border-emerald-500/20 shadow-sm"
            data-testid="card-total-receitas"
          />
          <StatCard
            icon={TrendingDown}
            label="Total Gastos"
            value={formatCurrency(summary?.totalDespesas || 0)}
            trend={summary?.variacaoDespesas ? `${summary.variacaoDespesas > 0 ? '+' : ''}${summary.variacaoDespesas.toFixed(1)}%` : '0%'}
            iconColor="text-red-600 dark:text-red-400"
            iconBg="bg-red-500/10"
            className="border-red-500/20 shadow-sm"
            data-testid="card-total-gastos"
          />
          <StatCard
            icon={PiggyBank}
            label="Economias"
            value={formatCurrency(economias)}
            subtitle="Meta mensal atingida"
            iconColor="text-purple-600 dark:text-purple-400"
            iconBg="bg-purple-500/10"
            className="border-purple-500/20 shadow-sm"
            data-testid="card-economias"
          />
        </div>

        {/* Premium Transactions List - Financial Records Design */}
        <div className="space-y-6" data-testid="card-transactions-list">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight" data-testid="text-section-title">
                Registros Financeiros
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredTransacoes.length} {filteredTransacoes.length === 1 ? 'registro encontrado' : 'registros encontrados'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                className="h-10 w-10 rounded-xl border-2"
                data-testid="button-download"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                className="h-10 w-10 rounded-xl border-2"
                data-testid="button-filter"
              >
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {filteredTransacoes.length > 0 ? (
            <div className="space-y-3">
              {filteredTransacoes.map((transacao) => {
                const IconComponent = getCategoryIcon(transacao.categoria);
                const categoryColor = getCategoryColor(transacao.categoria);
                const OrigemIcon = getOrigemIcon(transacao.origem);
                const isEntrada = transacao.tipo === 'entrada';
                
                return (
                  <div
                    key={transacao.id}
                    className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-border hover:shadow-lg transition-all duration-300 hover:bg-card"
                    data-testid={`card-transaction-${transacao.id}`}
                  >
                    {/* Left border accent based on type */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                      isEntrada 
                        ? 'bg-emerald-500' 
                        : 'bg-red-500'
                    }`} />
                    
                    <div className="p-5 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Left: Category Icon + Info */}
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          {/* Category Icon Circle */}
                          <div 
                            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105"
                            style={{ 
                              backgroundColor: `${categoryColor}15`,
                              border: `1px solid ${categoryColor}30`
                            }}
                          >
                            <IconComponent 
                              className="w-7 h-7" 
                              style={{ color: categoryColor }}
                            />
                          </div>
                          
                          {/* Transaction Details */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base md:text-lg leading-tight mb-1.5 truncate" data-testid={`text-description-${transacao.id}`}>
                                  {transacao.descricao || transacao.categoria}
                                </h3>
                                <div className="flex items-center gap-3 flex-wrap">
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span data-testid={`text-date-${transacao.id}`}>
                                      {formatDate(transacao.dataReal)}
                                    </span>
                                  </div>
                                  {transacao.dataRegistro && (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                      <Clock className="w-3.5 h-3.5" />
                                      <span>{formatTime(transacao.dataRegistro)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Category Badge + Origin Badge */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge 
                                variant="secondary"
                                className="text-xs font-medium px-2.5 py-0.5 rounded-lg border"
                                style={{ 
                                  backgroundColor: `${categoryColor}10`,
                                  borderColor: `${categoryColor}30`,
                                  color: categoryColor
                                }}
                              >
                                {transacao.categoria}
                              </Badge>
                              
                              <Badge 
                                variant="outline"
                                className="text-xs font-medium px-2.5 py-0.5 rounded-lg flex items-center gap-1.5"
                              >
                                <OrigemIcon className="w-3 h-3" />
                                <span>{getOrigemLabel(transacao.origem)}</span>
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Right: Amount - Premium Typography */}
                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-2 md:gap-1.5 flex-shrink-0 md:ml-4 w-full md:w-auto">
                          <p 
                            className={`font-mono font-bold text-lg md:text-xl lg:text-2xl tabular-nums tracking-tight ${
                              isEntrada 
                                ? 'text-emerald-600 dark:text-emerald-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}
                            data-testid={`text-amount-${transacao.id}`}
                          >
                            {isEntrada ? '+' : '-'} {formatCurrency(parseFloat(transacao.valor))}
                          </p>
                          <Badge 
                            variant={isEntrada ? 'default' : 'destructive'}
                            className="text-xs font-semibold px-3 py-1 rounded-full"
                            data-testid={`badge-type-${transacao.id}`}
                          >
                            {isEntrada ? 'Entrada' : 'Saída'}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Media Preview (if exists) */}
                      {transacao.mediaUrl && (
                        <div className="mt-4 pt-4 border-t border-border/50">
                          <a 
                            href={transacao.mediaUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs text-primary hover:underline"
                          >
                            <ImageIcon className="w-4 h-4" />
                            Ver comprovante
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center rounded-2xl border border-border/50 bg-muted/20">
              <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mb-6">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Nenhum registro encontrado</h3>
              <p className="text-muted-foreground max-w-md">
                Tente ajustar sua busca ou adicionar novos registros financeiros
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
