import { InsightCard } from "@/components/design-system/InsightCard";
import { Lightbulb, TrendingUp, AlertCircle } from "lucide-react";
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

  const getIconForInsight = (title: string) => {
    if (title.toLowerCase().includes("economia") || title.toLowerCase().includes("economizou")) {
      return <TrendingUp className="w-full h-full" />;
    }
    if (title.toLowerCase().includes("gasto") || title.toLowerCase().includes("alimentação")) {
      return <AlertCircle className="w-full h-full" />;
    }
    return <Lightbulb className="w-full h-full" />;
  };

  const getGlowColor = (title: string): "primary" | "secondary" | "green" => {
    if (title.toLowerCase().includes("economia") || title.toLowerCase().includes("economizou")) {
      return "green";
    }
    if (title.toLowerCase().includes("gasto") || title.toLowerCase().includes("alimentação")) {
      return "primary";
    }
    return "secondary";
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:grid md:grid-cols-3 md:overflow-visible md:mx-0">
      {displayInsights.slice(0, 3).map((insight) => (
        <InsightCard
          key={insight.id}
          className="flex-shrink-0 w-[280px] md:w-full"
          icon={getIconForInsight(insight.title)}
          title={insight.title}
          description={insight.description}
          glowColor={getGlowColor(insight.title)}
        />
      ))}
    </div>
  );
}



