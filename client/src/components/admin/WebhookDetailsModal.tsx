import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Copy, Check, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type WebhookLog = {
  id: string;
  webhookEventId: string;
  timestamp: string;
  step: string;
  payload: any;
  error: string | null;
  level: 'info' | 'warning' | 'error';
};

type WebhookDetails = {
  id: string;
  event: string;
  type: string;
  status: 'pending' | 'processed' | 'failed';
  payload: any;
  logs: WebhookLog[];
  headers: Record<string, string> | null;
  retryCount: number;
  createdAt: string;
  processedAt: string | null;
  lastRetryAt: string | null;
  errorMessage: string | null;
  eventId: string | null;
  subscriptionId: string | null;
  providerSubscriptionId: string | null;
  attempts: Array<{
    id: string;
    status: 'pending' | 'processed' | 'failed';
    receivedAt: string;
    processedAt: string | null;
    errorMessage: string | null;
    retryCount: number;
  }>;
};

interface WebhookDetailsModalProps {
  webhookId: string | null;
  onClose: () => void;
}

export function WebhookDetailsModal({ webhookId, onClose }: WebhookDetailsModalProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const { data: webhookDetails, isLoading } = useQuery<WebhookDetails>({
    queryKey: ["/api/admin/webhooks", webhookId],
    queryFn: async () => {
      if (!webhookId) throw new Error("Webhook ID is required");
      const response = await apiRequest("GET", `/api/admin/webhooks/${webhookId}`);
      if (!response.ok) {
        throw new Error("Erro ao carregar detalhes do webhook");
      }
      return await response.json();
    },
    enabled: !!webhookId,
  });

  const handleCopyJson = async () => {
    if (!webhookDetails?.payload) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(webhookDetails.payload, null, 2));
      setCopied(true);
      toast({
        title: "Copiado!",
        description: "JSON copiado para a área de transferência",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o JSON",
        variant: "destructive",
      });
    }
  };

  const formatSubscriptionId = (id: string | null): string => {
    if (!id) return "—";
    if (id.length > 8) {
      return `${id.slice(0, 4)}...${id.slice(-4)}`;
    }
    return id;
  };

  const getStatusBadge = (status: string) => {
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

  if (!webhookId) return null;

  return (
    <Dialog open={!!webhookId} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-2xl font-bold">Detalhes do Webhook</DialogTitle>
          <DialogDescription className="sr-only">
            Detalhes completos do webhook selecionado.
          </DialogDescription>
          <div className="space-y-1 pt-2">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-48" />
              </div>
            ) : webhookDetails ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                    Evento: <span className="font-semibold text-gray-900 dark:text-gray-50">{webhookDetails.event}</span>
                  </span>
                </div>
                {webhookDetails.providerSubscriptionId && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                      Assinatura: <span className="font-semibold text-gray-900 dark:text-gray-50">{formatSubscriptionId(webhookDetails.providerSubscriptionId)}</span>
                    </span>
                  </div>
                )}
                {webhookDetails.processedAt && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Processado em: <span className="font-semibold text-gray-900 dark:text-gray-50">
                        {format(new Date(webhookDetails.processedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </span>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 overflow-auto space-y-4 py-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : webhookDetails ? (
          <Tabs defaultValue="payload" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="payload">Payload</TabsTrigger>
              <TabsTrigger value="metadata">Metadados</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="attempts">Tentativas</TabsTrigger>
              <TabsTrigger value="headers">Headers</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto mt-4">
              {/* Payload Tab */}
              <TabsContent value="payload" className="mt-0 space-y-4">
                <div className="relative">
                  <div className="absolute top-2 right-2 z-10">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyJson}
                      className="gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copiar JSON
                        </>
                      )}
                    </Button>
                  </div>
                  <ScrollArea className="h-[60vh]">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-auto">
                      <code>{JSON.stringify(webhookDetails.payload, null, 2)}</code>
                    </pre>
                  </ScrollArea>
                </div>
              </TabsContent>

              {/* Metadados Tab */}
              <TabsContent value="metadata" className="mt-0">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                        Webhook ID
                      </div>
                      <div className="text-sm font-mono text-gray-900 dark:text-gray-50 break-all">
                        {webhookDetails.id}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                        Event ID
                      </div>
                      <div className="text-sm font-mono text-gray-900 dark:text-gray-50 break-all">
                        {webhookDetails.eventId || "—"}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                        Event Type
                      </div>
                      <div className="text-sm font-mono text-gray-900 dark:text-gray-50">
                        {webhookDetails.event}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                        Status
                      </div>
                      <div>
                        {getStatusBadge(webhookDetails.status)}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                        Provider Subscription ID (abreviado)
                      </div>
                      <div className="text-sm font-mono text-gray-900 dark:text-gray-50">
                        {formatSubscriptionId(webhookDetails.providerSubscriptionId)}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                        Provider Subscription ID (completo)
                      </div>
                      <div className="text-sm font-mono text-gray-900 dark:text-gray-50 break-all">
                        {webhookDetails.providerSubscriptionId || "—"}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                        User ID
                      </div>
                      <div className="text-sm font-mono text-gray-900 dark:text-gray-50 break-all">
                        {webhookDetails.subscriptionId || "—"}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                        Retry Count
                      </div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                        {webhookDetails.retryCount}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                        Criado em
                      </div>
                      <div className="text-sm text-gray-900 dark:text-gray-50">
                        {format(new Date(webhookDetails.createdAt), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                        Processado em
                      </div>
                      <div className="text-sm text-gray-900 dark:text-gray-50">
                        {webhookDetails.processedAt 
                          ? format(new Date(webhookDetails.processedAt), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })
                          : "—"}
                      </div>
                    </div>
                    {webhookDetails.lastRetryAt && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                          Última Tentativa
                        </div>
                        <div className="text-sm text-gray-900 dark:text-gray-50">
                          {format(new Date(webhookDetails.lastRetryAt), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Logs Tab */}
              <TabsContent value="logs" className="mt-0">
                <ScrollArea className="h-[60vh]">
                  {webhookDetails.logs && webhookDetails.logs.length > 0 ? (
                    <ul className="space-y-3">
                      {webhookDetails.logs.map((log) => (
                        <li
                          key={log.id}
                          className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className="font-mono text-xs opacity-70 mb-2">
                            [{format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}] — {log.level.toUpperCase()}
                          </div>
                          <div className="font-semibold text-gray-900 dark:text-gray-50 mb-2">
                            {log.step}
                          </div>
                          {log.payload && (
                            <pre className="bg-gray-900 text-gray-100 p-2 mt-2 rounded overflow-auto text-xs font-mono">
                              <code>{JSON.stringify(log.payload, null, 2)}</code>
                            </pre>
                          )}
                          {log.error && (
                            <div className="text-red-600 dark:text-red-400 mt-2 text-sm">
                              {log.error}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                      <p>Nenhum log disponível</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* Tentativas Tab */}
              <TabsContent value="attempts" className="mt-0">
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                    Total de Tentativas: {webhookDetails.attempts.length}
                  </div>
                </div>
                <ScrollArea className="h-[55vh]">
                  <div className="space-y-2">
                    {webhookDetails.attempts.map((attempt, index) => (
                      <div
                        key={attempt.id}
                        className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                              Tentativa {index + 1}
                            </span>
                            {getStatusBadge(attempt.status)}
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {format(new Date(attempt.receivedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        {attempt.errorMessage && (
                          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-700 dark:text-red-400">
                            {attempt.errorMessage}
                          </div>
                        )}
                        {attempt.processedAt && (
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Processado em: {format(new Date(attempt.processedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Headers Tab */}
              <TabsContent value="headers" className="mt-0">
                <ScrollArea className="h-[60vh]">
                  {webhookDetails.headers && Object.keys(webhookDetails.headers).length > 0 ? (
                    <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-sm font-mono overflow-auto">
                      <code>{JSON.stringify(webhookDetails.headers, null, 2)}</code>
                    </pre>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                      <p>Nenhum header disponível</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

