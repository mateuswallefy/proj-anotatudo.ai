import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: number | undefined;
  variation?: number;
  icon: ReactNode;
  type?: "income" | "expense" | "savings" | "balance";
  isLoading?: boolean;
}

export function KpiCard({
  title,
  value,
  variation = 0,
  icon,
  type = "balance",
  isLoading = false,
}: KpiCardProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  const getIconColor = () => {
    switch (type) {
      case "income":
        return "text-[#4ADE80]";
      case "expense":
        return "text-[#FB7185]";
      case "savings":
        return "text-[#60A5FA]";
      case "balance":
        return "text-[#A78BFA]";
      default:
        return "text-[#A78BFA]";
    }
  };

  const getVariationColor = () => {
    if (variation > 0) return "text-[#4ADE80]";
    if (variation < 0) return "text-[#FB7185]";
    return "text-[var(--text-secondary)]";
  };

  if (isLoading) {
    return (
      <div className="relative bg-white/5 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-lg animate-pulse">
        <div className="h-4 w-24 bg-white/10 rounded mb-4" />
        <div className="h-8 w-32 bg-white/10 rounded mb-2" />
        <div className="h-4 w-20 bg-white/10 rounded" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative bg-white/5 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-lg",
        "hover:bg-white/10 transition-all duration-300 group",
        "overflow-hidden"
      )}
    >
      {/* Floating icon with animation */}
      <div
        className={cn(
          "absolute top-4 right-4 w-12 h-12 opacity-20 group-hover:opacity-30 transition-opacity",
          getIconColor()
        )}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="relative z-10">
        <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">
          {title}
        </p>

        <p
          className="text-3xl font-bold mb-2 font-sora"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          {formatCurrency(value || 0)}
        </p>

        {variation !== undefined && variation !== 0 && (
          <div className={cn("flex items-center gap-1 text-sm font-medium", getVariationColor())}>
            {variation > 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{Math.abs(variation).toFixed(1)}%</span>
            <span className="text-[var(--text-secondary)] text-xs ml-1">vs mês anterior</span>
          </div>
        )}
      </div>

      {/* Decorative gradient overlay */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none",
          type === "income" && "bg-gradient-to-br from-[#4ADE80] to-transparent",
          type === "expense" && "bg-gradient-to-br from-[#FB7185] to-transparent",
          type === "savings" && "bg-gradient-to-br from-[#60A5FA] to-transparent",
          type === "balance" && "bg-gradient-to-br from-[#A78BFA] to-transparent"
        )}
      />
    </div>
  );
}




