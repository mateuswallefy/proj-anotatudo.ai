import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AppCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  borderAccent?: "emerald" | "red" | "blue" | "purple" | "none";
}

export function AppCard({ children, className, hover = true, borderAccent = "none" }: AppCardProps) {
  const accentColors = {
    emerald: "bg-emerald-500",
    red: "bg-red-500",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    none: "",
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300",
        hover && "hover:border-border hover:shadow-lg hover:bg-card",
        className
      )}
    >
      {borderAccent !== "none" && (
        <div className={cn("absolute left-0 top-0 bottom-0 w-1", accentColors[borderAccent])} />
      )}
      {children}
    </div>
  );
}

