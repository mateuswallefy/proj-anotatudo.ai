import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Utensils, 
  Car, 
  Home, 
  Heart, 
  BookOpen, 
  Gamepad2, 
  ShoppingBag, 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Package 
} from "lucide-react";

interface CategoryRankingProps {
  topCategorias: Array<{
    categoria: string;
    total: number;
    percentual: number;
    transacoes: number;
  }>;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Alimentação': 'hsl(var(--chart-1))',
  'Transporte': 'hsl(var(--chart-2))',
  'Moradia': 'hsl(var(--chart-3))',
  'Saúde': 'hsl(var(--chart-4))',
  'Educação': 'hsl(var(--chart-5))',
  'Lazer': 'hsl(var(--chart-6))',
  'Compras': 'hsl(var(--chart-5))',
  'Contas': 'hsl(var(--chart-2))',
  'Salário': 'hsl(var(--chart-1))',
  'Investimentos': 'hsl(var(--chart-3))',
  'Outros': 'hsl(var(--muted-foreground))',
};

export function CategoryRanking({ topCategorias }: CategoryRankingProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getCategoryIcon = (categoria: string) => {
    const iconMap: Record<string, any> = {
      'Alimentação': Utensils,
      'Transporte': Car,
      'Moradia': Home,
      'Saúde': Heart,
      'Educação': BookOpen,
      'Lazer': Gamepad2,
      'Compras': ShoppingBag,
      'Contas': CreditCard,
      'Salário': DollarSign,
      'Investimentos': TrendingUp,
      'Outros': Package,
    };
    return iconMap[categoria] || Package;
  };

  const getCategoryColorVar = (categoria: string) => {
    const colorMap: Record<string, string> = {
      'Alimentação': '--chart-1',
      'Transporte': '--chart-2',
      'Moradia': '--chart-3',
      'Saúde': '--chart-4',
      'Educação': '--chart-5',
      'Lazer': '--chart-6',
      'Compras': '--chart-5',
      'Contas': '--chart-2',
      'Salário': '--chart-1',
      'Investimentos': '--chart-3',
      'Outros': '--muted-foreground',
    };
    return colorMap[categoria] || '--muted-foreground';
  };

  const getCategoryColor = (categoria: string) => {
    return CATEGORY_COLORS[categoria] || CATEGORY_COLORS['Outros'];
  };

  return (
    <Card className="h-full hover-elevate transition-shadow duration-200" data-testid="card-category-ranking">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Top Categorias de Gastos</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {topCategorias.length > 0 ? (
          <div className="space-y-4">
            {topCategorias.map((cat, index) => {
              const IconComponent = getCategoryIcon(cat.categoria);
              const categoryColor = getCategoryColor(cat.categoria);
              const categoryColorVar = getCategoryColorVar(cat.categoria);
              
              return (
                <div 
                  key={cat.categoria} 
                  className="p-3 rounded-lg hover-elevate active-elevate-2 transition-all duration-200"
                  style={{ backgroundColor: `hsl(var(${categoryColorVar}) / 0.08)` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: `hsl(var(${categoryColorVar}) / 0.20)` }}
                      >
                        <IconComponent className="h-5 w-5" style={{ color: categoryColor }} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{cat.categoria}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge 
                            variant="secondary" 
                            className="text-xs px-2 py-0 h-5 no-default-hover-elevate"
                          >
                            {cat.transacoes} {cat.transacoes === 1 ? 'transação' : 'transações'}
                          </Badge>
                          <span className="text-xs font-medium" style={{ color: categoryColor }}>
                            {cat.percentual.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-base tabular-nums" style={{ color: categoryColor }}>
                        {formatCurrency(cat.total)}
                      </p>
                    </div>
                  </div>
                  <Progress 
                    value={cat.percentual} 
                    className="h-1.5"
                    style={{ 
                      backgroundColor: `hsl(var(${categoryColorVar}) / 0.15)`
                    }}
                    data-testid={`progress-categoria-${index}`}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            Nenhum gasto categorizado este mês
          </div>
        )}
      </CardContent>
    </Card>
  );
}
