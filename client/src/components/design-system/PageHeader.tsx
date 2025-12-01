import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 md:mb-8", className)}>
      <div className="flex-1">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--text-primary)] leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-base md:text-lg text-[var(--text-secondary)] mt-2 md:mt-3 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 sm:flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
