import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Média Diária de Gastos */}
      <Card data-testid="card-insight-gasto-diario">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Média Diária de Gastos</CardTitle>
          <TrendingDown className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono text-destructive" data-testid="text-media-gasto">
            {formatCurrency(mediaDiariaGastos)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Total: {formatCurrency(totalGastosMes)} no mês
          </p>
        </CardContent>
      </Card>

      {/* Média Diária de Receitas */}
      <Card data-testid="card-insight-receita-diaria">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Média Diária de Receitas</CardTitle>
          <TrendingUp className="h-4 w-4 text-chart-1" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono text-chart-1" data-testid="text-media-receita">
            {formatCurrency(mediaDiariaReceitas)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Total: {formatCurrency(totalReceitasMes)} no mês
          </p>
        </CardContent>
      </Card>

      {/* Saldo do Mês */}
      <Card data-testid="card-insight-saldo">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo do Mês</CardTitle>
          <DollarSign className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div 
            className={`text-2xl font-bold font-mono ${
              totalReceitasMes - totalGastosMes >= 0 ? 'text-chart-1' : 'text-destructive'
            }`}
            data-testid="text-saldo-mes"
          >
            {formatCurrency(totalReceitasMes - totalGastosMes)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {totalReceitasMes - totalGastosMes >= 0 ? 'Positivo' : 'Negativo'}
          </p>
        </CardContent>
      </Card>

      {/* Dica Principal */}
      <Card data-testid="card-insight-dica" className="bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Dica de Economia</CardTitle>
          <LightbulbIcon className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed" data-testid="text-dica-principal">
            {dicasEconomia.length > 0 ? dicasEconomia[0] : 'Continue monitorando suas finanças!'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
