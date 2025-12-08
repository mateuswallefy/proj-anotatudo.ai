import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStatCardProps {
  title: string;
  value: number;
  variation: number;
  icon: ReactNode;
  color: "green" | "pink" | "blue" | "orange";
  isLoading?: boolean;
}

const colorClasses = {
  green: {
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    icon: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  pink: {
    bg: "bg-pink-50 dark:bg-pink-950/20",
    icon: "bg-pink-500",
    text: "text-pink-600 dark:text-pink-400",
    border: "border-pink-200 dark:border-pink-800",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/20",
    icon: "bg-blue-500",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
  },
  orange: {
    bg: "bg-orange-50 dark:bg-orange-950/20",
    icon: "bg-orange-500",
    text: "text-orange-600 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800",
  },
};

export function DashboardStatCard({
  title,
  value,
  variation,
  icon,
  color,
  isLoading = false,
}: DashboardStatCardProps) {
  const colors = colorClasses[color];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const formatVariation = (val: number) => {
    const sign = val >= 0 ? "+" : "";
    return `${sign}${val.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border p-6">
        <Skeleton className="h-12 w-12 rounded-xl mb-4" />
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-20" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border p-6 transition-all hover:shadow-lg",
        colors.bg,
        colors.border
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center text-white",
            colors.icon
          )}
        >
          {icon}
        </div>
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            variation >= 0 ? "text-emerald-600" : "text-red-600"
          )}
        >
          {variation >= 0 ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          <span>{formatVariation(variation)}</span>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">
          {title}
        </p>
        <p className="text-2xl md:text-3xl font-bold text-foreground mb-1">
          {formatCurrency(value)}
        </p>
        <p className="text-xs text-muted-foreground">
          vs período anterior
        </p>
      </div>
    </div>
  );
}

