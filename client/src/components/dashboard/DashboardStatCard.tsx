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
      <div className="bg-card rounded-[20px] border p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <Skeleton className="h-12 w-12 rounded-full mb-3" />
        <Skeleton className="h-3 w-20 mb-1.5" />
        <Skeleton className="h-6 w-24 mb-1" />
        <Skeleton className="h-2 w-16" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[20px] border bg-card p-4 transition-all hover:shadow-md",
        "shadow-[0_2px_8px_rgba(0,0,0,0.05)]",
        colors.border,
        "flex flex-col h-full"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center text-white shadow-sm",
            colors.icon
          )}
        >
          {icon}
        </div>
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-semibold",
            variation >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
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

      <div className="flex-1 flex flex-col justify-end">
        <p className="text-xs font-medium text-muted-foreground mb-1.5">
          {title}
        </p>
        <p className="text-2xl sm:text-3xl font-bold text-foreground mb-1 leading-tight">
          {formatCurrency(value)}
        </p>
        <p className="text-[10px] text-muted-foreground">
          vs período anterior
        </p>
      </div>
    </div>
  );
}

