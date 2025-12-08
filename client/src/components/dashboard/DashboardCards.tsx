import { CreditCard as CreditCardComponent } from "./CreditCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import type { CreditCard } from "@/types/financial";

interface DashboardCardsProps {
  cards?: CreditCard[];
  isLoading?: boolean;
  onCreateCard?: () => void;
}

export function DashboardCards({
  cards,
  isLoading = false,
  onCreateCard,
}: DashboardCardsProps) {
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="bg-white/5 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-lg">
        <Skeleton className="h-6 w-48 mb-6" />
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-56 w-[320px] rounded-[20px] flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  const displayCards = cards || [];

  return (
    <div className="bg-white/5 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Cartões de Crédito
        </h3>
        {displayCards.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/cartoes")}
            className="text-xs"
          >
            Ver todos
          </Button>
        )}
      </div>

      {displayCards.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#A78BFA] to-[#60A5FA] flex items-center justify-center">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Nenhum cartão cadastrado
          </p>
          <Button
            onClick={onCreateCard || (() => setLocation("/cartoes/novo"))}
            variant="outline"
            size="sm"
            className="border-2 border-dashed border-white/20 hover:border-[#A78BFA] hover:bg-[#A78BFA]/10"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar cartão
          </Button>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible md:mx-0">
          {displayCards.map((card) => (
            <div key={card.id} className="flex-shrink-0 w-[320px] md:w-full">
              <CreditCardComponent
                id={card.id}
                nomeCartao={card.name}
                faturaAtual={card.currentInvoiceAmount}
                limiteTotal={card.limit}
                percent={card.percent}
                closingDay={card.closingDay}
                dueDay={card.dueDay}
                status={card.status}
              />
            </div>
          ))}

          {/* Add new card button */}
          <div className="flex-shrink-0 w-[320px] md:w-full">
            <button
              onClick={onCreateCard || (() => setLocation("/cartoes/novo"))}
              className="w-full h-full min-h-[224px] rounded-[20px] border-2 border-dashed border-white/20 hover:border-[#A78BFA] hover:bg-[#A78BFA]/5 transition-all duration-300 flex flex-col items-center justify-center gap-3 group"
            >
              <div className="w-12 h-12 rounded-full bg-[#A78BFA]/20 group-hover:bg-[#A78BFA]/30 flex items-center justify-center transition-colors">
                <Plus className="w-6 h-6 text-[#A78BFA] group-hover:text-[#A78BFA]" />
              </div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Adicionar cartão
              </p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}




