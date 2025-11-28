import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StripeEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function StripeEmptyState({
  icon: Icon,
  title,
  subtitle,
  action,
  className,
}: StripeEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      {Icon && (
        <div className="mb-4 p-3 rounded-full bg-gray-100 dark:bg-gray-800">
          <Icon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-1">
        {title}
      </h3>
      {subtitle && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4">
          {subtitle}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}


