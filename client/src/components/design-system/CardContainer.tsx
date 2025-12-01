import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardContainerProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  glowColor?: "green" | "blue" | "purple" | "orange";
}

export function CardContainer({
  children,
  className,
  hover = false,
  glow = false,
  glowColor = "blue",
}: CardContainerProps) {
  const glowClasses = {
    green: "dark:shadow-[0_0_20px_var(--glow-green)]",
    blue: "dark:shadow-[0_0_20px_var(--glow-blue)]",
    purple: "dark:shadow-[0_0_20px_rgba(142,102,255,0.18)]",
    orange: "dark:shadow-[0_0_20px_rgba(255,122,85,0.18)]",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border transition-all duration-200",
        "bg-[var(--card)] border-[var(--border)]",
        "shadow-sm",
        hover && "hover:shadow-md hover:scale-[1.01] active:scale-[0.99]",
        glow && glowClasses[glowColor],
        className
      )}
    >
      {children}
    </div>
  );
}

