import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import { useMonthlyBalance } from "@/hooks/useMonthlyBalance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";

export function DashboardMonthlyBalance() {
  const { data, isLoading } = useMonthlyBalance();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Calcula tendência geral
  const getTrend = () => {
    if (!data || data.length < 2) return "neutral";
    const firstSaldo = data[0]?.saldo || 0;
    const lastSaldo = data[data.length - 1]?.saldo || 0;
    if (lastSaldo > firstSaldo) return "up";
    if (lastSaldo < firstSaldo) return "down";
    return "neutral";
  };

  const trend = getTrend();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const receitas = payload.find((p: any) => p.dataKey === "receitas")?.value || 0;
      const despesas = payload.find((p: any) => p.dataKey === "despesas")?.value || 0;
      const saldo = payload.find((p: any) => p.dataKey === "saldo")?.value || 0;

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="backdrop-blur-xl bg-background/80 border border-border/50 rounded-2xl p-4 shadow-2xl min-w-[200px]"
        >
          <p className="text-sm font-bold text-foreground mb-3 pb-2 border-b border-border/50">
            {label}
          </p>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30" />
                <span className="text-xs text-muted-foreground">Receitas</span>
              </div>
              <span className="text-sm font-bold text-emerald-500">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(receitas)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-rose-400 to-rose-600 shadow-lg shadow-rose-500/30" />
                <span className="text-xs text-muted-foreground">Despesas</span>
              </div>
              <span className="text-sm font-bold text-rose-500">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(despesas)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-violet-400 to-violet-600 shadow-lg shadow-violet-500/30" />
                <span className="text-xs text-muted-foreground">Saldo</span>
              </div>
              <span className={`text-sm font-bold ${saldo >= 0 ? 'text-violet-500' : 'text-rose-500'}`}>
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(saldo)}
              </span>
            </div>
          </div>
        </motion.div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-4 pt-4 border-t border-border/30">
        {payload?.map((entry: any, index: number) => (
          <motion.div
            key={`legend-${index}`}
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div
              className="w-3 h-3 rounded-full shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${entry.color}, ${entry.color}dd)`,
                boxShadow: `0 2px 8px ${entry.color}40`,
              }}
            />
            <span className="text-xs font-medium text-muted-foreground">
              {entry.value === "receitas" ? "Receitas" : entry.value === "despesas" ? "Despesas" : "Saldo"}
            </span>
          </motion.div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="rounded-[24px] border-0 shadow-xl bg-gradient-to-br from-card to-card/80">
        <CardHeader className="p-5 sm:p-6">
          <Skeleton className="h-7 w-48" />
        </CardHeader>
        <CardContent className="p-5 sm:p-6 pt-0">
          <Skeleton className="h-[320px] w-full rounded-2xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="rounded-[24px] border-0 shadow-xl bg-gradient-to-br from-card via-card to-card/90 overflow-hidden relative">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-violet-500/5 to-transparent rounded-full blur-3xl" />

        <CardHeader className="p-5 sm:p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 backdrop-blur-sm">
                <BarChart3 className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Balanço Mensal</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Evolução financeira do período</p>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
              trend === "up"
                ? "bg-emerald-500/10 text-emerald-500"
                : trend === "down"
                  ? "bg-rose-500/10 text-rose-500"
                  : "bg-muted text-muted-foreground"
            }`}>
              {trend === "up" ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : trend === "down" ? (
                <TrendingDown className="h-3.5 w-3.5" />
              ) : (
                <Minus className="h-3.5 w-3.5" />
              )}
              <span>{trend === "up" ? "Subindo" : trend === "down" ? "Caindo" : "Estável"}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 pt-0 relative">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 20, right: 10, left: -10, bottom: 0 }}
                onMouseMove={(e: any) => {
                  if (e?.activeTooltipIndex !== undefined) {
                    setActiveIndex(e.activeTooltipIndex);
                  }
                }}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <defs>
                  {/* Receitas Gradient */}
                  <linearGradient id="gradientReceitas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="50%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  {/* Despesas Gradient */}
                  <linearGradient id="gradientDespesas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="50%" stopColor="#f43f5e" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                  {/* Saldo Gradient */}
                  <linearGradient id="gradientSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
                    <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  {/* Glow effects */}
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-border/30"
                  vertical={false}
                />

                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  className="text-muted-foreground"
                  dy={10}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  className="text-muted-foreground"
                  tickFormatter={(value) =>
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      notation: "compact",
                      maximumFractionDigits: 0,
                    }).format(value)
                  }
                  dx={-5}
                />

                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{
                    stroke: 'currentColor',
                    strokeWidth: 1,
                    strokeDasharray: '4 4',
                    className: 'text-border/50'
                  }}
                />

                <Legend content={<CustomLegend />} />

                <Area
                  type="monotone"
                  dataKey="receitas"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#gradientReceitas)"
                  dot={false}
                  activeDot={{
                    r: 6,
                    stroke: "#10b981",
                    strokeWidth: 2,
                    fill: "#fff",
                    filter: "url(#glow)",
                  }}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />

                <Area
                  type="monotone"
                  dataKey="despesas"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  fill="url(#gradientDespesas)"
                  dot={false}
                  activeDot={{
                    r: 6,
                    stroke: "#f43f5e",
                    strokeWidth: 2,
                    fill: "#fff",
                    filter: "url(#glow)",
                  }}
                  animationDuration={1500}
                  animationEasing="ease-out"
                  animationBegin={300}
                />

                <Area
                  type="monotone"
                  dataKey="saldo"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  fill="url(#gradientSaldo)"
                  dot={false}
                  activeDot={{
                    r: 7,
                    stroke: "#8b5cf6",
                    strokeWidth: 3,
                    fill: "#fff",
                    filter: "url(#glow)",
                  }}
                  animationDuration={1500}
                  animationEasing="ease-out"
                  animationBegin={600}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
