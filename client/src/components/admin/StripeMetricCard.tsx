import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StripeMetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export function StripeMetricCard({
  label,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-blue-600",
  iconBg = "bg-blue-50",
  trend,
  className,
}: StripeMetricCardProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800",
        "p-6 transition-all hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={cn("p-2 rounded-lg", iconBg)}>
              <Icon className={cn("h-5 w-5", iconColor)} />
            </div>
          )}
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium">
              {label}
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-1">
        <p className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        )}
        {trend && (
          <p
            className={cn(
              "text-xs font-medium",
              trend.isPositive
                ? "text-green-600 dark:text-green-500"
                : "text-red-600 dark:text-red-500"
            )}
          >
            {trend.isPositive ? "↑" : "↓"} {trend.value}
          </p>
        )}
      </div>
    </div>
  );
}


