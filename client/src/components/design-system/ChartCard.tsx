import { ReactNode } from "react";
import { CardContainer } from "./CardContainer";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  variant?: "default" | "elevated";
}

export function ChartCard({
  title,
  subtitle,
  children,
  className,
  variant = "default",
}: ChartCardProps) {
  return (
    <CardContainer
      className={cn("overflow-hidden", className)}
      variant={variant}
      padding="lg"
    >
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <h3 className="text-lg md:text-xl font-bold tracking-tight text-[var(--text-primary)] mb-1">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-[var(--text-secondary)]">
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div className="w-full">
        {children}
      </div>
    </CardContainer>
  );
}

