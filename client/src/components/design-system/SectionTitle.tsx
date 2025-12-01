import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionTitleProps {
  children: ReactNode;
  className?: string;
  subtitle?: string;
}

export function SectionTitle({ children, className, subtitle }: SectionTitleProps) {
  return (
    <div className={cn("mb-4", className)}>
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
        {children}
      </h3>
      {subtitle && (
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}
