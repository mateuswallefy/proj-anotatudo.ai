import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { Transacao } from "@shared/schema";
import { categorias } from "@shared/schema";
import { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, Search, Edit } from "lucide-react";
import { EditTransactionDialog } from "@/components/edit-transaction-dialog";
import { usePeriod } from "@/contexts/PeriodContext";
import { PeriodSelector } from "@/components/PeriodSelector";

export default function Transacoes() {
  const { period } = usePeriod();
  const { data: transacoes, isLoading } = useQuery<Transacao[]>({
    queryKey: ["/api/transacoes", { period }],
    queryFn: async () => {
      const response = await fetch(`/api/transacoes?period=${period}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    }
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [editingTransaction, setEditingTransaction] = useState<Transacao | null>(null);

  const filteredTransacoes = useMemo(() => {
    if (!transacoes) return [];

    return transacoes
      .filter(t => {
        const matchesSearch = t.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            t.categoria.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === "all" || t.categoria === categoryFilter;
        const matchesType = typeFilter === "all" || t.tipo === typeFilter;
        return matchesSearch && matchesCategory && matchesType;
      })
      .sort((a, b) => new Date(b.dataReal).getTime() - new Date(a.dataReal).getTime());
  }, [transacoes, searchTerm, categoryFilter, typeFilter]);

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(parseFloat(value));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getOrigemBadgeVariant = (origem: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      texto: "default",
      audio: "secondary",
      foto: "outline",
      video: "outline",
      manual: "secondary",
    };
    return variants[origem] || "default";
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Transações</h1>
          <p className="text-muted-foreground">
            Histórico completo de todas as suas transações
          </p>
        </div>
        <PeriodSelector />
      </div>

      {/* Filters */}
      <Card data-testid="card-filters">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar transações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-transactions"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger data-testid="select-category-filter">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                {categorias.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger data-testid="select-type-filter">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="entrada">Entradas</SelectItem>
                <SelectItem value="saida">Saídas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table/Cards */}
      <Card data-testid="card-transactions-table">
        <CardHeader>
          <CardTitle>
            {filteredTransacoes.length} {filteredTransacoes.length === 1 ? 'Transação' : 'Transações'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransacoes.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransacoes.map((transacao) => (
                      <TableRow key={transacao.id} className="hover-elevate" data-testid={`row-transaction-${transacao.id}`}>
                        <TableCell className="font-mono text-sm">
                          {formatDate(transacao.dataReal)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{transacao.categoria}</Badge>
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {transacao.descricao || '-'}
                        </TableCell>
                        <TableCell className={`text-right font-mono font-semibold ${
                          transacao.tipo === 'entrada' ? 'text-chart-1' : 'text-destructive'
                        }`}>
                          {transacao.tipo === 'entrada' ? '+' : '-'} {formatCurrency(transacao.valor)}
                        </TableCell>
                        <TableCell>
                          {transacao.tipo === 'entrada' ? (
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-chart-1" />
                              <span>Entrada</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <TrendingDown className="w-4 h-4 text-destructive" />
                              <span>Saída</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getOrigemBadgeVariant(transacao.origem)} className="text-xs">
                            {transacao.origem}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingTransaction(transacao)}
                            data-testid={`button-edit-transaction-${transacao.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {filteredTransacoes.map((transacao) => (
                  <Card 
                    key={transacao.id} 
                    className="hover-elevate relative" 
                    data-testid={`card-transaction-${transacao.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="absolute top-2 right-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingTransaction(transacao)}
                          data-testid={`button-edit-transaction-mobile-${transacao.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-start justify-between mb-3 pr-10">
                        <div className="flex items-center gap-2">
                          {transacao.tipo === 'entrada' ? (
                            <TrendingUp className="w-5 h-5 text-chart-1" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-destructive" />
                          )}
                          <Badge variant="secondary" className="text-xs px-2 py-0.5">
                            {transacao.categoria}
                          </Badge>
                        </div>
                        <p className={`font-mono font-bold text-base ${
                          transacao.tipo === 'entrada' ? 'text-chart-1' : 'text-destructive'
                        }`}>
                          {transacao.tipo === 'entrada' ? '+' : '-'} {formatCurrency(transacao.valor)}
                        </p>
                      </div>
                      
                      <p className="text-sm mb-2 line-clamp-2">
                        {transacao.descricao || 'Sem descrição'}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-mono">{formatDate(transacao.dataReal)}</span>
                        <Badge variant={getOrigemBadgeVariant(transacao.origem)} className="text-xs px-2 py-0.5">
                          {transacao.origem}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
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
      
      {editingTransaction && (
        <EditTransactionDialog
          transaction={editingTransaction}
          open={!!editingTransaction}
          onOpenChange={(open) => !open && setEditingTransaction(null)}
        />
      )}
    </div>
  );
}
