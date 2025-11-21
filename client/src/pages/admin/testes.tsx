import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StripeSectionCard } from "@/components/admin/StripeSectionCard";
import { PremiumButton } from "@/components/design-system/PremiumButton";
import { PremiumInput } from "@/components/design-system/PremiumInput";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, 
  Calendar, 
  CreditCard, 
  X, 
  Check, 
  RotateCcw, 
  Send,
  AlertTriangle,
} from "lucide-react";

type User = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
};

type Subscription = {
  id: string;
  planName: string;
  status: string;
  currentPeriodEnd?: string;
  provider: string;
};

export default function AdminTestes() {
  const { toast } = useToast();
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string>("");
  const [customWebhookPayload, setCustomWebhookPayload] = useState<string>("");
  const [showCustomWebhook, setShowCustomWebhook] = useState(false);

  // Buscar clientes
  const { data: clientsData } = useQuery<{ items: User[] }>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/users?limit=1000");
      return await response.json();
    },
  });

  // Buscar assinaturas do cliente selecionado
  const { data: subscriptionsData, refetch: refetchSubscriptions } = useQuery<Subscription[]>({
    queryKey: ["/api/admin/subscriptions", selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return [];
      const response = await apiRequest("GET", `/api/admin/users/${selectedClientId}/subscriptions`);
      return await response.json();
    },
    enabled: !!selectedClientId,
  });

  // Criar assinatura fake
  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: { clientId: string; planName: string; status: string }) => {
      const response = await apiRequest("POST", "/api/admin/test/subscription", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Assinatura de teste criada com sucesso!",
      });
      refetchSubscriptions();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar assinatura de teste",
        variant: "destructive",
      });
    },
  });

  // Avançar validade
  const advanceMutation = useMutation({
    mutationFn: async (data: { subscriptionId: string; days: number }) => {
      const response = await apiRequest("POST", "/api/admin/test/advance", data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sucesso!",
        description: `Validade avançada! Nova data: ${new Date(data.newEndDate).toLocaleDateString('pt-BR')}`,
      });
      refetchSubscriptions();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao avançar validade",
        variant: "destructive",
      });
    },
  });

  // Simular pagamento
  const paymentMutation = useMutation({
    mutationFn: async (data: { subscriptionId: string; type: string; amount?: number }) => {
      const response = await apiRequest("POST", "/api/admin/test/payment", data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sucesso!",
        description: `Pagamento ${data.message} simulado com sucesso!`,
      });
      refetchSubscriptions();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao simular pagamento",
        variant: "destructive",
      });
    },
  });

  // Enviar webhook customizado
  const webhookMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await apiRequest("POST", "/api/admin/test/webhook", payload);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Webhook customizado enviado com sucesso!",
      });
      setShowCustomWebhook(false);
      setCustomWebhookPayload("");
      refetchSubscriptions();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar webhook customizado",
        variant: "destructive",
      });
    },
  });

  // Cancelar assinatura
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const payload = {
        event: "subscription_canceled",
        data: {
          subscription: {
            id: subscriptionsData?.find(s => s.id === subscriptionId)?.provider === 'caktos' 
              ? subscriptionsData.find(s => s.id === subscriptionId)?.id 
              : `test_${subscriptionId}`,
            status: "canceled",
          },
        },
      };
      const response = await apiRequest("POST", "/api/admin/test/webhook", payload);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Assinatura cancelada com sucesso!",
      });
      refetchSubscriptions();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao cancelar assinatura",
        variant: "destructive",
      });
    },
  });

  // Reativar assinatura
  const reactivateSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const payload = {
        event: "subscription_resumed",
        data: {
          subscription: {
            id: subscriptionsData?.find(s => s.id === subscriptionId)?.provider === 'caktos'
              ? subscriptionsData.find(s => s.id === subscriptionId)?.id
              : `test_${subscriptionId}`,
            status: "active",
          },
        },
      };
      const response = await apiRequest("POST", "/api/admin/test/webhook", payload);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Assinatura reativada com sucesso!",
      });
      refetchSubscriptions();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao reativar assinatura",
        variant: "destructive",
      });
    },
  });

  const handleCreateSubscription = () => {
    if (!selectedClientId) {
      toast({
        title: "Atenção",
        description: "Selecione um cliente primeiro",
        variant: "destructive",
      });
      return;
    }
    createSubscriptionMutation.mutate({
      clientId: selectedClientId,
      planName: "Premium Test",
      status: "active",
    });
  };

  const handleStartTrial = () => {
    if (!selectedClientId) {
      toast({
        title: "Atenção",
        description: "Selecione um cliente primeiro",
        variant: "destructive",
      });
      return;
    }
    createSubscriptionMutation.mutate({
      clientId: selectedClientId,
      planName: "Premium Trial",
      status: "trial",
    });
  };

  const handleEndTrial = () => {
    if (!selectedSubscriptionId) {
      toast({
        title: "Atenção",
        description: "Selecione uma assinatura primeiro",
        variant: "destructive",
      });
      return;
    }
    advanceMutation.mutate({
      subscriptionId: selectedSubscriptionId,
      days: -1, // Retroceder 1 dia para expirar
    });
  };

  const handleSendCustomWebhook = () => {
    try {
      const payload = JSON.parse(customWebhookPayload);
      webhookMutation.mutate(payload);
    } catch (error) {
      toast({
        title: "Erro",
        description: "JSON inválido. Verifique a sintaxe.",
        variant: "destructive",
      });
    }
  };

  const selectedClient = clientsData?.items?.find(c => c.id === selectedClientId);
  const selectedSubscription = subscriptionsData?.find(s => s.id === selectedSubscriptionId);

  return (
    <AdminLayout 
      currentPath="/admin/testes"
      pageTitle="Testes"
      pageSubtitle="Sistema de testes internos para simular webhooks e eventos"
    >
      <AdminPageHeader
        title="Testes Internos"
        subtitle="Simule webhooks, pagamentos, cancelamentos e renovações sem depender da Cakto"
      />

      <div className="space-y-6">
        {/* Seleção de Cliente e Assinatura */}
        <StripeSectionCard>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Seleção</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={selectedClientId} onValueChange={(value) => {
                  setSelectedClientId(value);
                  setSelectedSubscriptionId(""); // Reset subscription when client changes
                }}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientsData?.items?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.email} {client.firstName ? `(${client.firstName} ${client.lastName || ''})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedClient && (
                  <p className="text-sm text-muted-foreground">
                    Cliente selecionado: {selectedClient.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Assinatura</Label>
                <Select 
                  value={selectedSubscriptionId} 
                  onValueChange={setSelectedSubscriptionId}
                  disabled={!selectedClientId}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Selecione uma assinatura" />
                  </SelectTrigger>
                  <SelectContent>
                    {subscriptionsData?.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.planName} - {sub.status} ({sub.provider})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSubscription && (
                  <p className="text-sm text-muted-foreground">
                    Status: {selectedSubscription.status} | 
                    {selectedSubscription.currentPeriodEnd 
                      ? ` Válida até: ${new Date(selectedSubscription.currentPeriodEnd).toLocaleDateString('pt-BR')}`
                      : ' Sem data de validade'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </StripeSectionCard>

        {/* Ações de Assinatura */}
        <StripeSectionCard>
          <h3 className="text-lg font-semibold mb-4">Ações de Assinatura</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <PremiumButton
              onClick={handleCreateSubscription}
              disabled={!selectedClientId || createSubscriptionMutation.isPending}
              variant="outline"
            >
              <Play className="h-4 w-4 mr-2" />
              Criar Assinatura Fake
            </PremiumButton>

            <PremiumButton
              onClick={handleStartTrial}
              disabled={!selectedClientId || createSubscriptionMutation.isPending}
              variant="outline"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Iniciar Trial
            </PremiumButton>

            <PremiumButton
              onClick={handleEndTrial}
              disabled={!selectedSubscriptionId || advanceMutation.isPending}
              variant="outline"
            >
              <X className="h-4 w-4 mr-2" />
              Encerrar Trial
            </PremiumButton>

            <PremiumButton
              onClick={() => {
                if (!selectedSubscriptionId) {
                  toast({
                    title: "Atenção",
                    description: "Selecione uma assinatura primeiro",
                    variant: "destructive",
                  });
                  return;
                }
                cancelSubscriptionMutation.mutate(selectedSubscriptionId);
              }}
              disabled={!selectedSubscriptionId || cancelSubscriptionMutation.isPending}
              variant="outline"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar Assinatura
            </PremiumButton>

            <PremiumButton
              onClick={() => {
                if (!selectedSubscriptionId) {
                  toast({
                    title: "Atenção",
                    description: "Selecione uma assinatura primeiro",
                    variant: "destructive",
                  });
                  return;
                }
                reactivateSubscriptionMutation.mutate(selectedSubscriptionId);
              }}
              disabled={!selectedSubscriptionId || reactivateSubscriptionMutation.isPending}
              variant="outline"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reativar Assinatura
            </PremiumButton>

            <PremiumButton
              onClick={() => {
                if (!selectedSubscriptionId) {
                  toast({
                    title: "Atenção",
                    description: "Selecione uma assinatura primeiro",
                    variant: "destructive",
                  });
                  return;
                }
                advanceMutation.mutate({
                  subscriptionId: selectedSubscriptionId,
                  days: 7,
                });
              }}
              disabled={!selectedSubscriptionId || advanceMutation.isPending}
              variant="outline"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Avançar +7 dias
            </PremiumButton>

            <PremiumButton
              onClick={() => {
                if (!selectedSubscriptionId) {
                  toast({
                    title: "Atenção",
                    description: "Selecione uma assinatura primeiro",
                    variant: "destructive",
                  });
                  return;
                }
                advanceMutation.mutate({
                  subscriptionId: selectedSubscriptionId,
                  days: 30,
                });
              }}
              disabled={!selectedSubscriptionId || advanceMutation.isPending}
              variant="outline"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Avançar +30 dias
            </PremiumButton>

            <Dialog open={showCustomWebhook} onOpenChange={setShowCustomWebhook}>
              <DialogTrigger asChild>
                <PremiumButton variant="outline">
                  <Send className="h-4 w-4 mr-2" />
                  Webhook Customizado
                </PremiumButton>
              </DialogTrigger>
              <DialogContent className="max-w-2xl rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Enviar Webhook Customizado</DialogTitle>
                  <DialogDescription>
                    Envie um payload JSON customizado para simular qualquer webhook da Cakto
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Payload JSON</Label>
                    <Textarea
                      value={customWebhookPayload}
                      onChange={(e) => setCustomWebhookPayload(e.target.value)}
                      placeholder='{"event": "subscription_created", "data": {...}}'
                      className="font-mono text-sm min-h-[300px]"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <PremiumButton
                      variant="outline"
                      onClick={() => {
                        setShowCustomWebhook(false);
                        setCustomWebhookPayload("");
                      }}
                    >
                      Cancelar
                    </PremiumButton>
                    <PremiumButton
                      onClick={handleSendCustomWebhook}
                      disabled={!customWebhookPayload || webhookMutation.isPending}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Enviar
                    </PremiumButton>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </StripeSectionCard>

        {/* Ações de Pagamento */}
        <StripeSectionCard>
          <h3 className="text-lg font-semibold mb-4">Simular Pagamentos</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <PremiumButton
              onClick={() => {
                if (!selectedSubscriptionId) {
                  toast({
                    title: "Atenção",
                    description: "Selecione uma assinatura primeiro",
                    variant: "destructive",
                  });
                  return;
                }
                paymentMutation.mutate({
                  subscriptionId: selectedSubscriptionId,
                  type: "payment_succeeded",
                });
              }}
              disabled={!selectedSubscriptionId || paymentMutation.isPending}
              variant="outline"
              className="border-green-500 text-green-600 hover:bg-green-50"
            >
              <Check className="h-4 w-4 mr-2" />
              Pagamento Aprovado
            </PremiumButton>

            <PremiumButton
              onClick={() => {
                if (!selectedSubscriptionId) {
                  toast({
                    title: "Atenção",
                    description: "Selecione uma assinatura primeiro",
                    variant: "destructive",
                  });
                  return;
                }
                paymentMutation.mutate({
                  subscriptionId: selectedSubscriptionId,
                  type: "payment_failed",
                });
              }}
              disabled={!selectedSubscriptionId || paymentMutation.isPending}
              variant="outline"
              className="border-red-500 text-red-600 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-2" />
              Pagamento Recusado
            </PremiumButton>

            <PremiumButton
              onClick={() => {
                if (!selectedSubscriptionId) {
                  toast({
                    title: "Atenção",
                    description: "Selecione uma assinatura primeiro",
                    variant: "destructive",
                  });
                  return;
                }
                paymentMutation.mutate({
                  subscriptionId: selectedSubscriptionId,
                  type: "payment_refunded",
                });
              }}
              disabled={!selectedSubscriptionId || paymentMutation.isPending}
              variant="outline"
              className="border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Estorno
            </PremiumButton>

            <PremiumButton
              onClick={() => {
                if (!selectedSubscriptionId) {
                  toast({
                    title: "Atenção",
                    description: "Selecione uma assinatura primeiro",
                    variant: "destructive",
                  });
                  return;
                }
                paymentMutation.mutate({
                  subscriptionId: selectedSubscriptionId,
                  type: "payment_chargeback",
                });
              }}
              disabled={!selectedSubscriptionId || paymentMutation.isPending}
              variant="outline"
              className="border-red-600 text-red-700 hover:bg-red-50"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Chargeback
            </PremiumButton>
          </div>
        </StripeSectionCard>

        {/* Aviso */}
        <StripeSectionCard className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">Atenção</h4>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                Este sistema de testes cria eventos reais no banco de dados. 
                Todos os eventos são registrados em subscriptionEvents e clientLogs. 
                Use com cuidado em ambiente de produção.
              </p>
            </div>
          </div>
        </StripeSectionCard>
      </div>
    </AdminLayout>
  );
}

