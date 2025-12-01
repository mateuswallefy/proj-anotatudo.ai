import { Lightbulb } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CardContainer } from "@/components/design-system/CardContainer";
import { SectionTitle } from "@/components/design-system/SectionTitle";
import { InsightCarousel } from "./InsightCarousel";

interface Insight {
  id: string;
  emoji: string;
  title: string;
  description: string;
}

interface InsightsPreviewProps {
  insights?: Insight[];
  isLoading?: boolean;
}

export function InsightsPreview({
  insights,
  isLoading = false,
}: InsightsPreviewProps) {
  if (isLoading) {
    return (
      <CardContainer className="p-4 md:p-5">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-[280px] rounded-xl flex-shrink-0" />
          ))}
        </div>
      </CardContainer>
    );
  }

  return (
    <CardContainer className="p-4 md:p-5" hover>
      <SectionTitle>Insights da sua conta</SectionTitle>
      <InsightCarousel insights={insights} isLoading={false} />
    </CardContainer>
  );
}
