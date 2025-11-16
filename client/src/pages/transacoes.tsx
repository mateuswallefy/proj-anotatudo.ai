import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Transacao } from "@shared/schema";
import { useState, useMemo } from "react";
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
  Package
} from "lucide-react";
import { StatCard } from "@/components/cards/StatCard";
import { usePeriod } from "@/contexts/PeriodContext";

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

  const [searchTerm, setSearchTerm] = useState("");

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
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div data-testid="header-section">
        <h1 className="text-3xl font-bold tracking-tight mb-2" data-testid="text-page-title">
          Transações
        </h1>
        <p className="text-muted-foreground" data-testid="text-page-subtitle">
          Gerencie todas suas movimentações financeiras
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative" data-testid="search-bar-section">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Buscar transações..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-11 h-12 text-base"
          data-testid="input-search-transactions"
        />
      </div>

      {/* CTA Button */}
      <Button 
        variant="default"
        size="lg"
        data-testid="button-new-transaction"
      >
        <Plus className="w-5 h-5 mr-2" />
        Nova Transação
      </Button>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="summary-cards-section">
        <StatCard
          icon={TrendingUp}
          label="Total Receitas"
          value={formatCurrency(summary?.totalReceitas || 0)}
          trend={summary?.variacaoReceitas ? `+${summary.variacaoReceitas.toFixed(1)}%` : '+0%'}
          iconColor="text-purple-600 dark:text-purple-400"
          iconBg="bg-purple-500/10"
          className="border-purple-500/20"
          data-testid="card-total-receitas"
        />
        <StatCard
          icon={TrendingDown}
          label="Total Gastos"
          value={formatCurrency(summary?.totalDespesas || 0)}
          trend={summary?.variacaoDespesas ? `${summary.variacaoDespesas > 0 ? '+' : ''}${summary.variacaoDespesas.toFixed(1)}%` : '0%'}
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-500/10"
          className="border-blue-500/20"
          data-testid="card-total-gastos"
        />
        <StatCard
          icon={PiggyBank}
          label="Economias"
          value={formatCurrency(economias)}
          subtitle="Meta mensal atingida"
          iconColor="text-purple-600 dark:text-purple-400"
          iconBg="bg-purple-500/10"
          className="border-purple-500/20"
          data-testid="card-economias"
        />
      </div>

      {/* Transactions List Section */}
      <Card data-testid="card-transactions-list">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-xl font-semibold" data-testid="text-section-title">
              Todas as Transações
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                data-testid="button-download"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                data-testid="button-filter"
              >
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTransacoes.length > 0 ? (
            <div className="space-y-3">
              {filteredTransacoes.map((transacao) => {
                const IconComponent = getCategoryIcon(transacao.categoria);
                const categoryColor = getCategoryColor(transacao.categoria);
                
                return (
                  <Card 
                    key={transacao.id} 
                    className="hover-elevate transition-all duration-200" 
                    data-testid={`card-transaction-${transacao.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        {/* Left: Category Icon + Description + Date */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${categoryColor}15` }}
                          >
                            <IconComponent 
                              className="w-6 h-6" 
                              style={{ color: categoryColor }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate" data-testid={`text-description-${transacao.id}`}>
                              {transacao.descricao || transacao.categoria}
                            </p>
                            <p className="text-sm text-muted-foreground" data-testid={`text-date-${transacao.id}`}>
                              {formatDate(transacao.dataReal)}
                            </p>
                          </div>
                        </div>

                        {/* Right: Amount + Badge */}
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <p 
                            className={`font-mono font-bold text-lg tabular-nums ${
                              transacao.tipo === 'entrada' 
                                ? 'text-emerald-600 dark:text-emerald-400' 
                                : 'text-blue-600 dark:text-blue-400'
                            }`}
                            data-testid={`text-amount-${transacao.id}`}
                          >
                            {transacao.tipo === 'entrada' ? '+' : '-'} {formatCurrency(parseFloat(transacao.valor))}
                          </p>
                          <Badge 
                            variant={transacao.tipo === 'entrada' ? 'default' : 'secondary'}
                            className="text-xs"
                            data-testid={`badge-type-${transacao.id}`}
                          >
                            {transacao.tipo === 'entrada' ? 'Receita' : 'Gasto'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhuma transação encontrada</h3>
              <p className="text-muted-foreground">
                Tente ajustar os filtros ou adicionar novas transações
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
