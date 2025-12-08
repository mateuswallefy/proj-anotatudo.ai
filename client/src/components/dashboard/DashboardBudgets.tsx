import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import type { Budget } from "@/types/financial";

interface DashboardBudgetsProps {
  budgets?: Budget[];
  isLoading?: boolean;
  onConfigure?: () => void;
}

const COLORS = ["#4ADE80", "#60A5FA", "#A78BFA", "#FB7185", "#FBBF24", "#34D399"];

export function DashboardBudgets({
  budgets,
  isLoading = false,
  onConfigure,
}: DashboardBudgetsProps) {
  const [, setLocation] = useLocation();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="bg-white/5 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-lg">
        <Skeleton className="h-6 w-48 mb-6" />
        <Skeleton className="h-[300px] w-full rounded-xl" />
      </div>
    );
  }

  const displayBudgets = budgets || [];

  // Prepare data for donut chart
  const chartData = displayBudgets.map((budget, index) => ({
    name: budget.category || "Sem categoria",
    value: budget.spent,
    limit: budget.limit,
    percent: budget.percent,
    color: COLORS[index % COLORS.length],
  }));

  // Find the largest category
  const largestCategory = chartData.reduce(
    (max, item) => (item.value > max.value ? item : max),
    chartData[0] || { name: "", value: 0 }
  );

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[var(--card)]/95 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl">
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">
            {data.name}
          </p>
          <div className="space-y-1">
            <p className="text-xs text-[var(--text-secondary)]">
              Gasto: <span className="font-semibold text-[var(--text-primary)]">{formatCurrency(data.value)}</span>
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              Limite: <span className="font-semibold text-[var(--text-primary)]">{formatCurrency(data.limit)}</span>
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              Uso: <span className="font-semibold text-[var(--text-primary)]">{data.percent.toFixed(1)}%</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white/5 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#60A5FA]" />
          Orçamentos por Categoria
        </h3>
        {displayBudgets.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/orcamento")}
            className="text-xs"
          >
            Ver todos
          </Button>
        )}
      </div>

      {displayBudgets.length === 0 ? (
        <div className="text-center py-8">
          <Settings className="h-12 w-12 mx-auto mb-3 text-[var(--text-secondary)] opacity-50" />
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Nenhum orçamento configurado
          </p>
          <Button
            onClick={onConfigure || (() => setLocation("/orcamento"))}
            variant="outline"
            size="sm"
            className="border-[#60A5FA] text-[#60A5FA] hover:bg-[#60A5FA] hover:text-white"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurar orçamentos
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Donut Chart with 3D effect */}
          <div className="relative">
            <div
              className="relative"
              style={{
                transform: "perspective(1000px) rotateX(12deg)",
                transformStyle: "preserve-3d",
              }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <defs>
                    {chartData.map((entry, index) => (
                      <filter key={index} id={`shadow-${index}`}>
                        <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.3" />
                      </filter>
                    ))}
                  </defs>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={CustomLabel}
                    outerRadius={100}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        style={{
                          filter: entry.name === largestCategory.name ? `url(#shadow-${index})` : undefined,
                          opacity: entry.name === largestCategory.name ? 1 : 0.8,
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend - Premium style like Linear */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {chartData.map((item, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                  item.name === largestCategory.name
                    ? "bg-white/10 border border-white/20"
                    : "bg-white/5"
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                    {item.name || "Sem categoria"}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {item.percent.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


