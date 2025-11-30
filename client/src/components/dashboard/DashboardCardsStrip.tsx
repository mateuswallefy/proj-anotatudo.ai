import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Cartao } from "@shared/schema";

interface CardWithInvoice extends Cartao {
  faturaAtual: string;
  percent: string;
  status: 'Tranquilo' | 'Atenção' | 'Alerta';
  closingDay: number;
  dueDay: number;
}

interface DashboardCardsStripProps {
  cards?: CardWithInvoice[];
  isLoading?: boolean;
  onCreateCard?: () => void;
}

export function DashboardCardsStrip({
  cards = [],
  isLoading,
  onCreateCard,
}: DashboardCardsStripProps) {
  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const getStatusColor = (status: 'Tranquilo' | 'Atenção' | 'Alerta') => {
    switch (status) {
      case 'Tranquilo':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900';
      case 'Atenção':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900';
      case 'Alerta':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900';
      default:
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide -mx-4 px-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-40 w-[300px] rounded-xl flex-shrink-0" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold px-1">Cartões de Crédito</h3>
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide -mx-4 px-4">
        {cards.map((card) => {
          const faturaAtual = parseFloat(card.faturaAtual || '0');
          const limiteTotal = parseFloat(card.limiteTotal || '0');
          const percent = parseFloat(card.percent || '0');
          const statusColor = getStatusColor(card.status);

          return (
            <Card
              key={card.id}
              className="p-4 rounded-xl shadow-sm bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700 flex-shrink-0 w-[300px] hover-elevate"
              data-testid={`card-item-${card.id}`}
            >
              <CardContent className="p-0 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      <h4 className="text-sm font-semibold truncate">{card.nomeCartao}</h4>
                    </div>
                    {card.last4 && (
                      <p className="text-xs text-muted-foreground">
                        •••• {card.last4}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className={`text-xs ${statusColor}`}>
                    {card.status}
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">
                    Fatura atual: {formatCurrency(faturaAtual)} de {formatCurrency(limiteTotal)} ({percent.toFixed(1)}%)
                  </p>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        percent < 30
                          ? 'bg-emerald-500'
                          : percent < 70
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>Fechamento: dia {card.closingDay}</span>
                  <span>Vencimento: dia {card.dueDay}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Card de adicionar cartão */}
        <Card
          className="p-4 rounded-xl shadow-sm border-2 border-dashed border-muted-foreground/30 flex-shrink-0 w-[300px] hover:border-primary/50 transition-colors cursor-pointer"
          onClick={onCreateCard}
          data-testid="create-card-card"
        >
          <CardContent className="p-0 h-full flex flex-col items-center justify-center space-y-2">
            <div className="p-3 rounded-full bg-primary/10">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium text-center">Adicionar cartão</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

