import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, TooltipProps, Cell } from "recharts";
import { TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

  const data = payload[0].payload;
  const percentual = data.percentual || 0;

  return (
    <div className="bg-card/95 backdrop-blur-md border border-border rounded-lg p-4 shadow-lg">
      <div className="space-y-2">
        <p className="text-sm font-semibold">{data.diaCompleto}</p>
        <div className="space-y-1">
          <p className="text-sm flex justify-between gap-4">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-mono font-semibold">
              {formatCurrency(payload[0].value as number)}
            </span>
          </p>
          <p className="text-sm flex justify-between gap-4">
            <span className="text-muted-foreground">% da semana:</span>
            <span className="font-semibold">{percentual.toFixed(1)}%</span>
          </p>
        </div>
      </div>
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

  const totalSemana = Object.values(gastosPorDiaSemana).reduce((sum, val) => sum + val, 0);

  const chartData = Object.entries(gastosPorDiaSemana).map(([dia, total]) => ({
    dia: dia.substring(0, 3),
    diaCompleto: dia,
    total,
    percentual: totalSemana > 0 ? (total / totalSemana) * 100 : 0,
  }));

  const maxValue = Math.max(...chartData.map(d => d.total));
  const hasData = chartData.some(d => d.total > 0);

  return (
    <Card className="h-full" data-testid="card-weekday-analysis">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg font-semibold">Gastos por Dia da Semana</CardTitle>
          {diaSemanaQueMaisGasta && (
            <Badge variant="secondary" className="gap-1" data-testid="badge-peak-day">
              <TrendingUp className="w-3 h-3" />
              {diaSemanaQueMaisGasta.dia}
            </Badge>
          )}
        </div>
        {diaSemanaQueMaisGasta && (
          <p className="text-sm text-muted-foreground">
            Pico nas <span className="font-semibold text-orange-600 dark:text-orange-400">{diaSemanaQueMaisGasta.dia}s</span>
            {' '}com {formatCurrency(diaSemanaQueMaisGasta.total)}
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
                <linearGradient id="normalBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0AA298" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#0AA298" stopOpacity={0.5} />
                </linearGradient>
                <linearGradient id="peakBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F2994A" stopOpacity={1} />
                  <stop offset="50%" stopColor="#F2994A" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#F2994A" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))"
                strokeOpacity={0.3}
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
                tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ fill: 'hsl(var(--accent) / 0.1)' }}
              />
              <Bar 
                dataKey="total" 
                radius={[8, 8, 0, 0]}
                animationDuration={400}
                animationEasing="ease-out"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={entry.total === maxValue && maxValue > 0 ? "url(#peakBar)" : "url(#normalBar)"}
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
