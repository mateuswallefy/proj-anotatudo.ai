import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StripeSectionCard } from "@/components/admin/StripeSectionCard";
import { StripeStatusBadge } from "@/components/admin/StripeStatusBadge";
import { StripeEmptyState } from "@/components/admin/StripeEmptyState";
import { WebhookDetailsModal } from "@/components/admin/WebhookDetailsModal";
import { Button } from "@/components/ui/button";
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
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

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

type WebhookGroup = {
  eventId: string;
  eventType: string;
  attempts: WebhookEvent[];
  lastAttempt: WebhookEvent;
  firstAttempt: WebhookEvent;
  successCount: number;
  failureCount: number;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  customerId: string | null;
  subscriptionId: string | null;
};

const WEBHOOK_URL = "https://anotatudo.com/api/webhooks/subscriptions";

export default function AdminWebhooks() {
  const [copied, setCopied] = useState(false);
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: webhookGroups, isLoading, refetch } = useQuery<WebhookGroup[]>({
    queryKey: ["/api/admin/webhooks/grouped"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/webhooks/grouped");
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

  const formatSubscriptionId = (id: string | null): string => {
    if (!id) return "—";
    // Mostrar apenas últimos 6 caracteres
    return id.length > 6 ? `...${id.slice(-6)}` : id;
  };

  const pluralizeSuccess = (n: number): string => {
    return n === 1 ? "1 sucesso" : `${n} sucessos`;
  };

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

      <div className="space-y-6 px-4 max-w-[1200px] mx-auto">
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
        >
          <div className="max-w-[1200px] mx-auto">
            <div className="rounded-lg border bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
              <Table className="w-full table-fixed">
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                    <TableHead className="w-[170px] px-4 py-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium">Evento</TableHead>
                    <TableHead className="w-[200px] px-4 py-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium hidden md:table-cell">E-mail</TableHead>
                    <TableHead className="w-[110px] px-4 py-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium hidden md:table-cell">Assinatura</TableHead>
                    <TableHead className="w-[120px] px-4 py-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium">Status</TableHead>
                    <TableHead className="w-[110px] px-4 py-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium hidden md:table-cell">Tentativas</TableHead>
                    <TableHead className="w-[110px] px-2 py-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium hidden md:table-cell">Último Processamento</TableHead>
                    <TableHead className="w-[90px] px-2 py-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {isLoading && (
                  <>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={`skeleton-${i}`} className="border-b border-gray-100 dark:border-gray-700">
                        <TableCell className="w-[170px] px-4 py-3"><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="w-[200px] px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="w-[110px] px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell className="w-[120px] px-4 py-3"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell className="w-[110px] px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell className="w-[110px] px-2 py-3 hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="w-[90px] px-2 text-center"><Skeleton className="h-8 w-24 mx-auto" /></TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
                {!isLoading && (!webhookGroups || webhookGroups.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <StripeEmptyState
                        icon={Webhook}
                        title="Nenhum webhook recebido"
                        subtitle="Os webhooks aparecerão aqui quando forem recebidos"
                      />
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && webhookGroups && webhookGroups.length > 0 && webhookGroups.map((group) => {
                  const status = group.lastAttempt.status || (group.lastAttempt.processed ? 'processed' : 'pending');
                  const getStatusBadge = () => {
                    if (status === 'processed') {
                      return (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                          <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                          <span className="text-xs font-medium text-green-700 dark:text-green-400">Processado</span>
                        </div>
                      );
                    } else if (status === 'failed') {
                      return (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                          <div className="h-1.5 w-1.5 rounded-full bg-red-500"></div>
                          <span className="text-xs font-medium text-red-700 dark:text-red-400">Falhou</span>
                        </div>
                      );
                    } else {
                      return (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                          <div className="h-1.5 w-1.5 rounded-full bg-orange-500"></div>
                          <span className="text-xs font-medium text-orange-700 dark:text-orange-400">Pendente</span>
                        </div>
                      );
                    }
                  };

                  const customerEmail = group.customerEmail || null;
                  const subscriptionId = formatSubscriptionId(group.subscriptionId);

                  return (
                    <TableRow key={group.eventId} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <TableCell className="w-[170px] px-4 py-3">
                        <span className="font-mono text-sm text-gray-900 dark:text-gray-50">
                          {group.eventType}
                        </span>
                      </TableCell>
                      <TableCell className="w-[200px] px-4 py-3 hidden md:table-cell">
                        {customerEmail ? (
                          <span 
                            className="text-sm text-gray-900 dark:text-gray-50 cursor-text select-text"
                            style={{ cursor: 'text' }}
                          >
                            {customerEmail}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                        )}
                      </TableCell>
                      <TableCell className="w-[110px] px-4 py-3 hidden md:table-cell">
                        <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
                          {subscriptionId}
                        </span>
                      </TableCell>
                      <TableCell className="w-[120px] px-4 py-3">
                        {getStatusBadge()}
                      </TableCell>
                      <TableCell className="w-[110px] px-4 py-3 hidden md:table-cell">
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {pluralizeSuccess(group.successCount)}
                          </span>
                          {group.failureCount > 0 && (
                            <span className="text-xs text-red-600 dark:text-red-400">
                              {group.failureCount} {group.failureCount === 1 ? 'falha' : 'falhas'}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="w-[110px] px-2 py-3 hidden md:table-cell">
                        {group.lastAttempt.processedAt ? (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {format(new Date(group.lastAttempt.processedAt), "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                        )}
                      </TableCell>
                      <TableCell className="w-[90px] px-2 text-center">
                        <div className="flex items-center justify-center gap-1 whitespace-nowrap w-fit mx-auto">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedWebhookId(group.lastAttempt.id)}
                            className="gap-0.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 h-7 px-1.5 text-xs shrink-0 min-w-0"
                          >
                            <Eye className="h-3.5 w-3.5 shrink-0 flex-shrink-0" />
                            <span className="text-xs whitespace-nowrap flex-shrink-0">Detalhes</span>
                          </Button>
                          {status === 'failed' && (
                            <button
                              onClick={() => reprocessMutation.mutate(group.lastAttempt.id)}
                              disabled={reprocessMutation.isPending}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline text-xs disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
                            >
                              {reprocessMutation.isPending ? (
                                <span className="flex items-center gap-0.5">
                                  <RefreshCw className="h-3 w-3 animate-spin shrink-0" />
                                  <span className="text-xs whitespace-nowrap">Reprocessando...</span>
                                </span>
                              ) : (
                                <span className="text-xs whitespace-nowrap">Reprocessar</span>
                              )}
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              </Table>
            </div>
          </div>
        </StripeSectionCard>
      </div>

      {/* Webhook Details Modal */}
      <WebhookDetailsModal
        webhookId={selectedWebhookId}
        onClose={() => setSelectedWebhookId(null)}
      />
    </AdminLayout>
  );
}

