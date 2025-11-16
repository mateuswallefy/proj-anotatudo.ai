import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CreditCard, Target, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";

type Alerta = {
  id: string;
  userId: string;
  tipoAlerta: 'orcamento_excedido' | 'vencimento_fatura' | 'meta_atingida' | 'gasto_acima_media' | 'outro';
  titulo: string;
  descricao: string | null;
  prioridade: 'baixa' | 'media' | 'alta';
  lido: 'sim' | 'nao';
  dataExpiracao: string | null;
  createdAt: string;
};

const getAlertIcon = (tipo: string) => {
  switch (tipo) {
    case 'orcamento_excedido':
      return AlertTriangle;
    case 'vencimento_fatura':
      return CreditCard;
    case 'meta_atingida':
      return Target;
    case 'gasto_acima_media':
      return TrendingUp;
    default:
      return AlertTriangle;
  }
};

const getPrioridadeColor = (prioridade: string) => {
  switch (prioridade) {
    case 'alta':
      return 'bg-red-500/10 text-red-700 dark:text-red-400';
    case 'media':
      return 'bg-orange-500/10 text-orange-700 dark:text-orange-400';
    case 'baixa':
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
    default:
      return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
  }
};

export function AlertasImportantes() {
  const { data: alertas, isLoading } = useQuery<Alerta[]>({
    queryKey: ["/api/alertas"],
    queryFn: async () => {
      const response = await fetch("/api/alertas", { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch alertas');
      return response.json();
    }
  });

  const marcarComoLidoMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/alertas/${id}/ler`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alertas"] });
    },
  });

  if (isLoading) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Alertas Importantes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-16 bg-muted rounded" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!alertas || alertas.length === 0) {
    return null;
  }

  return (
    <div className="mb-6" data-testid="alertas-importantes">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Alertas Importantes</h2>
        <Badge variant="secondary" data-testid="alertas-count">
          {alertas.length} {alertas.length === 1 ? 'alerta' : 'alertas'}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {alertas.map((alerta, index) => {
          const Icon = getAlertIcon(alerta.tipoAlerta);
          const prioridadeColor = getPrioridadeColor(alerta.prioridade);
          
          return (
            <Card
              key={alerta.id}
              className="p-4 hover-elevate active-elevate-2 relative"
              data-testid={`alerta-card-${index}`}
            >
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => marcarComoLidoMutation.mutate(alerta.id)}
                data-testid={`alerta-dismiss-${index}`}
              >
                <X className="h-4 w-4" />
              </Button>
              
              <div className="flex items-start gap-3 pr-8">
                <div className={`p-2 rounded-lg ${prioridadeColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm line-clamp-1">
                      {alerta.titulo}
                    </h3>
                  </div>
                  {alerta.descricao && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {alerta.descricao}
                    </p>
                  )}
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${prioridadeColor}`}
                    data-testid={`alerta-prioridade-${index}`}
                  >
                    {alerta.prioridade === 'alta' ? 'Alta Prioridade' : 
                     alerta.prioridade === 'media' ? 'Média Prioridade' : 
                     'Baixa Prioridade'}
                  </Badge>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
