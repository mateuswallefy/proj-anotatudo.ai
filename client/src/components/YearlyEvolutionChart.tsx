import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface YearlyData {
  ano: number;
  mes: number;
  mesNome: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

export function YearlyEvolutionChart() {
  const { data, isLoading } = useQuery<YearlyData[]>({
    queryKey: ["/api/analytics/yearly-evolution"],
  });

  if (isLoading) {
    return <Skeleton className="h-[500px] w-full" />;
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        Nenhum dado disponível para o ano
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const receitas = payload[0].value;
    const despesas = payload[1].value;
    const saldo = receitas - despesas;

    return (
      <div className="bg-card/95 backdrop-blur-md border border-border rounded-lg p-4 shadow-lg">
        <p className="font-semibold mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-sm flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Receitas:</span>
            <span className="font-mono font-semibold">
              R$ {receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </p>
          <p className="text-sm flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-muted-foreground">Despesas:</span>
            <span className="font-mono font-semibold">
              R$ {despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </p>
          <div className="border-t border-border pt-1 mt-1">
            <p className="text-sm flex items-center gap-2">
              <span className="text-muted-foreground">Saldo:</span>
              <span className={`font-mono font-semibold ${
                saldo >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              }`}>
                R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Abreviar nomes dos meses para o eixo X
  const chartData = data.map(item => ({
    ...item,
    mesAbrev: item.mesNome.slice(0, 3),
  }));

  return (
    <Card className="p-6" data-testid="yearly-evolution-chart">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Evolução Anual</h3>
        <p className="text-sm text-muted-foreground">
          Receitas e despesas ao longo do ano de {data[0]?.ano}
        </p>
      </div>

      <ResponsiveContainer width="100%" height={450}>
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <defs>
            <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0F9D58" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#0F9D58" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F2994A" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#F2994A" stopOpacity={0} />
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
          
          <XAxis
            dataKey="mesAbrev"
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
          
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }} />
          
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          
          <Area
            type="monotone"
            dataKey="receitas"
            name="Receitas"
            fill="url(#colorReceitas)"
            stroke="#0F9D58"
            strokeWidth={3}
            animationDuration={800}
            animationEasing="ease-out"
          />
          
          <Area
            type="monotone"
            dataKey="despesas"
            name="Despesas"
            fill="url(#colorDespesas)"
            stroke="#F2994A"
            strokeWidth={3}
            animationDuration={800}
            animationEasing="ease-out"
          />
          
          <Line
            type="monotone"
            dataKey="saldo"
            name="Saldo"
            stroke="#0AA298"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#0AA298', r: 4 }}
            animationDuration={1000}
            animationEasing="ease-out"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
}
