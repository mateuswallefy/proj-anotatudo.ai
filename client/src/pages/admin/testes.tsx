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
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

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
  providerSubscriptionId: string;
};

export default function AdminTestes() {
  const { toast } = useToast();
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string>("");
  const [customWebhookPayload, setCustomWebhookPayload] = useState<string>("");
  const [showCustomWebhook, setShowCustomWebhook] = useState(false);
  const [showCreateSubscription, setShowCreateSubscription] = useState(false);
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  
  // Form state para criar assinatura fake
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerDocNumber: "",
    planName: "Premium Test",
    planInterval: "monthly" as "monthly" | "quarterly" | "semiannual" | "annual",
    amount: 29.70,
    trialDays: 0,
  });

  // Buscar clientes
  const { data: clientsData, refetch: refetchClients } = useQuery<{ items: User[] }>({
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

  // Buscar eventos (para refetch após limpeza)
  const { refetch: refetchEvents } = useQuery({
    queryKey: ["/api/admin/events"],
    enabled: false,
  });

  // Buscar webhooks (para refetch após limpeza)
  const { refetch: refetchWebhooks } = useQuery({
    queryKey: ["/api/admin/webhooks/grouped"],
    enabled: false,
  });

  // Criar assinatura fake
  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: {
      customerName: string;
      customerEmail: string;
      customerPhone?: string;
      customerDocNumber?: string;
      planName: string;
      planInterval: "monthly" | "quarterly" | "semiannual" | "annual";
      amount: number;
      trialDays?: number;
    }) => {
      const response = await apiRequest("POST", "/api/admin/test/subscription", data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sucesso!",
        description: "Cliente e assinatura de teste criados com sucesso!",
      });
      // Fechar modal
      setShowCreateSubscription(false);
      // Resetar form
      setFormData({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        customerDocNumber: "",
        planName: "Premium Test",
        planInterval: "monthly",
        amount: 29.70,
        trialDays: 0,
      });
      // Recarregar dados
      refetchClients();
      // Selecionar cliente recém-criado
      if (data.client?.id) {
        setSelectedClientId(data.client.id);
      }
      // Recarregar assinaturas após um delay para garantir que o cliente foi criado
      setTimeout(() => {
        refetchSubscriptions();
      }, 500);
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
      // Buscar assinatura para obter providerSubscriptionId
      const subscription = subscriptionsData?.find(s => s.id === data.subscriptionId);
      if (!subscription) {
        throw new Error("Assinatura não encontrada");
      }
      
      const response = await apiRequest("POST", "/api/admin/test/payment", {
        subscriptionId: subscription.providerSubscriptionId,
        type: data.type,
        amount: data.amount,
      });
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

  // Limpar dados de teste
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/test/cleanup");
      return await response.json();
    },
    onSuccess: (data) => {
      const total = data.deleted.events + data.deleted.webhooks + data.deleted.logs + 
                    data.deleted.orders + data.deleted.subscriptions + data.deleted.clients;
      toast({
        title: "Sucesso!",
        description: `Dados de teste removidos: ${total} itens (${data.deleted.events} eventos, ${data.deleted.webhooks} webhooks, ${data.deleted.logs} logs, ${data.deleted.orders} pedidos, ${data.deleted.subscriptions} assinaturas, ${data.deleted.clients} clientes)`,
      });
      setShowCleanupDialog(false);
      // Resetar estado local
      setSelectedClientId("");
      setSelectedSubscriptionId("");
      // Recarregar todas as listagens
      refetchClients();
      refetchSubscriptions();
      refetchEvents();
      refetchWebhooks();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao limpar dados de teste",
        variant: "destructive",
      });
    },
  });

  // Cancelar assinatura
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const subscription = subscriptionsData?.find(s => s.id === subscriptionId);
      if (!subscription) {
        throw new Error("Assinatura não encontrada");
      }
      
      const payload = {
        event: "subscription_canceled",
        data: {
          subscription: {
            id: subscription.providerSubscriptionId,
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
      const subscription = subscriptionsData?.find(s => s.id === subscriptionId);
      if (!subscription) {
        throw new Error("Assinatura não encontrada");
      }
      
      const payload = {
        event: "subscription_resumed",
        data: {
          subscription: {
            id: subscription.providerSubscriptionId,
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
    if (!formData.customerName || !formData.customerEmail) {
      toast({
        title: "Atenção",
        description: "Preencha nome e email do cliente",
        variant: "destructive",
      });
      return;
    }
    createSubscriptionMutation.mutate({
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      customerPhone: formData.customerPhone || undefined,
      customerDocNumber: formData.customerDocNumber || undefined,
      planName: formData.planName,
      planInterval: formData.planInterval,
      amount: formData.amount,
      trialDays: formData.trialDays > 0 ? formData.trialDays : undefined,
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

      {/* Botão de Limpeza de Dados de Teste */}
      <div className="mb-6">
        <AlertDialog open={showCleanupDialog} onOpenChange={setShowCleanupDialog}>
          <AlertDialogTrigger asChild>
            <PremiumButton
              variant="outline"
              className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              disabled={cleanupMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Dados de Teste
            </PremiumButton>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Limpar todos os dados de teste?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação é irreversível e removerá clientes, assinaturas, pedidos, webhooks e eventos marcados como teste.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => cleanupMutation.mutate()}
                disabled={cleanupMutation.isPending}
              >
                {cleanupMutation.isPending ? "Limpando..." : "Limpar Tudo"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

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
            <Dialog open={showCreateSubscription} onOpenChange={setShowCreateSubscription}>
              <DialogTrigger asChild>
                <PremiumButton variant="outline">
                  <Play className="h-4 w-4 mr-2" />
                  Criar Assinatura Fake
                </PremiumButton>
              </DialogTrigger>
              <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Assinatura Fake</DialogTitle>
                  <DialogDescription>
                    Cria um cliente fake completo, assinatura e order através do fluxo de webhook real
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerName">Nome do Cliente *</Label>
                      <PremiumInput
                        id="customerName"
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        placeholder="João Silva"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerEmail">Email *</Label>
                      <PremiumInput
                        id="customerEmail"
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                        placeholder="joao@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerPhone">Telefone</Label>
                      <PremiumInput
                        id="customerPhone"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                        placeholder="5511999999999"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerDocNumber">CPF/CNPJ</Label>
                      <PremiumInput
                        id="customerDocNumber"
                        value={formData.customerDocNumber}
                        onChange={(e) => setFormData({ ...formData, customerDocNumber: e.target.value })}
                        placeholder="12345678900"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="planName">Nome do Plano</Label>
                      <PremiumInput
                        id="planName"
                        value={formData.planName}
                        onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                        placeholder="Premium Test"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="planInterval">Intervalo</Label>
                      <Select
                        value={formData.planInterval}
                        onValueChange={(value: "monthly" | "quarterly" | "semiannual" | "annual") =>
                          setFormData({ ...formData, planInterval: value })
                        }
                      >
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="quarterly">Trimestral</SelectItem>
                          <SelectItem value="semiannual">Semestral</SelectItem>
                          <SelectItem value="annual">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Valor (R$)</Label>
                      <PremiumInput
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                        placeholder="29.70"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trialDays">Dias de Trial (0 = sem trial)</Label>
                      <PremiumInput
                        id="trialDays"
                        type="number"
                        min="0"
                        value={formData.trialDays}
                        onChange={(e) => setFormData({ ...formData, trialDays: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <PremiumButton
                      variant="outline"
                      onClick={() => {
                        setShowCreateSubscription(false);
                        setFormData({
                          customerName: "",
                          customerEmail: "",
                          customerPhone: "",
                          customerDocNumber: "",
                          planName: "Premium Test",
                          planInterval: "monthly",
                          amount: 29.70,
                          trialDays: 0,
                        });
                      }}
                    >
                      Cancelar
                    </PremiumButton>
                    <PremiumButton
                      onClick={handleCreateSubscription}
                      disabled={createSubscriptionMutation.isPending || !formData.customerName || !formData.customerEmail}
                    >
                      {createSubscriptionMutation.isPending ? (
                        <>Processando...</>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Criar
                        </>
                      )}
                    </PremiumButton>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

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
                const subscription = subscriptionsData?.find(s => s.id === selectedSubscriptionId);
                if (!subscription) {
                  toast({
                    title: "Erro",
                    description: "Assinatura não encontrada",
                    variant: "destructive",
                  });
                  return;
                }
                paymentMutation.mutate({
                  subscriptionId: subscription.providerSubscriptionId,
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
                const subscription = subscriptionsData?.find(s => s.id === selectedSubscriptionId);
                if (!subscription) {
                  toast({
                    title: "Erro",
                    description: "Assinatura não encontrada",
                    variant: "destructive",
                  });
                  return;
                }
                paymentMutation.mutate({
                  subscriptionId: subscription.providerSubscriptionId,
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
                const subscription = subscriptionsData?.find(s => s.id === selectedSubscriptionId);
                if (!subscription) {
                  toast({
                    title: "Erro",
                    description: "Assinatura não encontrada",
                    variant: "destructive",
                  });
                  return;
                }
                paymentMutation.mutate({
                  subscriptionId: subscription.providerSubscriptionId,
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
                const subscription = subscriptionsData?.find(s => s.id === selectedSubscriptionId);
                if (!subscription) {
                  toast({
                    title: "Erro",
                    description: "Assinatura não encontrada",
                    variant: "destructive",
                  });
                  return;
                }
                paymentMutation.mutate({
                  subscriptionId: subscription.providerSubscriptionId,
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

