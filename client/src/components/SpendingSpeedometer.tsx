import { useMemo } from "react";
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

interface SpendingSpeedometerProps {
  gastoAtual: number;
  limiteTotal: number;
  percentualUsado: number;
  status: 'seguro' | 'alerta' | 'perigo';
}

export function SpendingSpeedometer({ gastoAtual, limiteTotal, percentualUsado, status }: SpendingSpeedometerProps) {
  const gaugeData = useMemo(() => {
    const used = Math.min(percentualUsado, 100);
    return [
      {
        name: 'Usado',
        value: used,
        fill: status === 'perigo' ? 'hsl(var(--destructive))' : 
              status === 'alerta' ? 'hsl(var(--chart-2))' : 
              'hsl(var(--chart-1))'
      }
    ];
  }, [percentualUsado, status]);

  const getGaugeColor = () => {
    if (status === 'perigo') return 'hsl(var(--destructive))';
    if (status === 'alerta') return 'hsl(var(--chart-2))';
    return 'hsl(var(--chart-1))';
  };

  const getStatusIcon = () => {
    if (status === 'perigo') return <AlertTriangle className="h-4 w-4" />;
    if (status === 'alerta') return <Info className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (status === 'perigo') return 'Limite Quase Esgotado!';
    if (status === 'alerta') return 'Atenção aos Gastos';
    return 'Gastos Sob Controle';
  };

  const getStatusVariant = (): "default" | "destructive" | "outline" | "secondary" => {
    if (status === 'perigo') return 'destructive';
    if (status === 'alerta') return 'secondary';
    return 'default';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card className="h-full hover-elevate transition-shadow duration-200" data-testid="card-spending-speedometer">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Teto de Gastos Mensal</CardTitle>
          <Badge variant={getStatusVariant()} className="gap-1 no-default-hover-elevate">
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="relative">
          <ResponsiveContainer width="100%" height={260}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="70%"
              outerRadius="100%"
              data={gaugeData}
              startAngle={180}
              endAngle={0}
            >
              <defs>
                <radialGradient id="gaugeGradient" cx="50%" cy="50%">
                  <stop offset="0%" stopColor={getGaugeColor()} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={getGaugeColor()} stopOpacity={1} />
                </radialGradient>
              </defs>
              <PolarAngleAxis
                type="number"
                domain={[0, 100]}
                angleAxisId={0}
                tick={false}
              />
              <RadialBar
                background={{ fill: 'hsl(var(--muted) / 0.15)' }}
                dataKey="value"
                cornerRadius={12}
                fill="url(#gaugeGradient)"
                animationDuration={600}
                animationEasing="ease-out"
              />
            </RadialBarChart>
          </ResponsiveContainer>
          
          {/* Center Values - Material 3 Style */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pb-4">
            <div 
              className="text-5xl font-bold font-mono tabular-nums leading-none" 
              style={{ color: getGaugeColor() }}
            >
              {percentualUsado.toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground mt-2 uppercase tracking-wide font-medium">
              do limite
            </div>
            <div className="text-lg font-mono font-semibold mt-3 tabular-nums">
              {formatCurrency(gastoAtual)}
            </div>
          </div>
        </div>

        {/* Compact Details - Modern Layout */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">
              Limite Total
            </div>
            <div className="text-base font-mono font-semibold tabular-nums">
              {formatCurrency(limiteTotal)}
            </div>
          </div>
          <div className="text-center p-3 rounded-lg" style={{ 
            backgroundColor: 'hsl(var(--chart-1) / 0.1)',
            borderColor: 'hsl(var(--chart-1) / 0.3)',
            borderWidth: '1px'
          }}>
            <div className="text-xs uppercase tracking-wide font-medium mb-1" style={{ color: 'hsl(var(--chart-1))' }}>
              Disponível
            </div>
            <div className="text-base font-mono font-semibold tabular-nums" style={{ color: 'hsl(var(--chart-1))' }}>
              {formatCurrency(Math.max(0, limiteTotal - gastoAtual))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
