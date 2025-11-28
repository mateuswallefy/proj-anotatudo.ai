import { Card, CardContent } from "@/components/ui/card";
import { LightbulbIcon, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface InsightsCardsProps {
  dicasEconomia: string[];
  mediaDiariaGastos: number;
  mediaDiariaReceitas: number;
  totalGastosMes: number;
  totalReceitasMes: number;
}

export function InsightsCards({
  dicasEconomia,
  mediaDiariaGastos,
  mediaDiariaReceitas,
  totalGastosMes,
  totalReceitasMes,
}: InsightsCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const saldoMes = totalReceitasMes - totalGastosMes;
  const isPositive = saldoMes >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Média Diária de Gastos */}
      <Card 
        className="hover-elevate transition-all duration-200 border-chart-2/20" 
        style={{ backgroundColor: 'hsl(var(--chart-2) / 0.05)' }}
        data-testid="card-insight-gasto-diario"
      >
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm"
              style={{ backgroundColor: 'hsl(var(--chart-2) / 0.15)' }}
            >
              <TrendingDown className="h-6 w-6 text-chart-2" />
            </div>
          </div>
          <div className="text-xs uppercase tracking-wide font-medium text-muted-foreground mb-2">
            Média Diária de Gastos
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-chart-2 mb-1" data-testid="text-media-gasto">
            {formatCurrency(mediaDiariaGastos)}
          </div>
          <p className="text-xs text-muted-foreground">
            Total: {formatCurrency(totalGastosMes)} no mês
          </p>
        </CardContent>
      </Card>

      {/* Média Diária de Receitas */}
      <Card 
        className="hover-elevate transition-all duration-200 border-chart-1/20" 
        style={{ backgroundColor: 'hsl(var(--chart-1) / 0.05)' }}
        data-testid="card-insight-receita-diaria"
      >
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm"
              style={{ backgroundColor: 'hsl(var(--chart-1) / 0.15)' }}
            >
              <TrendingUp className="h-6 w-6 text-chart-1" />
            </div>
          </div>
          <div className="text-xs uppercase tracking-wide font-medium text-muted-foreground mb-2">
            Média Diária de Receitas
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-chart-1 mb-1" data-testid="text-media-receita">
            {formatCurrency(mediaDiariaReceitas)}
          </div>
          <p className="text-xs text-muted-foreground">
            Total: {formatCurrency(totalReceitasMes)} no mês
          </p>
        </CardContent>
      </Card>

      {/* Saldo do Mês */}
      <Card 
        className="hover-elevate transition-all duration-200"
        style={{ 
          backgroundColor: isPositive ? 'hsl(var(--chart-1) / 0.05)' : 'hsl(var(--destructive) / 0.05)',
          borderColor: isPositive ? 'hsl(var(--chart-1) / 0.2)' : 'hsl(var(--destructive) / 0.2)'
        }}
        data-testid="card-insight-saldo"
      >
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm"
              style={{ 
                backgroundColor: isPositive ? 'hsl(var(--chart-1) / 0.15)' : 'hsl(var(--destructive) / 0.15)'
              }}
            >
              <DollarSign className={`h-6 w-6 ${isPositive ? 'text-chart-1' : 'text-destructive'}`} />
            </div>
          </div>
          <div className="text-xs uppercase tracking-wide font-medium text-muted-foreground mb-2">
            Saldo do Mês
          </div>
          <div 
            className={`text-3xl font-bold font-mono tabular-nums mb-1 ${
              isPositive ? 'text-chart-1' : 'text-destructive'
            }`}
            data-testid="text-saldo-mes"
          >
            {formatCurrency(saldoMes)}
          </div>
          <p className="text-xs text-muted-foreground">
            {isPositive ? 'Positivo' : 'Negativo'}
          </p>
        </CardContent>
      </Card>

      {/* Dica Principal */}
      <Card 
        className="hover-elevate transition-all duration-200 border-primary/20" 
        style={{ backgroundColor: 'hsl(var(--primary) / 0.05)' }}
        data-testid="card-insight-dica"
      >
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm"
              style={{ backgroundColor: 'hsl(var(--primary) / 0.15)' }}
            >
              <LightbulbIcon className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="text-xs uppercase tracking-wide font-medium text-muted-foreground mb-2">
            Dica de Economia
          </div>
          <p className="text-sm leading-relaxed" data-testid="text-dica-principal">
            {dicasEconomia.length > 0 ? dicasEconomia[0] : 'Continue monitorando suas finanças!'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
