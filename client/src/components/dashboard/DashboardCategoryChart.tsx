import { useState, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Sector,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { useCategorySpending } from "@/hooks/useCategorySpending";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart as PieChartIcon, TrendingDown, Wallet } from "lucide-react";

// Cores vibrantes e modernas com gradientes
const COLORS = [
  { main: "#8b5cf6", light: "#a78bfa" }, // violet
  { main: "#06b6d4", light: "#22d3ee" }, // cyan
  { main: "#f43f5e", light: "#fb7185" }, // rose
  { main: "#f59e0b", light: "#fbbf24" }, // amber
  { main: "#10b981", light: "#34d399" }, // emerald
  { main: "#ec4899", light: "#f472b6" }, // pink
  { main: "#3b82f6", light: "#60a5fa" }, // blue
  { main: "#ef4444", light: "#f87171" }, // red
];

// Componente de setor ativo com efeito de destaque
const renderActiveShape = (props: any) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    value,
    percentual,
  } = props;

  return (
    <g>
      {/* Sombra/glow */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.3}
        style={{ filter: "blur(8px)" }}
      />
      {/* Setor principal expandido */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="#fff"
        strokeWidth={2}
      />
      {/* Setor interno */}
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={innerRadius - 4}
        outerRadius={innerRadius}
        fill={fill}
        opacity={0.5}
      />
    </g>
  );
};

export function DashboardCategoryChart() {
  const { data, isLoading } = useCategorySpending();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);

  const onPieLeave = useCallback(() => {
    setActiveIndex(null);
  }, []);

  // Calcula o total
  const total = data?.reduce((sum, item) => sum + (item.valor || 0), 0) || 0;

  // Categoria ativa
  const activeData = activeIndex !== null ? data?.[activeIndex] : null;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const colorIndex = data?.findIndex((d) => d.categoria === item.name) || 0;
      const color = COLORS[colorIndex % COLORS.length];

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="backdrop-blur-xl bg-background/90 border border-border/50 rounded-2xl p-4 shadow-2xl min-w-[180px]"
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${color.main}, ${color.light})`,
                boxShadow: `0 2px 8px ${color.main}50`,
              }}
            />
            <p className="text-sm font-bold text-foreground">{item.name}</p>
          </div>
          <p className="text-xl font-bold" style={{ color: color.main }}>
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(item.value)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {item.payload.percentual?.toFixed(1)}% do total de gastos
          </p>
        </motion.div>
      );
    }
    return null;
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

  if (!data || data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="rounded-[24px] border-0 shadow-xl bg-gradient-to-br from-card via-card to-card/90 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-rose-500/5 to-transparent rounded-full blur-3xl" />

          <CardHeader className="p-5 sm:p-6 relative">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-600/10 backdrop-blur-sm">
                <PieChartIcon className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Gastos por Categoria</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Distribuição das despesas</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 pt-0 relative">
            <div className="flex flex-col items-center justify-center h-[280px] text-center">
              <div className="p-4 rounded-full bg-muted/50 mb-4">
                <Wallet className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Nenhum gasto registrado
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Seus gastos aparecerão aqui
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="rounded-[24px] border-0 shadow-xl bg-gradient-to-br from-card via-card to-card/90 overflow-hidden relative">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-rose-500/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-amber-500/5 to-transparent rounded-full blur-3xl" />

        <CardHeader className="p-5 sm:p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-600/10 backdrop-blur-sm">
                <PieChartIcon className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Gastos por Categoria</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Distribuição das despesas</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500">
              <TrendingDown className="h-3.5 w-3.5" />
              <span>{data.length} categorias</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 pt-0 relative">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            {/* Donut Chart */}
            <div className="relative w-full lg:w-1/2 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {COLORS.map((color, index) => (
                      <linearGradient
                        key={`gradient-${index}`}
                        id={`colorGradient-${index}`}
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="1"
                      >
                        <stop offset="0%" stopColor={color.main} />
                        <stop offset="100%" stopColor={color.light} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    activeIndex={activeIndex !== null ? activeIndex : undefined}
                    activeShape={renderActiveShape}
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="valor"
                    nameKey="categoria"
                    onMouseEnter={onPieEnter}
                    onMouseLeave={onPieLeave}
                    animationBegin={0}
                    animationDuration={1200}
                    animationEasing="ease-out"
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`url(#colorGradient-${index % COLORS.length})`}
                        stroke="transparent"
                        style={{
                          filter: activeIndex === index ? `drop-shadow(0 0 8px ${COLORS[index % COLORS.length].main}80)` : 'none',
                          transition: 'filter 0.3s ease',
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Centro do Donut - Mostra total ou categoria ativa */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeIndex ?? 'total'}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="text-center"
                  >
                    {activeData ? (
                      <>
                        <p className="text-xs text-muted-foreground mb-1 truncate max-w-[100px]">
                          {activeData.categoria}
                        </p>
                        <p
                          className="text-lg font-bold"
                          style={{ color: COLORS[activeIndex! % COLORS.length].main }}
                        >
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                            notation: "compact",
                          }).format(activeData.valor)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activeData.percentual?.toFixed(1)}%
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground mb-1">Total</p>
                        <p className="text-xl font-bold text-foreground">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                            notation: "compact",
                          }).format(total)}
                        </p>
                        <p className="text-xs text-muted-foreground">em gastos</p>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Legend */}
            <div className="w-full lg:w-1/2 space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar pr-2">
              {data.map((entry, index) => {
                const color = COLORS[index % COLORS.length];
                const isActive = activeIndex === index;

                return (
                  <motion.div
                    key={`legend-${index}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                      isActive
                        ? 'bg-muted/80 scale-[1.02] shadow-lg'
                        : 'bg-muted/30 hover:bg-muted/50'
                    }`}
                    style={{
                      borderLeft: `4px solid ${color.main}`,
                      boxShadow: isActive ? `0 4px 20px ${color.main}20` : 'none',
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${color.main}20, ${color.light}10)`,
                        }}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            background: `linear-gradient(135deg, ${color.main}, ${color.light})`,
                            boxShadow: `0 2px 6px ${color.main}40`,
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{entry.categoria}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.percentual?.toFixed(1)}% do total
                        </p>
                      </div>
                    </div>
                    <p
                      className="text-sm font-bold flex-shrink-0 ml-2"
                      style={{ color: color.main }}
                    >
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                        notation: "compact",
                      }).format(entry.valor)}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
