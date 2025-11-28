import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, TooltipProps } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

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

  const receitas = payload.find(p => p.dataKey === 'receitas')?.value as number || 0;
  const gastos = payload.find(p => p.dataKey === 'gastos')?.value as number || 0;
  const saldo = receitas - gastos;

  return (
    <div className="bg-card/95 backdrop-blur-md border border-border rounded-lg p-4 shadow-lg">
      <p className="text-sm font-semibold mb-3">Dia {label}</p>
      <div className="space-y-2">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm font-medium">{entry.name}:</span>
            </div>
            <span className="text-sm font-mono font-semibold tabular-nums">
              {formatCurrency(entry.value as number)}
            </span>
          </div>
        ))}
        <div className="border-t border-border pt-2 mt-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {saldo > 0 ? (
                <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              ) : saldo < 0 ? (
                <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400" />
              ) : (
                <Minus className="w-3 h-3 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">Saldo:</span>
            </div>
            <span className={`text-sm font-mono font-semibold tabular-nums ${
              saldo >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {formatCurrency(saldo)}
            </span>
          </div>
        </div>
      </div>
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
  
  const totalReceitas = chartData.reduce((sum, d) => sum + d.receitas, 0);
  const totalDespesas = chartData.reduce((sum, d) => sum + d.gastos, 0);
  const saldoPeriodo = totalReceitas - totalDespesas;

  return (
    <Card className="h-full" data-testid="card-daily-chart">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg font-semibold">Evolução Diária do Mês</CardTitle>
          {hasData && (
            <div className="text-sm font-mono font-semibold tabular-nums">
              <span className={saldoPeriodo >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                {saldoPeriodo >= 0 ? '+' : ''}R$ {Math.abs(saldoPeriodo).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Acompanhe suas movimentações dia a dia
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
                <linearGradient id="dailyReceitas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F9D58" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#0F9D58" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="dailyGastos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F2994A" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#F2994A" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                strokeOpacity={0.3}
                vertical={false}
              />
              <XAxis 
                dataKey="data" 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))', strokeOpacity: 0.2 }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Area
                type="monotone"
                dataKey="receitas"
                stroke="#0F9D58"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#dailyReceitas)"
                name="Receitas"
                dot={{ r: 4, fill: '#0F9D58', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#0F9D58', strokeWidth: 2, stroke: '#fff' }}
                animationDuration={600}
                animationEasing="ease-out"
              />
              <Area
                type="monotone"
                dataKey="gastos"
                stroke="#F2994A"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#dailyGastos)"
                name="Despesas"
                dot={{ r: 4, fill: '#F2994A', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#F2994A', strokeWidth: 2, stroke: '#fff' }}
                animationDuration={600}
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
