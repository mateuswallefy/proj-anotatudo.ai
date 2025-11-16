import { useQuery } from "@tanstack/react-query";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePeriod } from "@/contexts/PeriodContext";

interface CategoryData {
  categoria: string;
  total: number;
  percentual: number;
  transacoes: number;
  cor: string;
}

export function ExpensesByCategoryChart() {
  const { period } = usePeriod();
  const { data, isLoading } = useQuery<CategoryData[]>({
    queryKey: ["/api/analytics/expenses-by-category", { period }],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/expenses-by-category?period=${period}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch expenses by category');
      return response.json();
    }
  });

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground" data-testid="expenses-by-category-chart">
        Nenhuma despesa registrada no período
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    
    return (
      <div className="bg-card/95 backdrop-blur-md border border-border rounded-lg p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.cor }} />
          <p className="font-semibold">{data.categoria}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm flex justify-between gap-4">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-mono font-semibold">
              R$ {data.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </p>
          <p className="text-sm flex justify-between gap-4">
            <span className="text-muted-foreground">Percentual:</span>
            <span className="font-semibold">{data.percentual.toFixed(1)}%</span>
          </p>
          <p className="text-sm flex justify-between gap-4">
            <span className="text-muted-foreground">Transações:</span>
            <span className="font-semibold">{data.transacoes}</span>
          </p>
        </div>
      </div>
    );
  };

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return percent > 0.05 ? (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-semibold drop-shadow-md"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  return (
    <Card className="p-6" data-testid="expenses-by-category-chart">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Despesas por Categoria</h3>
        <p className="text-sm text-muted-foreground">Distribuição percentual</p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={140}
            fill="#8884d8"
            dataKey="total"
            animationDuration={800}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.cor} />
            ))}
          </Pie>
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry: any) => {
              const item = data.find(d => d.categoria === value);
              return (
                <span className="text-sm">
                  {value} <span className="text-muted-foreground">({item?.percentual.toFixed(1)}%)</span>
                </span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-6 grid grid-cols-2 gap-4">
        {data.slice(0, 4).map((category, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.cor }} />
              <span className="text-sm font-medium truncate">{category.categoria}</span>
            </div>
            <span className="text-sm font-mono font-semibold">
              R$ {category.total.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
