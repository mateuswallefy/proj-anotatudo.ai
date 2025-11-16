import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface MonthlyData {
  mes: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

export function MonthlyComparisonChart() {
  const { data, isLoading } = useQuery<MonthlyData[]>({
    queryKey: ["/api/analytics/monthly-comparison"],
  });

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        Nenhum dado disponível para o período
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-card/95 backdrop-blur-md border border-border rounded-lg p-4 shadow-lg">
        <p className="font-semibold mb-2">{payload[0].payload.mes}</p>
        <div className="space-y-1">
          <p className="text-sm flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Receitas:</span>
            <span className="font-mono font-semibold">
              R$ {payload[0].value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </p>
          <p className="text-sm flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-muted-foreground">Despesas:</span>
            <span className="font-mono font-semibold">
              R$ {payload[1].value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </p>
          <div className="border-t border-border pt-1 mt-1">
            <p className="text-sm flex items-center gap-2">
              <span className="text-muted-foreground">Saldo:</span>
              <span className={`font-mono font-semibold ${
                payload[0].payload.saldo >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              }`}>
                R$ {payload[0].payload.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6" data-testid="monthly-comparison-chart">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Receitas x Despesas Mensais</h3>
        <p className="text-sm text-muted-foreground">Últimos 12 meses</p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <defs>
            <linearGradient id="receitasGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0F9D58" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#0F9D58" stopOpacity={0.3} />
            </linearGradient>
            <linearGradient id="despesasGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F2994A" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#F2994A" stopOpacity={0.3} />
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
          
          <XAxis
            dataKey="mes"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
          />
          
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
          />
          
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent) / 0.1)' }} />
          
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          
          <Bar
            dataKey="receitas"
            name="Receitas"
            fill="url(#receitasGradient)"
            radius={[8, 8, 0, 0]}
            animationDuration={600}
            animationEasing="ease-out"
          />
          
          <Bar
            dataKey="despesas"
            name="Despesas"
            fill="url(#despesasGradient)"
            radius={[8, 8, 0, 0]}
            animationDuration={600}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
