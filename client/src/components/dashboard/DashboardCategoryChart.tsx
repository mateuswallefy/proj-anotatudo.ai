import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useCategorySpending } from "@/hooks/useCategorySpending";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#ec4899", // pink
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ef4444", // red
  "#06b6d4", // cyan
  "#f97316", // orange
];

export function DashboardCategoryChart() {
  const { data, isLoading } = useCategorySpending();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold mb-1">{data.name}</p>
          <p className="text-lg font-bold text-primary">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(data.value)}
          </p>
          <p className="text-xs text-muted-foreground">
            {data.payload.percentual.toFixed(1)}% do total
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="rounded-[20px]">
        <CardHeader className="p-4 sm:p-6">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="rounded-[20px]">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle>Gastos por Categoria</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              Nenhum gasto registrado ainda
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[20px]">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle>Gastos por Categoria</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ percentual }) => `${percentual.toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="valor"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value, entry: any) => (
                <span className="text-sm">
                  {value} -{" "}
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(entry.payload.valor)}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

