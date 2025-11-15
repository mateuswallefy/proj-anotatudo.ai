import { useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
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
    const remaining = Math.max(0, 100 - used);
    return [
      { name: 'Usado', value: used },
      { name: 'Disponível', value: remaining },
    ];
  }, [percentualUsado]);

  const getGaugeColor = () => {
    if (status === 'perigo') return 'hsl(var(--destructive))';
    if (status === 'alerta') return 'hsl(var(--chart-3))';
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
    <Card className="h-full" data-testid="card-spending-speedometer">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Teto de Gastos Mensal</CardTitle>
          <Badge variant={getStatusVariant()} className="gap-1">
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={gaugeData}
                cx="50%"
                cy="80%"
                startAngle={180}
                endAngle={0}
                innerRadius={80}
                outerRadius={100}
                dataKey="value"
                stroke="none"
              >
                <Cell fill={getGaugeColor()} />
                <Cell fill="hsl(var(--muted))" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-8">
            <div className="text-4xl font-bold font-mono" style={{ color: getGaugeColor() }}>
              {percentualUsado.toFixed(0)}%
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {formatCurrency(gastoAtual)} de {formatCurrency(limiteTotal)}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Gasto no mês:</span>
            <span className="font-semibold font-mono">{formatCurrency(gastoAtual)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Limite total:</span>
            <span className="font-semibold font-mono">{formatCurrency(limiteTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Disponível:</span>
            <span className="font-semibold font-mono text-chart-1">
              {formatCurrency(Math.max(0, limiteTotal - gastoAtual))}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
