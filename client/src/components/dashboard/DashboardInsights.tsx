import { Lightbulb, TrendingUp, AlertCircle, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface Insight {
  id: string;
  emoji?: string;
  title: string;
  description: string;
  type?: "success" | "warning" | "info";
}

interface DashboardInsightsProps {
  insights?: Insight[];
  isLoading?: boolean;
}

export function DashboardInsights({
  insights,
  isLoading = false,
}: DashboardInsightsProps) {
  // Mock insights se não houver dados
  const displayInsights: Insight[] =
    insights ||
    [
      {
        id: "1",
        emoji: "🍽️",
        title: "Alimentação puxando gastos",
        description: "32% das suas despesas foram em Alimentação este mês.",
        type: "warning",
      },
      {
        id: "2",
        emoji: "💰",
        title: "Economia em alta",
        description: "Você economizou R$ 200,00 (5% das suas entradas).",
        type: "success",
      },
      {
        id: "3",
        emoji: "💳",
        title: "Maior gasto identificado",
        description: "Seu maior gasto foi R$ 870,00 em Cartão de Crédito X.",
        type: "info",
      },
    ];

  const getIcon = (insight: Insight) => {
    if (insight.type === "success") return <TrendingUp className="w-5 h-5" />;
    if (insight.type === "warning") return <AlertCircle className="w-5 h-5" />;
    return <Lightbulb className="w-5 h-5" />;
  };

  const getIconColor = (insight: Insight) => {
    if (insight.type === "success") return "text-[#4ADE80]";
    if (insight.type === "warning") return "text-[#FB7185]";
    return "text-[#60A5FA]";
  };

  const getBgColor = (insight: Insight) => {
    if (insight.type === "success") return "bg-[#4ADE80]/10";
    if (insight.type === "warning") return "bg-[#FB7185]/10";
    return "bg-[#60A5FA]/10";
  };

  if (isLoading) {
    return (
      <div className="bg-white/5 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-lg">
        <Skeleton className="h-6 w-40 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#A78BFA]" />
          Insights da sua conta
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayInsights.slice(0, 3).map((insight) => (
          <div
            key={insight.id}
            className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-5 hover:bg-white/20 transition-all duration-300 group"
          >
            <div className="flex items-start gap-3 mb-3">
              <div
                className={`p-2 rounded-lg ${getBgColor(insight)} ${getIconColor(insight)}`}
              >
                {insight.emoji ? (
                  <span className="text-2xl">{insight.emoji}</span>
                ) : (
                  getIcon(insight)
                )}
              </div>
            </div>

            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
              {insight.title}
            </h4>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
              {insight.description}
            </p>

            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Ver detalhes
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}




