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

export default function Insights() {
  const { data: insights, isLoading } = useQuery<Insight[]>({
    queryKey: ["/api/insights-ai"],
    queryFn: async () => {
      const response = await fetch("/api/insights-ai?limit=10", { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch insights');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Lightbulb className="h-8 w-8 text-amber-500" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Insights Inteligentes</h1>
          <p className="text-muted-foreground">
            Sugestões personalizadas de IA para melhorar suas finanças
          </p>
        </div>
      </div>

      {/* Insights Grid */}
      {insights && insights.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {insights.map((insight, index) => {
            const Icon = getInsightIcon(insight.tipoInsight);
            const valorImpacto = insight.valorImpacto ? parseFloat(insight.valorImpacto) : null;
            const percentualImpacto = insight.percentualImpacto ? parseFloat(insight.percentualImpacto) : null;
            
            const relevanciaColor = insight.relevancia === 'alta' 
              ? 'border-amber-500/50' 
              : insight.relevancia === 'media' 
                ? 'border-amber-300/30' 
                : 'border-amber-200/20';
            
            return (
              <Card
                key={insight.id}
                className={`p-6 bg-gradient-to-br from-amber-500/5 to-orange-500/10 ${relevanciaColor} hover-elevate active-elevate-2`}
                data-testid={`insight-card-${index}`}
              >
                <CardContent className="p-0">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-amber-500/10">
                      <Icon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">
                          {insight.titulo}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {insight.descricao}
                        </p>
                      </div>
                      
                      {valorImpacto && valorImpacto > 0 && (
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            R$ {valorImpacto.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </span>
                          <span className="text-sm text-muted-foreground">/ano</span>
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

                      {insight.acaoSugerida && (
                        <div className="pt-3 border-t border-border">
                          <p className="text-sm font-medium text-foreground">
                            💡 {insight.acaoSugerida}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum insight disponível</h3>
            <p className="text-muted-foreground">
              Continue usando o app para receber sugestões personalizadas
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
