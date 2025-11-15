import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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

  return (
    <Card className="h-full" data-testid="card-category-ranking">
      <CardHeader>
        <CardTitle>Top Categorias de Gastos</CardTitle>
      </CardHeader>
      <CardContent>
        {topCategorias.length > 0 ? (
          <div className="space-y-6">
            {topCategorias.map((cat, index) => {
              const IconComponent = getCategoryIcon(cat.categoria);
              return (
                <div key={cat.categoria} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-destructive/10">
                        <IconComponent className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <p className="font-semibold">{cat.categoria}</p>
                        <p className="text-xs text-muted-foreground">
                          {cat.transacoes} {cat.transacoes === 1 ? 'transação' : 'transações'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold font-mono text-destructive">
                        {formatCurrency(cat.total)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cat.percentual.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <Progress 
                    value={cat.percentual} 
                    className="h-2"
                    data-testid={`progress-categoria-${index}`}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            Nenhum gasto categorizado este mês
          </div>
        )}
      </CardContent>
    </Card>
  );
}
