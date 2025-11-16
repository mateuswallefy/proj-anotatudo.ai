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
    return "bg-green-500";
  };

  return (
    <Card className={`hover-elevate ${className}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="bg-primary/10 p-2 rounded-lg" data-testid="container-card-icon">
                {icon}
              </div>
            )}
            <div>
              <h3 className="font-semibold" data-testid="text-card-name">{name}</h3>
              {subtitle && (
                <p className="text-xs text-muted-foreground" data-testid="text-card-subtitle">{subtitle}</p>
              )}
            </div>
          </div>
          <span className="text-sm font-medium text-muted-foreground" data-testid="text-percentage">
            {percentage.toFixed(1)}%
          </span>
        </div>
        
        <Progress 
          value={Math.min(percentage, 100)} 
          className="h-2 mb-3"
          data-testid="progress-bar"
        />
        
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="text-muted-foreground text-xs" data-testid="label-usado">Usado</p>
            <p className="font-semibold font-mono" data-testid="value-usado">
              R$ {used.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-xs" data-testid="label-limite">Limite</p>
            <p className="font-semibold font-mono" data-testid="value-limite">
              R$ {limit.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
