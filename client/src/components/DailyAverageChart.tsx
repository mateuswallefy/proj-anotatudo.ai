import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, TooltipProps } from "recharts";

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

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload || !payload.length) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="bg-card/95 backdrop-blur-md border border-border rounded-lg p-3 shadow-lg">
      <p className="text-xs text-muted-foreground font-medium mb-2">Dia {label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm font-medium">{entry.name}:</span>
          </div>
          <span className="text-sm font-mono font-semibold tabular-nums">
            {formatCurrency(entry.value as number)}
          </span>
        </div>
      ))}
    </div>
  );
};

export function DailyAverageChart({ gastosPorDia, receitasPorDia }: DailyAverageChartProps) {
  const chartData = gastosPorDia.map((gasto, index) => ({
    data: new Date(gasto.data).getDate().toString(),
    gastos: gasto.total,
    receitas: receitasPorDia[index]?.total || 0,
  }));

  const hasData = chartData.some(d => d.gastos > 0 || d.receitas > 0);

  return (
    <Card className="h-full hover-elevate transition-shadow duration-200" data-testid="card-daily-chart">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Evolução Diária do Mês</CardTitle>
        <p className="text-sm text-muted-foreground">
          Acompanhe seus gastos e receitas dia a dia
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        {hasData ? (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart 
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                strokeOpacity={0.1}
                vertical={false}
              />
              <XAxis 
                dataKey="data" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))', strokeOpacity: 0.2 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ fill: 'hsl(var(--accent) / 0.1)' }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Area
                type="monotone"
                dataKey="receitas"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorReceitas)"
                name="Receitas"
                dot={{ r: 3, fill: 'hsl(var(--chart-1))', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: 'hsl(var(--chart-1))', strokeWidth: 0 }}
                animationDuration={400}
                animationEasing="ease-out"
              />
              <Area
                type="monotone"
                dataKey="gastos"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorGastos)"
                name="Despesas"
                dot={{ r: 3, fill: 'hsl(var(--chart-2))', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: 'hsl(var(--chart-2))', strokeWidth: 0 }}
                animationDuration={400}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[320px] flex items-center justify-center text-muted-foreground">
            Nenhuma movimentação financeira este mês
          </div>
        )}
      </CardContent>
    </Card>
  );
}
