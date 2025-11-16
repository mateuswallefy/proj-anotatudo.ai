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

export function IncomeByCategoryChart() {
  const { period } = usePeriod();
  const { data, isLoading } = useQuery<CategoryData[]>({
    queryKey: ["/api/analytics/income-by-category", { period }],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/income-by-category?period=${period}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch income by category');
      return response.json();
    }
  });

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground" data-testid="income-by-category-chart">
        Nenhuma receita registrada no período
      </Card>
    );
  }

  const total = data.reduce((sum, item) => sum + item.total, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const item = payload[0].payload;
    
    return (
      <div className="bg-card/95 backdrop-blur-md border border-border rounded-lg p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.cor }} />
          <p className="font-semibold">{item.categoria}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm flex justify-between gap-4">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-mono font-semibold">
              R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </p>
          <p className="text-sm flex justify-between gap-4">
            <span className="text-muted-foreground">Percentual:</span>
            <span className="font-semibold">{item.percentual.toFixed(1)}%</span>
          </p>
          <p className="text-sm flex justify-between gap-4">
            <span className="text-muted-foreground">Transações:</span>
            <span className="font-semibold">{item.transacoes}</span>
          </p>
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6" data-testid="income-by-category-chart">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Receitas por Categoria</h3>
        <p className="text-sm text-muted-foreground">Distribuição percentual</p>
      </div>

      <div className="relative">
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={90}
              outerRadius={140}
              fill="#8884d8"
              paddingAngle={2}
              dataKey="total"
              animationDuration={800}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.cor} />
              ))}
            </Pie>
            
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
              Total
            </p>
            <p className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        {data.map((category, index) => (
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
