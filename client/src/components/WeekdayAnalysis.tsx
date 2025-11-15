import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, TooltipProps, Cell } from "recharts";

interface WeekdayAnalysisProps {
  gastosPorDiaSemana: Record<string, number>;
  diaSemanaQueMaisGasta: {
    dia: string;
    total: number;
  } | null;
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
      <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
      <p className="text-base font-mono font-semibold tabular-nums">
        {formatCurrency(payload[0].value as number)}
      </p>
    </div>
  );
};

export function WeekdayAnalysis({ gastosPorDiaSemana, diaSemanaQueMaisGasta }: WeekdayAnalysisProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const chartData = Object.entries(gastosPorDiaSemana).map(([dia, total]) => ({
    dia: dia.substring(0, 3),
    diaCompleto: dia,
    total,
  }));

  const maxValue = Math.max(...chartData.map(d => d.total));
  const hasData = chartData.some(d => d.total > 0);

  return (
    <Card className="h-full hover-elevate transition-shadow duration-200" data-testid="card-weekday-analysis">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Gastos por Dia da Semana</CardTitle>
        {diaSemanaQueMaisGasta && (
          <p className="text-sm text-muted-foreground">
            Você gasta mais nas <span className="font-semibold text-chart-2">{diaSemanaQueMaisGasta.dia}s</span>
            {' '}({formatCurrency(diaSemanaQueMaisGasta.total)})
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-4">
        {hasData ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart 
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              barCategoryGap="20%"
            >
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={1} />
                  <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))"
                strokeOpacity={0.1}
                vertical={false}
              />
              <XAxis 
                dataKey="dia" 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))', strokeOpacity: 0.2 }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ fill: 'hsl(var(--accent) / 0.1)' }}
              />
              <Bar 
                dataKey="total" 
                fill="url(#barGradient)"
                radius={[8, 8, 0, 0]}
                animationDuration={300}
                animationEasing="ease-out"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={entry.total === maxValue ? "url(#barGradient)" : "hsl(var(--chart-2) / 0.7)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            Nenhum gasto registrado esta semana
          </div>
        )}
      </CardContent>
    </Card>
  );
}
