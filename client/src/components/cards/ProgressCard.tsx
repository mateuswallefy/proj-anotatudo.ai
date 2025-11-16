import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ProgressCardProps {
  name: string;
  icon?: React.ReactNode;
  used: number;
  limit: number;
  percentage: number;
  subtitle?: string;
  className?: string;
  progressColor?: string;
}

export function ProgressCard({
  name,
  icon,
  used,
  limit,
  percentage,
  subtitle,
  className = "",
  progressColor,
}: ProgressCardProps) {
  const getProgressColor = () => {
    if (progressColor) return progressColor;
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 75) return "bg-orange-500";
    return "bg-primary";
  };

  return (
    <Card className={`hover-elevate ${className}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="bg-primary/10 p-2 rounded-lg">
                {icon}
              </div>
            )}
            <div>
              <h3 className="font-semibold">{name}</h3>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {percentage.toFixed(1)}%
          </span>
        </div>
        
        <Progress 
          value={Math.min(percentage, 100)} 
          className="h-2 mb-3"
        />
        
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Usado</p>
            <p className="font-semibold font-mono">
              R$ {used.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-xs">Limite</p>
            <p className="font-semibold font-mono">
              R$ {limit.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
