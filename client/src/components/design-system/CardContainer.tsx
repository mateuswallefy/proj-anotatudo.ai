import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardVariant = "default" | "elevated" | "outline" | "gradient";
type GlowColor = "primary" | "secondary" | "green";

interface CardContainerProps {
  children: ReactNode;
  className?: string;
  variant?: CardVariant;
  hover?: boolean;
  glow?: boolean;
  glowColor?: GlowColor;
  padding?: "sm" | "md" | "lg" | "xl";
}

export function CardContainer({
  children,
  className,
  variant = "default",
  hover = false,
  glow = false,
  glowColor = "primary",
  padding = "md",
}: CardContainerProps) {
  const glowClasses: Record<GlowColor, string> = {
    primary: "dark:shadow-[0_0_20px_var(--glow-primary)]",
    secondary: "dark:shadow-[0_0_20px_var(--glow-secondary)]",
    green: "dark:shadow-[0_0_20px_var(--glow-green)]",
  };

  const variantClasses: Record<CardVariant, string> = {
    default: "bg-[var(--card)] border-[var(--border)] shadow-sm",
    elevated: "bg-[var(--card)] border-[var(--border)] shadow-md dark:shadow-lg",
    outline: "bg-transparent border-2 border-[var(--border)]",
    gradient: "bg-gradient-to-br from-[var(--card)] to-[var(--card-contrast)] border-[var(--border)] shadow-sm",
  };

  const paddingClasses = {
    sm: "p-3",
    md: "p-4 md:p-5",
    lg: "p-5 md:p-6",
    xl: "p-6 md:p-8",
  };

  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border transition-all duration-200 ease-out",
        variantClasses[variant],
        paddingClasses[padding],
        hover && "hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] cursor-pointer",
        glow && glowClasses[glowColor],
        className
      )}
    >
      {children}
    </div>
  );
}



