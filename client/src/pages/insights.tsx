import { useQuery, useMutation } from "@tanstack/react-query";
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
import { PageHeader, PremiumButton, AppCard, SectionTitle, DataBadge } from "@/components/design-system";

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
      <div className="min-h-screen bg-background">
        <div className="space-y-8 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <Skeleton className="h-10 w-64 mb-2 rounded-2xl" />
          <Skeleton className="h-4 w-96 rounded-2xl" />
          <Skeleton className="h-12 w-64 rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-12 w-full rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-8 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Premium Header */}
        <PageHeader
          title="Insights Inteligentes"
          subtitle="Análises personalizadas para otimizar suas finanças"
          action={
            <PremiumButton
              size="lg"
              onClick={() => generateInsightsMutation.mutate()}
              disabled={generateInsightsMutation.isPending}
              data-testid="button-generate-insights"
            >
              <Lightbulb className="h-5 w-5 mr-2" />
              {generateInsightsMutation.isPending ? "Gerando..." : "Gerar Novos Insights"}
            </PremiumButton>
          }
        />

        {/* Metrics Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6" data-testid="metrics-grid">
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
          iconColor="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-500/10"
          valueColor="text-emerald-600 dark:text-emerald-400"
          className="font-mono"
          data-testid="metric-potential-savings"
        />
        
        <MetricCard
          icon={TrendingUp}
          label="Oportunidades"
          value={`+R$ ${monthlyOpportunity.toLocaleString('pt-BR')}`}
          subtitle="Economia extra/mês"
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-500/10"
          valueColor="text-blue-600 dark:text-blue-400"
          className="font-mono"
          data-testid="metric-opportunities"
        />
      </div>

        {/* Insights List Section */}
        <div className="space-y-6">
          <SectionTitle
            title="Todos os Insights"
            subtitle={`${filteredInsights.length} ${filteredInsights.length === 1 ? 'insight' : 'insights'}`}
            action={
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-64 h-10 rounded-xl border-2" data-testid="select-category-filter">
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
            }
          />

          {/* Insights Grid */}
          {filteredInsights.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="insights-list">
              {filteredInsights.map((insight, index) => {
                const Icon = getInsightIcon(insight.tipoInsight);
                const valorImpacto = insight.valorImpacto ? parseFloat(insight.valorImpacto) : null;
                const percentualImpacto = insight.percentualImpacto ? parseFloat(insight.percentualImpacto) : null;
                
                const borderAccent = insight.relevancia === 'alta' 
                  ? 'purple' 
                  : insight.relevancia === 'media' 
                    ? 'blue' 
                    : 'none';
                
                return (
                  <AppCard
                    key={insight.id}
                    className="p-5 md:p-6"
                    borderAccent={borderAccent}
                    hover
                    data-testid={`insight-card-${index}`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-7 w-7 text-primary" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-semibold text-base md:text-lg" data-testid={`insight-title-${index}`}>
                              {insight.titulo}
                            </h3>
                            <DataBadge
                              variant={insight.relevancia === 'alta' ? 'default' : 'outline'}
                              color={
                                insight.relevancia === 'alta' ? 'hsl(262, 83%, 58%)' :
                                insight.relevancia === 'media' ? 'hsl(217, 91%, 60%)' :
                                'hsl(var(--muted-foreground))'
                              }
                            >
                              {insight.relevancia === 'alta' ? 'Alta' : insight.relevancia === 'media' ? 'Média' : 'Baixa'}
                            </DataBadge>
                          </div>
                          <p className="text-sm text-muted-foreground" data-testid={`insight-description-${index}`}>
                            {insight.descricao}
                          </p>
                        </div>
                      </div>
                      
                      {valorImpacto && valorImpacto > 0 && (
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl md:text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400" data-testid={`insight-impact-value-${index}`}>
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
                        <div className="pt-3 border-t border-border/50">
                          <p className="text-sm font-medium text-foreground flex items-start gap-2" data-testid={`insight-action-${index}`}>
                            <Lightbulb className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                            <span>{insight.acaoSugerida}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </AppCard>
                );
              })}
            </div>
          ) : (
            <AppCard className="p-12 md:p-16" data-testid="insights-empty-state">
              <div className="text-center">
                <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Lightbulb className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Nenhum insight disponível</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Continue usando o app para receber sugestões personalizadas
                </p>
                <PremiumButton 
                  onClick={() => generateInsightsMutation.mutate()}
                  disabled={generateInsightsMutation.isPending}
                  variant="outline"
                  data-testid="button-generate-empty"
                >
                  <Lightbulb className="h-5 w-5 mr-2" />
                  Gerar Insights
                </PremiumButton>
              </div>
            </AppCard>
          )}
        </div>
      </div>
    </div>
  );
}
