import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Investimento = {
  id: string;
  nomeInvestimento: string;
  tipoInvestimento: string;
  valorAtual: string;
  rentabilidade: string;
};

export function PortfolioInvestimentos() {
  const { data: investimentos, isLoading } = useQuery<Investimento[]>({
    queryKey: ["/api/investimentos"],
    queryFn: async () => {
      const response = await fetch("/api/investimentos", { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch investimentos');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle>Portfólio de Investimentos</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalPortfolio = investimentos?.reduce((sum, inv) => sum + parseFloat(inv.valorAtual), 0) || 0;

  return (
    <Card className="p-6" data-testid="portfolio-investimentos">
      <CardHeader className="px-0 pt-0 pb-4">
        <CardTitle>Portfólio de Investimentos</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="space-y-4">
          {investimentos?.map((investimento, index) => {
            const valor = parseFloat(investimento.valorAtual);
            const porcentagem = totalPortfolio > 0 ? (valor / totalPortfolio) * 100 : 0;
            const rentabilidade = parseFloat(investimento.rentabilidade);
            const isPositive = rentabilidade >= 0;
            const TrendIcon = isPositive ? TrendingUp : TrendingDown;
            
            return (
              <div
                key={investimento.id}
                className="p-4 rounded-lg bg-card border hover-elevate active-elevate-2"
                data-testid={`investimento-card-${index}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">
                      {investimento.nomeInvestimento}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {porcentagem.toFixed(0)}% da carteira
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                    <div className="flex items-center justify-end gap-1">
                      <TrendIcon className={`h-3 w-3 ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} />
                      <span className={`text-xs font-medium ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isPositive ? '+' : ''}{rentabilidade.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                    style={{ width: `${porcentagem}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
