import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { CardContainer } from "./CardContainer";
import { cn } from "@/lib/utils";

type KpiType = "income" | "expense" | "balance" | "savings";

interface KpiCardProps {
  title: string;
  value: string | number;
  variation?: number;
  icon?: ReactNode;
  type?: KpiType;
  className?: string;
}

export function KpiCard({
  title,
  value,
  variation,
  icon,
  type = "income",
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

  const typeConfig: Record<KpiType, {
    iconColor: string;
    variationColor: string;
    bgColor: string;
    accentColor: string;
    glowColor: "primary" | "secondary" | "green";
  }> = {
    income: {
      iconColor: "text-[var(--accent-success)]",
      variationColor: "text-[var(--accent-success)]",
      bgColor: "bg-[var(--accent-success)]/10 dark:bg-[var(--accent-success)]/15",
      accentColor: "var(--accent-success)",
      glowColor: "green",
    },
    expense: {
      iconColor: "text-[var(--accent-danger)]",
      variationColor: "text-[var(--accent-danger)]",
      bgColor: "bg-[var(--accent-danger)]/10 dark:bg-[var(--accent-danger)]/15",
      accentColor: "var(--accent-danger)",
      glowColor: "primary",
    },
    balance: {
      iconColor: "text-[var(--accent-primary)]",
      variationColor: "text-[var(--accent-primary)]",
      bgColor: "bg-[var(--accent-primary)]/10 dark:bg-[var(--accent-primary)]/15",
      accentColor: "var(--accent-primary)",
      glowColor: "primary",
    },
    savings: {
      iconColor: "text-[var(--accent-secondary)]",
      variationColor: "text-[var(--accent-secondary)]",
      bgColor: "bg-[var(--accent-secondary)]/10 dark:bg-[var(--accent-secondary)]/15",
      accentColor: "var(--accent-secondary)",
      glowColor: "secondary",
    },
  };

  const config = typeConfig[type];

  return (
    <CardContainer
      className={cn("relative overflow-hidden", className)}
      variant="default"
      hover
      glow
      glowColor={config.glowColor}
      padding="lg"
    >
      {/* Background accent gradient */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 dark:opacity-20"
        style={{ backgroundColor: config.accentColor }}
      />
      
      <div className="relative space-y-4">
        {/* Label */}
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          {title}
        </p>

        {/* Value and Icon Row */}
        <div className="flex items-start justify-between gap-4">
          <p className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--text-primary)] leading-none">
            {formatCurrency(value)}
          </p>
          {icon && (
            <div className={cn(
              "p-3 rounded-[var(--radius-md)] flex-shrink-0",
              config.bgColor
            )}>
              <div className={cn(config.iconColor, "w-5 h-5")}>
                {icon}
              </div>
            </div>
          )}
        </div>

        {/* Variation */}
        {variation !== undefined && (
          <div className="flex items-center gap-1.5 text-sm">
            <TrendIcon
              className={cn(
                "h-4 w-4",
                isPositive ? config.variationColor : "text-[var(--accent-danger)]"
              )}
            />
            <span
              className={cn(
                "font-semibold",
                isPositive ? config.variationColor : "text-[var(--accent-danger)]"
              )}
            >
              {isPositive ? "+" : ""}
              {variation.toFixed(1).replace(".", ",")}%
            </span>
            <span className="text-[var(--text-secondary)] text-xs">vs mês anterior</span>
          </div>
        )}
      </div>
    </CardContainer>
  );
}



