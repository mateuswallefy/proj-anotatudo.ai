import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  iconColor?: string;
  iconBg?: string;
  valueColor?: string;
  className?: string;
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  subtitle,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
  valueColor = "text-foreground",
  className = "",
}: MetricCardProps) {
  return (
    <Card className={`hover-elevate ${className}`}>
      <CardContent className="p-5">
        <div className={`${iconBg} p-3 rounded-lg w-fit mb-3`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        <p className={`text-3xl font-bold font-mono tabular-nums ${valueColor}`}>
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
