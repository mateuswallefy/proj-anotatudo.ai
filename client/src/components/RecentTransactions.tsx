import { CardContainer } from "@/components/design-system/CardContainer";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { Transacao } from "@shared/schema";

interface RecentTransactionsProps {
  transacoes: Transacao[];
}

export function RecentTransactions({ transacoes }: RecentTransactionsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  // Get last transactions
  const recentTransactions = transacoes.slice(0, 10);

  return (
    <CardContainer className="p-4 md:p-5" hover>
      {recentTransactions.length > 0 ? (
        <div className="space-y-3">
          {recentTransactions.map((transacao) => (
            <div
              key={transacao.id}
              className="flex items-center justify-between p-3 rounded-lg bg-[var(--card-contrast)] hover:bg-[var(--card-contrast)]/80 transition-all duration-200"
              data-testid={`transaction-${transacao.id}`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  transacao.tipo === 'entrada' 
                    ? 'bg-[var(--accent-green)]/10' 
                    : 'bg-[var(--accent-orange)]/10'
                }`}>
                  {transacao.tipo === 'entrada' ? (
                    <TrendingUp className="h-4 w-4 text-[var(--accent-green)]" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-[var(--accent-orange)]" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    {transacao.descricao || transacao.categoria}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-[var(--text-secondary)]">
                      {formatDate(transacao.dataReal)}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {transacao.categoria}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold font-mono ${
                  transacao.tipo === 'entrada' ? 'text-[var(--accent-green)]' : 'text-[var(--accent-orange)]'
                }`}>
                  {transacao.tipo === 'entrada' ? '+' : '-'}
                  {formatCurrency(parseFloat(transacao.valor))}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {transacao.origem}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-[200px] flex items-center justify-center text-[var(--text-secondary)]">
          Nenhuma transação encontrada
        </div>
      )}
    </CardContainer>
  );
}
