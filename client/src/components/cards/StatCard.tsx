import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | ReactNode;
  subtitle?: string;
  trend?: string;
  iconColor?: string;
  iconBg?: string;
  className?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  trend,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
  className = "",
}: StatCardProps) {
  return (
    <Card className={`hover-elevate ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className={`${iconBg} p-3 rounded-lg`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          {trend && (
            <span className="text-xs font-medium text-muted-foreground">
              {trend}
            </span>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold font-mono tabular-nums">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
