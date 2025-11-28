import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, DollarSign, CreditCard, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Insight = {
  id: string;
  tipoInsight: 'economia' | 'investimento' | 'otimizacao_cartao' | 'outro';
  titulo: string;
  descricao: string;
  valorImpacto: string | null;
  percentualImpacto: string | null;
  acaoSugerida: string | null;
  relevancia: 'baixa' | 'media' | 'alta';
};

const getInsightIcon = (tipo: string) => {
  switch (tipo) {
    case 'economia':
      return DollarSign;
    case 'investimento':
      return TrendingUp;
    case 'otimizacao_cartao':
      return CreditCard;
    default:
      return Lightbulb;
  }
};

export function InsightsInteligentes() {
  const { data: insights, isLoading } = useQuery<Insight[]>({
    queryKey: ["/api/insights-ai"],
    queryFn: async () => {
      const response = await fetch("/api/insights-ai?limit=3", { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch insights');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle>Insights Inteligentes</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights || insights.length === 0) {
    return null;
  }

  return (
    <Card className="p-6" data-testid="insights-inteligentes">
      <CardHeader className="px-0 pt-0 pb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <CardTitle>Insights Inteligentes</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="space-y-4">
          {insights.map((insight, index) => {
            const Icon = getInsightIcon(insight.tipoInsight);
            const valorImpacto = insight.valorImpacto ? parseFloat(insight.valorImpacto) : null;
            const percentualImpacto = insight.percentualImpacto ? parseFloat(insight.percentualImpacto) : null;
            
            return (
              <div
                key={insight.id}
                className="p-4 rounded-lg bg-gradient-to-br from-amber-500/5 to-orange-500/10 border border-amber-200/20 dark:border-amber-800/20 hover-elevate active-elevate-2"
                data-testid={`insight-card-${index}`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Icon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-sm">
                      {insight.titulo}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {insight.descricao}
                    </p>
                    
                    {valorImpacto && valorImpacto > 0 && (
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          R$ {valorImpacto.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                        <span className="text-xs text-muted-foreground">/ano</span>
                      </div>
                    )}
                    
                    {percentualImpacto && percentualImpacto > 0 && (
                      <div className="text-sm">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          +{percentualImpacto.toFixed(0)}%
                        </span>
                        <span className="text-muted-foreground ml-1">
                          {insight.tipoInsight === 'investimento' ? 'retorno potencial' : 'economia potencial'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
