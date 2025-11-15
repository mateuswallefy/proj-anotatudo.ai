import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Wallet, CreditCard as CreditCardIcon } from "lucide-react";
import type { Transacao, Cartao } from "@shared/schema";
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useMemo } from "react";

export default function Dashboard() {
  const { data: transacoes, isLoading: loadingTransacoes } = useQuery<Transacao[]>({
    queryKey: ["/api/transacoes"],
  });

  const { data: cartoes, isLoading: loadingCartoes } = useQuery<Cartao[]>({
    queryKey: ["/api/cartoes"],
  });

  const stats = useMemo(() => {
    if (!transacoes) return { entradas: 0, saidas: 0, saldo: 0 };

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthTransactions = transacoes.filter(t => {
      const date = new Date(t.dataReal);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const entradas = monthTransactions
      .filter(t => t.tipo === 'entrada')
      .reduce((sum, t) => sum + parseFloat(t.valor), 0);

    const saidas = monthTransactions
      .filter(t => t.tipo === 'saida')
      .reduce((sum, t) => sum + parseFloat(t.valor), 0);

    return {
      entradas,
      saidas,
      saldo: entradas - saidas,
    };
  }, [transacoes]);

  const categoryData = useMemo(() => {
    if (!transacoes) return [];

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthTransactions = transacoes.filter(t => {
      const date = new Date(t.dataReal);
      return date.getMonth() === currentMonth && 
             date.getFullYear() === currentYear && 
             t.tipo === 'saida';
    });

    const categoryMap = new Map<string, number>();
    monthTransactions.forEach(t => {
      const current = categoryMap.get(t.categoria) || 0;
      categoryMap.set(t.categoria, current + parseFloat(t.valor));
    });

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [transacoes]);

  const weeklyData = useMemo(() => {
    if (!transacoes) return [];

    const now = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    return last7Days.map(date => {
      const dayTransactions = transacoes.filter(t => {
        const tDate = new Date(t.dataReal);
        return tDate.toDateString() === date.toDateString();
      });

      const entradas = dayTransactions
        .filter(t => t.tipo === 'entrada')
        .reduce((sum, t) => sum + parseFloat(t.valor), 0);

      const saidas = dayTransactions
        .filter(t => t.tipo === 'saida')
        .reduce((sum, t) => sum + parseFloat(t.valor), 0);

      return {
        dia: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
        entradas,
        saidas,
      };
    });
  }, [transacoes]);

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--muted))'];

  const totalLimiteCartoes = useMemo(() => {
    if (!cartoes) return { total: 0, usado: 0 };
    return {
      total: cartoes.reduce((sum, c) => sum + parseFloat(c.limiteTotal), 0),
      usado: cartoes.reduce((sum, c) => sum + parseFloat(c.limiteUsado), 0),
    };
  }, [cartoes]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loadingTransacoes || loadingCartoes) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral das suas finanças</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card data-testid="card-stat-entradas">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas (Mês)</CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-testid="text-entradas">
              {formatCurrency(stats.entradas)}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-saidas">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saídas (Mês)</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-testid="text-saidas">
              {formatCurrency(stats.saidas)}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-saldo">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo (Mês)</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-mono ${stats.saldo >= 0 ? 'text-chart-1' : 'text-destructive'}`} data-testid="text-saldo">
              {formatCurrency(stats.saldo)}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-cartoes">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Limite Cartões</CardTitle>
            <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-testid="text-limite-cartoes">
              {formatCurrency(totalLimiteCartoes.usado)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              de {formatCurrency(totalLimiteCartoes.total)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Pie Chart */}
        <Card data-testid="card-chart-categories">
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhuma despesa registrada este mês
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Line Chart */}
        <Card data-testid="card-chart-weekly">
          <CardHeader>
            <CardTitle>Evolução Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyData.some(d => d.entradas > 0 || d.saidas > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="entradas" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={2}
                    name="Entradas"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="saidas" 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={2}
                    name="Saídas"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhuma transação nos últimos 7 dias
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
