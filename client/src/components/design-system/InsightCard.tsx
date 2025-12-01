import { ReactNode } from "react";
import { CardContainer } from "./CardContainer";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface InsightCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  cta?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  glowColor?: "primary" | "secondary" | "green";
}

export function InsightCard({
  icon,
  title,
  description,
  cta,
  className,
  glowColor = "primary",
}: InsightCardProps) {
  return (
    <CardContainer
      className={cn(
        "relative overflow-hidden",
        "bg-gradient-to-br from-[var(--card)] to-[var(--card-contrast)]",
        "dark:from-[var(--card)] dark:to-[var(--card-contrast)]",
        className
      )}
      variant="gradient"
      glow
      glowColor={glowColor}
      padding="lg"
      hover={!!cta}
    >
      {/* Background glow effect */}
      <div 
        className={cn(
          "absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20 dark:opacity-30",
          glowColor === "primary" && "bg-[var(--accent-primary)]",
          glowColor === "secondary" && "bg-[var(--accent-secondary)]",
          glowColor === "green" && "bg-[var(--accent-success)]"
        )}
      />
      
      <div className="relative space-y-4">
        {/* Icon */}
        <div className="flex items-start gap-4">
          <div className={cn(
            "p-3 rounded-[var(--radius-md)] flex-shrink-0",
            glowColor === "primary" && "bg-[var(--accent-primary)]/10 dark:bg-[var(--accent-primary)]/20",
            glowColor === "secondary" && "bg-[var(--accent-secondary)]/10 dark:bg-[var(--accent-secondary)]/20",
            glowColor === "green" && "bg-[var(--accent-success)]/10 dark:bg-[var(--accent-success)]/20"
          )}>
            <div className={cn(
              "w-6 h-6",
              glowColor === "primary" && "text-[var(--accent-primary)]",
              glowColor === "secondary" && "text-[var(--accent-secondary)]",
              glowColor === "green" && "text-[var(--accent-success)]"
            )}>
              {icon}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-lg font-bold tracking-tight text-[var(--text-primary)] mb-2">
              {title}
            </h4>
            <p className="text-sm md:text-base text-[var(--text-secondary)] leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* CTA */}
        {cta && (
          <button
            onClick={cta.onClick}
            className={cn(
              "flex items-center gap-2 text-sm font-semibold transition-colors",
              glowColor === "primary" && "text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80",
              glowColor === "secondary" && "text-[var(--accent-secondary)] hover:text-[var(--accent-secondary)]/80",
              glowColor === "green" && "text-[var(--accent-success)] hover:text-[var(--accent-success)]/80"
            )}
          >
            {cta.label}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </CardContainer>
  );
}

