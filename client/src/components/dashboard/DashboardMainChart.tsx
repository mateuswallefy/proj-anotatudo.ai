import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChartDataPoint } from "@/types/financial";

interface DashboardMainChartProps {
  chartData?: ChartDataPoint[];
  isLoading?: boolean;
}

export function DashboardMainChart({
  chartData,
  isLoading = false,
}: DashboardMainChartProps) {
  // Fallback para dados vazios se não houver dados
  const displayData = chartData || [];

  if (isLoading || displayData.length === 0) {
    return (
      <div className="bg-white/5 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-lg">
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--card)]/95 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl">
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">
            {payload[0].payload.date}
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#4ADE80]" />
              <span className="text-xs text-[var(--text-secondary)]">Entradas:</span>
              <span className="text-sm font-bold text-[#4ADE80]">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(payload[0].value)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FB7185]" />
              <span className="text-xs text-[var(--text-secondary)]">Despesas:</span>
              <span className="text-sm font-bold text-[#FB7185]">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(payload[1].value)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#A78BFA]" />
              <span className="text-xs text-[var(--text-secondary)]">Saldo:</span>
              <span className="text-sm font-bold text-[#A78BFA]">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(payload[2].value)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomDot = (props: any) => {
    const { cx, cy, fill } = props;
    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={4}
          fill={fill}
          className="drop-shadow-lg"
          style={{ filter: "drop-shadow(0 0 4px currentColor)" }}
        />
        <circle cx={cx} cy={cy} r={2} fill="white" />
      </g>
    );
  };

  return (
    <div className="relative bg-white/5 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-lg overflow-hidden">
      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
          Visão Geral do Período
        </h3>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4ADE80" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FB7185" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FB7185" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#A78BFA" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.3)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="rgba(255,255,255,0.3)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    notation: "compact",
                  }).format(value)
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="entradas"
                stroke="#4ADE80"
                strokeWidth={2}
                fill="url(#colorEntradas)"
                dot={<CustomDot />}
                activeDot={{ r: 6 }}
              />
              <Area
                type="monotone"
                dataKey="despesas"
                stroke="#FB7185"
                strokeWidth={2}
                fill="url(#colorDespesas)"
                dot={<CustomDot />}
                activeDot={{ r: 6 }}
              />
              <Area
                type="monotone"
                dataKey="saldo"
                stroke="#A78BFA"
                strokeWidth={3}
                fill="url(#colorSaldo)"
                dot={<CustomDot />}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#4ADE80]" />
            <span className="text-xs text-[var(--text-secondary)]">Entradas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FB7185]" />
            <span className="text-xs text-[var(--text-secondary)]">Despesas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#A78BFA]" />
            <span className="text-xs text-[var(--text-secondary)]">Saldo</span>
          </div>
        </div>
      </div>
    </div>
  );
}


