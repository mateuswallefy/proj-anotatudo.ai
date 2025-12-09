import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionTitleProps {
  children: ReactNode;
  className?: string;
  subtitle?: string;
  action?: ReactNode;
}

export function SectionTitle({ children, className, subtitle, action }: SectionTitleProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-5 md:mb-6", className)}>
      <div className="flex-1">
        <h3 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
        {children}
      </h3>
      {subtitle && (
          <p className="text-sm md:text-base text-[var(--text-secondary)] mt-1.5 leading-relaxed">
          {subtitle}
        </p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
