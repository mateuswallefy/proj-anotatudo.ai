import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

interface DailyAverageChartProps {
  gastosPorDia: Array<{
    data: string;
    total: number;
  }>;
  receitasPorDia: Array<{
    data: string;
    total: number;
  }>;
}

export function DailyAverageChart({ gastosPorDia, receitasPorDia }: DailyAverageChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Combine data
  const chartData = gastosPorDia.map((gasto, index) => ({
    data: new Date(gasto.data).getDate().toString(),
    gastos: gasto.total,
    receitas: receitasPorDia[index]?.total || 0,
  }));

  const hasData = chartData.some(d => d.gastos > 0 || d.receitas > 0);

  return (
    <Card className="h-full" data-testid="card-daily-chart">
      <CardHeader>
        <CardTitle>Evolução Diária do Mês</CardTitle>
        <p className="text-sm text-muted-foreground">
          Acompanhe seus gastos e receitas dia a dia
        </p>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="data" 
                label={{ value: 'Dia do Mês', position: 'insideBottom', offset: -5 }}
              />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Area
                type="monotone"
                dataKey="receitas"
                stroke="hsl(var(--chart-1))"
                fillOpacity={1}
                fill="url(#colorReceitas)"
                name="Receitas"
              />
              <Area
                type="monotone"
                dataKey="gastos"
                stroke="hsl(var(--destructive))"
                fillOpacity={1}
                fill="url(#colorGastos)"
                name="Gastos"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Nenhuma movimentação financeira este mês
          </div>
        )}
      </CardContent>
    </Card>
  );
}
