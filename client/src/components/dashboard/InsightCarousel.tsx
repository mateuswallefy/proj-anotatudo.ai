import { CardContainer } from "@/components/design-system/CardContainer";
import { Lightbulb } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Insight {
  id: string;
  emoji: string;
  title: string;
  description: string;
}

interface InsightCarouselProps {
  insights?: Insight[];
  isLoading?: boolean;
}

// Mock data function - isolado para fácil substituição
function getMockInsights(): Insight[] {
  return [
    {
      id: "1",
      emoji: "🍽️",
      title: "Alimentação puxando gastos",
      description: "32% das suas despesas foram em Alimentação este mês.",
    },
    {
      id: "2",
      emoji: "💰",
      title: "Economia em alta",
      description: "Você economizou R$ 200,00 (5% das suas entradas).",
    },
    {
      id: "3",
      emoji: "💳",
      title: "Maior gasto identificado",
      description: "Seu maior gasto foi R$ 870,00 em Cartão de Crédito X.",
    },
  ];
}

export function InsightCarousel({
  insights,
  isLoading = false,
}: InsightCarouselProps) {
  const displayInsights = insights && insights.length > 0 ? insights : getMockInsights();

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:grid md:grid-cols-3 md:overflow-visible md:mx-0">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-[280px] rounded-xl flex-shrink-0 md:w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:grid md:grid-cols-3 md:overflow-visible md:mx-0">
      {displayInsights.slice(0, 3).map((insight) => (
        <CardContainer
          key={insight.id}
          className="p-4 flex-shrink-0 w-[280px] md:w-full hover-elevate"
          hover
          glow
          glowColor="blue"
        >
          <div className="space-y-2">
            <div className="text-2xl mb-1">{insight.emoji}</div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">
              {insight.title}
            </h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {insight.description}
            </p>
          </div>
        </CardContainer>
      ))}
    </div>
  );
}

