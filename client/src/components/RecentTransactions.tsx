import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  // Get last 10 transactions
  const recentTransactions = transacoes.slice(0, 10);

  return (
    <Card className="h-full" data-testid="card-recent-transactions">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Últimas transações</CardTitle>
      </CardHeader>
      <CardContent>
        {recentTransactions.length > 0 ? (
          <div className="space-y-4">
            {recentTransactions.map((transacao) => (
              <div
                key={transacao.id}
                className="flex items-center justify-between p-3 rounded-lg hover-elevate transition-all"
                data-testid={`transaction-${transacao.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    transacao.tipo === 'entrada' 
                      ? 'bg-chart-1/10' 
                      : 'bg-destructive/10'
                  }`}>
                    {transacao.tipo === 'entrada' ? (
                      <TrendingUp className="h-4 w-4 text-chart-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {transacao.descricao || transacao.categoria}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">
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
                    transacao.tipo === 'entrada' ? 'text-chart-1' : 'text-destructive'
                  }`}>
                    {transacao.tipo === 'entrada' ? '+' : '-'}
                    {formatCurrency(parseFloat(transacao.valor))}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {transacao.origem}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            Nenhuma transação encontrada
          </div>
        )}
      </CardContent>
    </Card>
  );
}
