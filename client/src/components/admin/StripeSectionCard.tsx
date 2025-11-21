import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StripeSectionCardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  headerActions?: ReactNode;
}

export function StripeSectionCard({
  title,
  subtitle,
  children,
  className,
  headerActions,
}: StripeSectionCardProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800",
        "overflow-hidden",
        className
      )}
    >
      {(title || subtitle || headerActions) && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-1">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
          {headerActions && (
            <div className="flex-shrink-0">
              {headerActions}
            </div>
          )}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}


