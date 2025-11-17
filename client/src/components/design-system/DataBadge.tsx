import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DataBadgeProps {
  children: ReactNode;
  variant?: "default" | "secondary" | "outline" | "destructive";
  icon?: ReactNode;
  className?: string;
  color?: string;
}

export function DataBadge({ children, variant = "outline", icon, className, color }: DataBadgeProps) {
  return (
    <Badge
      variant={variant}
      className={cn(
        "text-xs font-medium px-2.5 py-0.5 rounded-lg flex items-center gap-1.5",
        className
      )}
      style={color ? {
        backgroundColor: `${color}10`,
        borderColor: `${color}30`,
        color: color
      } : undefined}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      <span>{children}</span>
    </Badge>
  );
}

