import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface WeekdayAnalysisProps {
  gastosPorDiaSemana: Record<string, number>;
  diaSemanaQueMaisGasta: {
    dia: string;
    total: number;
  } | null;
}

export function WeekdayAnalysis({ gastosPorDiaSemana, diaSemanaQueMaisGasta }: WeekdayAnalysisProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const chartData = Object.entries(gastosPorDiaSemana).map(([dia, total]) => ({
    dia: dia.substring(0, 3),
    total,
  }));

  const hasData = chartData.some(d => d.total > 0);

  return (
    <Card className="h-full" data-testid="card-weekday-analysis">
      <CardHeader>
        <CardTitle>Gastos por Dia da Semana</CardTitle>
        {diaSemanaQueMaisGasta && (
          <p className="text-sm text-muted-foreground">
            Você gasta mais nas <span className="font-semibold text-foreground">{diaSemanaQueMaisGasta.dia}s</span>
            {' '}({formatCurrency(diaSemanaQueMaisGasta.total)})
          </p>
        )}
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => `${label}`}
              />
              <Bar 
                dataKey="total" 
                fill="hsl(var(--destructive))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            Nenhum gasto registrado esta semana
          </div>
        )}
      </CardContent>
    </Card>
  );
}
