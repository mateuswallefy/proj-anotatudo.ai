import { ReactNode } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStatCardProps {
  title: string;
  value: number;
  variation: number;
  icon: ReactNode;
  color: "green" | "red" | "blue" | "orange";
  isLoading?: boolean;
  index?: number;
}

const colorConfig = {
  green: {
    gradient: "from-emerald-500 to-emerald-600",
    bg: "bg-emerald-500/10",
    glow: "shadow-emerald-500/20",
    text: "text-emerald-500",
    iconBg: "from-emerald-500/20 to-emerald-600/10",
  },
  red: {
    gradient: "from-rose-500 to-rose-600",
    bg: "bg-rose-500/10",
    glow: "shadow-rose-500/20",
    text: "text-rose-500",
    iconBg: "from-rose-500/20 to-rose-600/10",
  },
  blue: {
    gradient: "from-blue-500 to-blue-600",
    bg: "bg-blue-500/10",
    glow: "shadow-blue-500/20",
    text: "text-blue-500",
    iconBg: "from-blue-500/20 to-blue-600/10",
  },
  orange: {
    gradient: "from-amber-500 to-orange-600",
    bg: "bg-amber-500/10",
    glow: "shadow-amber-500/20",
    text: "text-amber-500",
    iconBg: "from-amber-500/20 to-orange-600/10",
  },
};

export function DashboardStatCard({
  title,
  value,
  variation,
  icon,
  color,
  isLoading = false,
  index = 0,
}: DashboardStatCardProps) {
  const config = colorConfig[color];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const formatVariation = (val: number) => {
    const sign = val > 0 ? "+" : "";
    return `${sign}${val.toFixed(1)}%`;
  };

  const getTrendIcon = () => {
    if (variation > 0) return <TrendingUp className="h-3.5 w-3.5" />;
    if (variation < 0) return <TrendingDown className="h-3.5 w-3.5" />;
    return <Minus className="h-3.5 w-3.5" />;
  };

  const getVariationColor = () => {
    // Para despesas, inversão da lógica (menos é melhor)
    if (color === "red" || color === "orange") {
      if (variation < 0) return "text-emerald-500 bg-emerald-500/10";
      if (variation > 0) return "text-rose-500 bg-rose-500/10";
    } else {
      if (variation > 0) return "text-emerald-500 bg-emerald-500/10";
      if (variation < 0) return "text-rose-500 bg-rose-500/10";
    }
    return "text-muted-foreground bg-muted/50";
  };

  if (isLoading) {
    return (
      <div className="relative rounded-[20px] border-0 bg-card p-4 shadow-lg overflow-hidden">
        <div className="flex items-start justify-between mb-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-8 w-28" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        "relative rounded-[20px] border-0 bg-card p-4 overflow-hidden",
        "shadow-lg hover:shadow-xl transition-shadow duration-300",
        config.glow
      )}
    >
      {/* Background decoration */}
      <div
        className={cn(
          "absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-30",
          config.bg
        )}
      />

      {/* Header */}
      <div className="relative flex items-start justify-between mb-3">
        <div
          className={cn(
            "p-3 rounded-xl bg-gradient-to-br backdrop-blur-sm",
            config.iconBg
          )}
        >
          <div className={config.text}>
            {icon}
          </div>
        </div>

        {/* Variation badge */}
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold",
            getVariationColor()
          )}
        >
          {getTrendIcon()}
          <span>{formatVariation(variation)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="relative">
        <p className="text-xs font-medium text-muted-foreground mb-1">
          {title}
        </p>
        <p className="text-2xl sm:text-[1.75rem] font-bold tracking-tight text-foreground tabular-nums">
          {formatCurrency(value)}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
          vs período anterior
        </p>
      </div>
    </motion.div>
  );
}
