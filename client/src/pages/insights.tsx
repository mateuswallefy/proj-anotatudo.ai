import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb, 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  Zap, 
  AlertTriangle, 
  PiggyBank,
  Filter 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from "@/components/cards/MetricCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: insights, isLoading } = useQuery<Insight[]>({
    queryKey: ["/api/insights-ai"],
    queryFn: async () => {
      const response = await fetch("/api/insights-ai?limit=10", { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch insights');
      return response.json();
    }
  });

  const generateInsightsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/insights-ai/generate");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insights-ai"] });
      toast({
        title: "Insights gerados!",
        description: "Novos insights foram criados com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível gerar novos insights.",
        variant: "destructive",
      });
    },
  });

  const filteredInsights = insights?.filter(insight => 
    categoryFilter === "all" || insight.tipoInsight === categoryFilter
  ) || [];

  const totalInsights = insights?.length || 0;
  const highPriorityInsights = insights?.filter(i => i.relevancia === 'alta').length || 0;
  const totalSavings = insights?.reduce((sum, i) => {
    const valor = i.valorImpacto ? parseFloat(i.valorImpacto) : 0;
    return sum + valor;
  }, 0) || 0;
  const monthlyOpportunity = Math.round(totalSavings / 12);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="space-y-2" data-testid="insights-header">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Zap className="h-6 w-6 text-primary" data-testid="icon-header" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-title">
              Insights Inteligentes
            </h1>
            <p className="text-sm text-muted-foreground" data-testid="text-subtitle">
              Análises personalizadas para otimizar suas finanças
            </p>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <Button 
        onClick={() => generateInsightsMutation.mutate()}
        disabled={generateInsightsMutation.isPending}
        variant="default"
        size="lg"
        data-testid="button-generate-insights"
      >
        <Lightbulb className="h-4 w-4" />
        {generateInsightsMutation.isPending ? "Gerando..." : "Gerar Novos Insights"}
      </Button>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="metrics-grid">
        <MetricCard
          icon={Lightbulb}
          label="Total Insights"
          value={totalInsights}
          subtitle="Disponíveis"
          iconColor="text-blue-600"
          iconBg="bg-blue-600/10"
          valueColor="text-foreground"
          data-testid="metric-total-insights"
        />
        
        <MetricCard
          icon={AlertTriangle}
          label="Alta Prioridade"
          value={highPriorityInsights}
          subtitle="Requer atenção"
          iconColor="text-purple-600"
          iconBg="bg-purple-600/10"
          valueColor="text-foreground"
          data-testid="metric-high-priority"
        />
        
        <MetricCard
          icon={PiggyBank}
          label="Economia Potencial"
          value={`R$ ${totalSavings.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          subtitle="Por ano"
          iconColor="text-blue-600"
          iconBg="bg-blue-600/10"
          valueColor="text-primary"
          className="font-mono"
          data-testid="metric-potential-savings"
        />
        
        <MetricCard
          icon={TrendingUp}
          label="Oportunidades"
          value={`+R$ ${monthlyOpportunity.toLocaleString('pt-BR')}`}
          subtitle="Economia extra/mês"
          iconColor="text-blue-600"
          iconBg="bg-blue-600/10"
          valueColor="text-primary"
          className="font-mono"
          data-testid="metric-opportunities"
        />
      </div>

      {/* Insights List Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl font-semibold" data-testid="text-list-title">
            Todos os Insights
          </h2>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-64" data-testid="select-category-filter">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              <SelectItem value="economia">Economia</SelectItem>
              <SelectItem value="investimento">Investimento</SelectItem>
              <SelectItem value="otimizacao_cartao">Otimização de Cartão</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Insights Grid */}
        {filteredInsights.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="insights-list">
            {filteredInsights.map((insight, index) => {
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
                          <h3 className="font-semibold text-lg mb-1" data-testid={`insight-title-${index}`}>
                            {insight.titulo}
                          </h3>
                          <p className="text-sm text-muted-foreground" data-testid={`insight-description-${index}`}>
                            {insight.descricao}
                          </p>
                        </div>
                        
                        {valorImpacto && valorImpacto > 0 && (
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400" data-testid={`insight-impact-value-${index}`}>
                              R$ {valorImpacto.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                            <span className="text-sm text-muted-foreground">/ano</span>
                          </div>
                        )}
                        
                        {percentualImpacto && percentualImpacto > 0 && (
                          <div className="text-sm">
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400" data-testid={`insight-impact-percent-${index}`}>
                              +{percentualImpacto.toFixed(0)}%
                            </span>
                            <span className="text-muted-foreground ml-1">
                              {insight.tipoInsight === 'investimento' ? 'retorno potencial' : 'economia potencial'}
                            </span>
                          </div>
                        )}

                        {insight.acaoSugerida && (
                          <div className="pt-3 border-t border-border">
                            <p className="text-sm font-medium text-foreground" data-testid={`insight-action-${index}`}>
                              <Lightbulb className="h-4 w-4 inline mr-1 text-amber-500" />
                              {insight.acaoSugerida}
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
          <Card className="p-12" data-testid="insights-empty-state">
            <div className="text-center">
              <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum insight disponível</h3>
              <p className="text-muted-foreground mb-6">
                Continue usando o app para receber sugestões personalizadas
              </p>
              <Button 
                onClick={() => generateInsightsMutation.mutate()}
                disabled={generateInsightsMutation.isPending}
                variant="outline"
                data-testid="button-generate-empty"
              >
                <Lightbulb className="h-4 w-4" />
                Gerar Insights
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
