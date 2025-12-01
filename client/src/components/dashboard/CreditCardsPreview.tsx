import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CardContainer } from "@/components/design-system/CardContainer";
import { SectionTitle } from "@/components/design-system/SectionTitle";

interface CreditCardPreview {
  id: string;
  nomeCartao: string;
  faturaAtual: number;
  limiteTotal: number;
  percent: number;
  closingDay?: number;
  dueDay?: number;
  status?: 'Tranquilo' | 'Atenção' | 'Alerta';
}

interface CreditCardsPreviewProps {
  cards?: CreditCardPreview[];
  isLoading?: boolean;
  onCreateCard?: () => void;
}

// Mock data function - isolado para fácil substituição
function getMockCards(): CreditCardPreview[] {
  return [];
}

export function CreditCardsPreview({
  cards,
  isLoading = false,
  onCreateCard,
}: CreditCardsPreviewProps) {
  const displayCards = cards && cards.length > 0 ? cards : getMockCards();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Tranquilo':
        return 'bg-[var(--accent-green)]/10 text-[var(--accent-green)] border-[var(--accent-green)]/20';
      case 'Atenção':
        return 'bg-[var(--accent-orange)]/10 text-[var(--accent-orange)] border-[var(--accent-orange)]/20';
      case 'Alerta':
        return 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20';
      default:
        return 'bg-[var(--card-contrast)] text-[var(--text-secondary)] border-[var(--border)]';
    }
  };

  if (isLoading) {
    return (
      <CardContainer className="p-4 md:p-5">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-[300px] rounded-xl flex-shrink-0" />
          ))}
        </div>
      </CardContainer>
    );
  }

  return (
    <CardContainer className="p-4 md:p-5" hover>
      <SectionTitle>Cartões de Crédito</SectionTitle>

      {displayCards.length === 0 ? (
        <div className="text-center py-8">
          <CreditCard className="h-12 w-12 mx-auto mb-3 text-[var(--text-secondary)]" />
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Nenhum cartão cadastrado
          </p>
          <Button
            onClick={onCreateCard}
            variant="outline"
            size="sm"
            className="border-2 border-dashed border-[var(--border)] hover:border-[var(--accent-green)] hover:bg-[var(--accent-green)] hover:text-white dark:border-[var(--border)] dark:hover:border-[var(--accent-green)]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar cartão
          </Button>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible">
          {displayCards.map((card) => {
            const statusColor = getStatusColor(card.status);

            return (
              <CardContainer
                key={card.id}
                className="p-4 flex-shrink-0 w-[300px] md:w-full bg-gradient-to-br from-[var(--card-contrast)] to-[var(--card)]"
                hover
                glow
                glowColor="blue"
                data-testid={`credit-card-${card.id}`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-[var(--accent-blue)]" />
                      <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                        {card.nomeCartao}
                      </h4>
                    </div>
                    {card.status && (
                      <Badge
                        variant="outline"
                        className={`text-xs ${statusColor}`}
                      >
                        {card.status}
                      </Badge>
                    )}
                  </div>

                  <div>
                    <p className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                      {formatCurrency(card.faturaAtual)}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Fatura atual
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="w-full bg-[var(--card-contrast)] rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          card.percent < 30
                            ? 'bg-[var(--accent-green)]'
                            : card.percent < 70
                            ? 'bg-[var(--accent-orange)]'
                            : 'bg-[#EF4444]'
                        }`}
                        style={{ width: `${Math.min(card.percent, 100)}%` }}
                      />
                    </div>
                    {card.closingDay && card.dueDay && (
                      <p className="text-xs text-[var(--text-secondary)]">
                        Fecha dia {card.closingDay} • Vence dia {card.dueDay}
                      </p>
                    )}
                  </div>
                </div>
              </CardContainer>
            );
          })}

          {/* Card para adicionar novo */}
          <CardContainer
            className="p-4 flex-shrink-0 w-[300px] md:w-full border-2 border-dashed"
            hover
            onClick={onCreateCard}
            data-testid="create-credit-card"
          >
            <div className="h-full flex flex-col items-center justify-center py-8 space-y-2">
              <div className="p-3 rounded-full bg-[var(--accent-green)]/10">
                <Plus className="h-5 w-5 text-[var(--accent-green)]" />
              </div>
              <p className="text-sm font-medium text-[var(--text-primary)] text-center">
                Adicionar cartão
              </p>
            </div>
          </CardContainer>
        </div>
      )}
    </CardContainer>
  );
}
