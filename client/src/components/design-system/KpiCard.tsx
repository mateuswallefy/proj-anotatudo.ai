import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { CardContainer } from "./CardContainer";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  variation?: number;
  icon?: ReactNode;
  type?: "entrada" | "despesa" | "economia" | "saldo";
  className?: string;
}

export function KpiCard({
  title,
  value,
  variation,
  icon,
  type = "entrada",
  className,
}: KpiCardProps) {
  const formatCurrency = (val: string | number) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num || 0);
  };

  const isPositive = (variation ?? 0) >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  const typeColors = {
    entrada: {
      icon: "text-[var(--accent-green)]",
      variation: "text-[var(--accent-green)]",
      bg: "bg-[var(--accent-green)]/10",
    },
    despesa: {
      icon: "text-[var(--accent-orange)]",
      variation: "text-[var(--accent-orange)]",
      bg: "bg-[var(--accent-orange)]/10",
    },
    economia: {
      icon: "text-[var(--accent-blue)]",
      variation: "text-[var(--accent-blue)]",
      bg: "bg-[var(--accent-blue)]/10",
    },
    saldo: {
      icon: "text-[var(--accent-purple)]",
      variation: "text-[var(--accent-purple)]",
      bg: "bg-[var(--accent-purple)]/10",
    },
  };

  const colors = typeColors[type];

  return (
    <CardContainer
      className={cn("p-4 md:p-5", className)}
      hover
      glow={type === "economia"}
      glowColor={type === "economia" ? "blue" : "green"}
    >
      <div className="space-y-3">
        {/* Label */}
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          {title}
        </p>

        {/* Value and Icon Row */}
        <div className="flex items-start justify-between gap-3">
          <p className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            {formatCurrency(value)}
          </p>
          {icon && (
            <div className={cn("p-2 rounded-full flex-shrink-0", colors.bg)}>
              <div className={colors.icon}>{icon}</div>
            </div>
          )}
        </div>

        {/* Variation */}
        {variation !== undefined && (
          <div className="flex items-center gap-1 text-xs">
            <TrendIcon
              className={cn(
                "h-3 w-3",
                isPositive ? colors.variation : "text-[#EF4444]"
              )}
            />
            <span
              className={cn(
                isPositive ? colors.variation : "text-[#EF4444]"
              )}
            >
              {isPositive ? "+" : ""}
              {variation.toFixed(1).replace(".", ",")}%
            </span>
            <span className="text-[var(--text-secondary)]">vs mês anterior</span>
          </div>
        )}
      </div>
    </CardContainer>
  );
}

