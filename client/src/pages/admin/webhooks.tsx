import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StripeSectionCard } from "@/components/admin/StripeSectionCard";
import { StripeStatusBadge } from "@/components/admin/StripeStatusBadge";
import { StripeEmptyState } from "@/components/admin/StripeEmptyState";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Copy, 
  Check, 
  RefreshCw, 
  Eye, 
  Webhook,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type WebhookEvent = {
  id: string;
  event: string;
  type: string;
  payload: any;
  status: 'pending' | 'processed' | 'failed';
  receivedAt: string;
  processedAt: string | null;
  errorMessage: string | null;
  retryCount: number;
  lastRetryAt: string | null;
  processed: boolean;
};

const WEBHOOK_URL = "https://anotatudo.com/api/webhooks/subscriptions";

export default function AdminWebhooks() {
  const [copied, setCopied] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);
  const { toast } = useToast();

  const { data: webhooks, isLoading, refetch } = useQuery<WebhookEvent[]>({
    queryKey: ["/api/admin/webhooks"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/webhooks");
      if (!response.ok) {
        throw new Error("Erro ao carregar webhooks");
      }
      return await response.json();
    },
  });

  const reprocessMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/admin/webhooks/${id}/reprocess`);
      if (!response.ok) {
        throw new Error("Erro ao reprocessar webhook");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Webhook marcado para reprocessamento",
      });
      refetch();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível reprocessar o webhook",
        variant: "destructive",
      });
    },
  });

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(WEBHOOK_URL);
      setCopied(true);
      toast({
        title: "Copiado!",
        description: "URL do webhook copiada para a área de transferência",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar a URL",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout 
      currentPath="/admin/webhooks"
      pageTitle="Webhooks"
      pageSubtitle="Gerencie integrações via webhooks do AnotaTudo.AI."
    >
      <AdminPageHeader
        title="Integração via Webhooks"
        subtitle="Configure e monitore webhooks de plataformas externas"
      />

      <div className="space-y-6">
        {/* Webhook URL Section */}
        <StripeSectionCard>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 uppercase tracking-wide mb-2">
                URL do Webhook
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Use esta URL para configurar webhooks em plataformas externas (Stripe, Chargebee, Hotmart, etc.)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <code className="text-sm font-mono text-gray-900 dark:text-gray-50 break-all">
                  {WEBHOOK_URL}
                </code>
              </div>
              <Button
                onClick={handleCopyUrl}
                variant="outline"
                size="sm"
                className="gap-2 flex-shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
          </div>
        </StripeSectionCard>

        {/* Supported Events */}
        <StripeSectionCard title="Eventos Suportados">
          <div className="space-y-6">
            {/* ASSINATURA Category */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-50 uppercase tracking-wide">
                Assinatura
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-1">
                    subscription_created
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Assinatura criada
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-1">
                    subscription_activated
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Assinatura ativada
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-1">
                    subscription_renewed
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Assinatura renovada
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-1">
                    subscription_expired
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Assinatura expirada
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-1">
                    subscription_canceled
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Assinatura cancelada
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-1">
                    subscription_suspended
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Assinatura suspensa por falta de pagamento
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-1">
                    subscription_reactivated
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Assinatura reativada
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-1">
                    subscription_trial_started
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Teste iniciado
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-1">
                    subscription_trial_ended
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Teste encerrado
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-1">
                    subscription_paused
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Assinatura pausada
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-1">
                    subscription_resumed
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Assinatura retomada
                  </p>
                </div>
              </div>
            </div>

            {/* PAGAMENTO Category */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-50 uppercase tracking-wide">
                Pagamento
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-1">
                    payment_succeeded
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Pagamento confirmado
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-1">
                    payment_failed
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Pagamento falhou
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-1">
                    payment_refunded
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Pagamento estornado
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-1">
                    payment_chargeback
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Chargeback / disputa
                  </p>
                </div>
              </div>
            </div>

            {/* CLIENTE Category */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-50 uppercase tracking-wide">
                Cliente
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-1">
                    customer_created
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Cliente criado
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-1">
                    customer_updated
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Cliente atualizado
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-1">
                    customer_deleted
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Cliente deletado
                  </p>
                </div>
              </div>
            </div>
          </div>
        </StripeSectionCard>

        {/* Webhook Events Table */}
        <StripeSectionCard 
          title="Últimos Webhooks Recebidos"
          className="p-0 overflow-hidden"
        >
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                  <TableHead className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">Evento</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">Status</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">Recebido em</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">Processado em</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">Tentativas</TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={`skeleton-${i}`}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
                {!isLoading && (!webhooks || webhooks.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="p-0">
                      <StripeEmptyState
                        icon={Webhook}
                        title="Nenhum webhook recebido"
                        subtitle="Os webhooks aparecerão aqui quando forem recebidos"
                      />
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && webhooks && webhooks.length > 0 && webhooks.map((webhook) => {
                  const status = webhook.status || (webhook.processed ? 'processed' : 'pending');
                  const getStatusBadge = () => {
                    if (status === 'processed') {
                      return (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">Processado</span>
                        </div>
                      );
                    } else if (status === 'failed') {
                      return (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-500"></div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">Falhou</span>
                        </div>
                      );
                    } else {
                      return (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">Pendente</span>
                        </div>
                      );
                    }
                  };

                  return (
                    <TableRow key={webhook.id}>
                      <TableCell>
                        <span className="font-mono text-sm text-gray-900 dark:text-gray-50">
                          {webhook.event || webhook.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge()}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {format(new Date(webhook.receivedAt), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </span>
                      </TableCell>
                      <TableCell>
                        {webhook.processedAt ? (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {format(new Date(webhook.processedAt), "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {webhook.retryCount || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedEvent(webhook)}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Ver Payload
                          </Button>
                          {status !== 'processed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => reprocessMutation.mutate(webhook.id)}
                              disabled={reprocessMutation.isPending}
                              className="gap-2"
                            >
                              <RefreshCw className={`h-4 w-4 ${reprocessMutation.isPending ? 'animate-spin' : ''}`} />
                              Reprocessar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </StripeSectionCard>
      </div>

      {/* Payload Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Payload do Webhook</DialogTitle>
            <DialogDescription>
              Dados completos recebidos do webhook
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] mt-4">
            <pre className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-xs overflow-auto">
              {JSON.stringify(selectedEvent?.payload || {}, null, 2)}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

