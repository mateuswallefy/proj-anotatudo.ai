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
import { PieChart as PieChartIcon, Wallet } from "lucide-react";
import { getCategoryColor, getCategoryIcon } from "@/lib/categoryColors";

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
  } = props;

  return (
    <g>
      {/* Sombra/glow */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 10}
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
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="#fff"
        strokeWidth={3}
      />
      {/* Setor interno */}
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={innerRadius - 6}
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
  const activeColor = activeData ? getCategoryColor(activeData.categoria, activeIndex) : null;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const colorIndex = data?.findIndex((d) => d.categoria === item.name) || 0;
      const color = getCategoryColor(item.name, colorIndex);
      const Icon = getCategoryIcon(item.name);

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="backdrop-blur-xl bg-background/90 border border-border/50 rounded-2xl p-4 shadow-2xl min-w-[180px]"
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: color.bg }}
            >
              <Icon className="h-4 w-4" style={{ color: color.main }} />
            </div>
            <p className="text-sm font-bold text-foreground">{item.name}</p>
          </div>
          <p className="text-2xl font-bold" style={{ color: color.main }}>
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(item.value)}
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">
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
            <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-muted/50 text-muted-foreground">
              {data.length} {data.length === 1 ? 'categoria' : 'categorias'}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 pt-0 relative">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            {/* Donut Chart */}
            <div className="relative w-full lg:w-1/2 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {data.map((entry, index) => {
                      const color = getCategoryColor(entry.categoria, index);
                      return (
                        <linearGradient
                          key={`gradient-${index}`}
                          id={`categoryGradient-${index}`}
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="1"
                        >
                          <stop offset="0%" stopColor={color.main} />
                          <stop offset="100%" stopColor={color.light} />
                        </linearGradient>
                      );
                    })}
                  </defs>
                  <Pie
                    activeIndex={activeIndex !== null ? activeIndex : undefined}
                    activeShape={renderActiveShape}
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="valor"
                    nameKey="categoria"
                    onMouseEnter={onPieEnter}
                    onMouseLeave={onPieLeave}
                    animationBegin={0}
                    animationDuration={1200}
                    animationEasing="ease-out"
                  >
                    {data.map((entry, index) => {
                      const color = getCategoryColor(entry.categoria, index);
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={`url(#categoryGradient-${index})`}
                          stroke="transparent"
                          style={{
                            filter: activeIndex === index ? `drop-shadow(0 0 12px ${color.main}80)` : 'none',
                            transition: 'filter 0.3s ease',
                          }}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Centro do Donut */}
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
                    {activeData && activeColor ? (
                      <>
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
                          style={{ backgroundColor: activeColor.bg }}
                        >
                          {(() => {
                            const Icon = getCategoryIcon(activeData.categoria);
                            return <Icon className="h-5 w-5" style={{ color: activeColor.main }} />;
                          })()}
                        </div>
                        <p className="text-xs text-muted-foreground mb-0.5 truncate max-w-[90px]">
                          {activeData.categoria}
                        </p>
                        <p
                          className="text-lg font-bold"
                          style={{ color: activeColor.main }}
                        >
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                            notation: "compact",
                          }).format(activeData.valor)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Total</p>
                        <p className="text-xl font-bold text-foreground">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                            notation: "compact",
                          }).format(total)}
                        </p>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Legend */}
            <div className="w-full lg:w-1/2 space-y-2 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
              {data.map((entry, index) => {
                const color = getCategoryColor(entry.categoria, index);
                const Icon = getCategoryIcon(entry.categoria);
                const isActive = activeIndex === index;

                return (
                  <motion.div
                    key={`legend-${index}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-300 ${
                      isActive
                        ? 'scale-[1.02]'
                        : 'hover:bg-muted/30'
                    }`}
                    style={{
                      backgroundColor: isActive ? color.bg : 'transparent',
                      boxShadow: isActive ? `0 4px 20px ${color.main}15` : 'none',
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-300"
                        style={{
                          background: `linear-gradient(135deg, ${color.main}20, ${color.light}10)`,
                          transform: isActive ? 'scale(1.1)' : 'scale(1)',
                        }}
                      >
                        <Icon
                          className="h-4 w-4 transition-colors"
                          style={{ color: color.main }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{entry.categoria}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {entry.percentual?.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <p
                      className="text-sm font-bold flex-shrink-0 ml-2 tabular-nums"
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
