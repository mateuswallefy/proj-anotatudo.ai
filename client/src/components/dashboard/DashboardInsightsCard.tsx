import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface InsightsOverview {
  topCategory?: {
    name: string;
    amount: number;
    percentageOfTotal: number;
  };
  spendingChange?: {
    diffPercent: number;
    status: 'up' | 'down' | 'flat';
  };
  categoriesOverBudget: Array<{
    category: string;
    spent: number;
    limit: number;
    percent: number;
  }>;
}

interface DashboardInsightsCardProps {
  insights?: InsightsOverview;
  isLoading?: boolean;
}

export function DashboardInsightsCard({ insights, isLoading }: DashboardInsightsCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (isLoading || !insights) {
    return (
      <Card className="p-4 rounded-xl shadow-sm">
        <CardContent className="p-0 space-y-3">
          <Skeleton className="h-6 w-32" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const messages: string[] = [];

  // Top category message
  if (insights.topCategory) {
    messages.push(
      `Seu maior gasto foi com "${insights.topCategory.name}" (${formatCurrency(insights.topCategory.amount)})`
    );
  }

  // Spending change message
  if (insights.spendingChange) {
    const { diffPercent, status } = insights.spendingChange;
    if (status === 'up') {
      messages.push(
        `Você gastou ${Math.abs(diffPercent).toFixed(1)}% mais este mês em comparação ao anterior`
      );
    } else if (status === 'down') {
      messages.push(
        `Você economizou ${Math.abs(diffPercent).toFixed(1)}% este mês em comparação ao anterior`
      );
    }
  }

  // Categories over budget message
  if (insights.categoriesOverBudget.length > 0) {
    const estouradas = insights.categoriesOverBudget.filter(c => c.percent >= 100).length;
    const atencao = insights.categoriesOverBudget.filter(c => c.percent >= 95 && c.percent < 100).length;
    
    if (estouradas > 0 && atencao > 0) {
      messages.push(
        `${estouradas} ${estouradas === 1 ? 'categoria estourou' : 'categorias estouraram'} o orçamento e ${atencao} ${atencao === 1 ? 'está em atenção' : 'estão em atenção'}`
      );
    } else if (estouradas > 0) {
      messages.push(
        `${estouradas} ${estouradas === 1 ? 'categoria estourou' : 'categorias estouraram'} o orçamento`
      );
    } else if (atencao > 0) {
      messages.push(
        `${atencao} ${atencao === 1 ? 'categoria está em atenção' : 'categorias estão em atenção'}`
      );
    }
  } else if (insights.topCategory) {
    messages.push(
      `Você está dentro do orçamento em todas as categorias configuradas`
    );
  }

  if (messages.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 rounded-xl shadow-sm bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-100 dark:border-amber-900/30">
      <CardContent className="p-0 space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-amber-500/10">
            <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-base font-semibold">Insights Rápidos</h3>
        </div>

        <div className="space-y-2">
          {messages.slice(0, 3).map((message, index) => (
            <div
              key={index}
              className="flex items-start gap-2 text-sm text-foreground"
              data-testid={`insight-message-${index}`}
            >
              <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
              <p>{message}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

