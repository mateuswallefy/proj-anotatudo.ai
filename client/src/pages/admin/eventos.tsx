import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StripeSectionCard } from "@/components/admin/StripeSectionCard";
import { StripeStatusBadge } from "@/components/admin/StripeStatusBadge";
import { StripeEmptyState } from "@/components/admin/StripeEmptyState";
import { PremiumButton } from "@/components/design-system/PremiumButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { PremiumInput } from "@/components/design-system/PremiumInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Eye, Activity, AlertTriangle, Search } from "lucide-react";

type Event = {
  id: string;
  type: string;
  message: string;
  origin: string;
  severity: 'info' | 'warning' | 'error';
  provider: string;
  subscriptionId: string;
  clientId: string;
  payload: any;
  createdAt: string | Date;
};

const getEventTypeColor = (type: string, message: string) => {
  const typeLower = type.toLowerCase();
  const messageLower = message.toLowerCase();
  
  if (typeLower.includes("created") || typeLower.includes("activated") || messageLower.includes("created") || messageLower.includes("activated")) {
    return "hsl(142, 76%, 36%)";
  }
  if (typeLower.includes("canceled") || typeLower.includes("failed") || messageLower.includes("canceled") || messageLower.includes("failed")) {
    return "hsl(0, 72%, 51%)";
  }
  if (typeLower.includes("renewed") || typeLower.includes("succeeded") || messageLower.includes("renewed") || messageLower.includes("succeeded")) {
    return "hsl(217, 91%, 60%)";
  }
  return "hsl(215, 16%, 47%)";
};

const getEventTypeLabel = (type: string, source: string) => {
  const labels: Record<string, string> = {
    "subscription_created": "Assinatura criada",
    "subscription_updated": "Assinatura atualizada",
    "subscription_reactivated": "Assinatura reativada",
    "subscription_paused": "Assinatura pausada",
    "subscription_unpaused": "Assinatura despausada",
    "subscription_canceled": "Assinatura cancelada",
    "subscription_expired": "Assinatura expirada",
    "subscription_trial_started": "Trial iniciado",
    "subscription_trial_ended": "Trial finalizado",
    "payment_succeeded": "Pagamento confirmado",
    "payment_failed": "Pagamento falhou",
    "payment_refunded": "Pagamento reembolsado",
    // Legacy labels
    "subscription.created": "Assinatura criada",
    "subscription.activated": "Assinatura ativada",
    "subscription.canceled": "Assinatura cancelada",
    "subscription.renewed": "Assinatura renovada",
    "subscription.paused": "Assinatura pausada",
    "payment.succeeded": "Pagamento confirmado",
    "payment.failed": "Pagamento falhou",
    "create_user": "Usuário criado",
    "update_user": "Usuário atualizado",
    "suspend_user": "Usuário suspenso",
    "reactivate_user": "Usuário reativado",
    "delete_user": "Usuário deletado",
    "reset_password": "Senha resetada",
    "info": "Informação",
    "warning": "Aviso",
    "error": "Erro",
  };
  return labels[type] || type || "Evento";
};

export default function AdminEventos() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch all events from the unified endpoint
  const { data: eventsData, isLoading, error } = useQuery<{ events: Event[]; total: number }>({
    queryKey: ["/api/admin/events", { 
      search: debouncedSearch,
      type: typeFilter === "all" ? undefined : typeFilter,
      severity: severityFilter === "all" ? undefined : severityFilter,
    }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (severityFilter !== "all") params.append("severity", severityFilter);
      const response = await apiRequest("GET", `/api/admin/events?${params.toString()}`);
      return await response.json();
    },
  });

  // Ensure events is always an array
  const safeEvents = Array.isArray(eventsData?.events) ? eventsData.events : [];

  return (
    <AdminLayout 
      currentPath="/admin/eventos"
      pageTitle="Eventos"
      pageSubtitle="Visualize todos os eventos de assinatura do AnotaTudo.AI."
    >
      <AdminPageHeader
          title="Eventos"
        subtitle="Visualize todos os eventos de assinatura do AnotaTudo.AI"
        />

      <div className="space-y-6">
        {/* Search and Filters */}
        <StripeSectionCard>
          <div className="space-y-4">
            {/* Search */}
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <PremiumInput
                  placeholder="Buscar por tipo, mensagem ou origem..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12"
                />
              </div>
            </div>
            
            {/* Advanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tipo</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="subscription_created">Assinatura Criada</SelectItem>
                    <SelectItem value="subscription_updated">Assinatura Atualizada</SelectItem>
                    <SelectItem value="subscription_canceled">Assinatura Cancelada</SelectItem>
                    <SelectItem value="payment_succeeded">Pagamento Confirmado</SelectItem>
                    <SelectItem value="payment_failed">Pagamento Falhou</SelectItem>
                    <SelectItem value="payment_refunded">Pagamento Reembolsado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Severidade</Label>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Aviso</SelectItem>
                    <SelectItem value="error">Erro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </StripeSectionCard>
        {/* Table */}
        <StripeSectionCard className="p-0 overflow-hidden">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                  <TableHead className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">Tipo</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">Origem</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">Mensagem</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">Data/Hora</TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={`skeleton-${i}`}>
                        <TableCell><Skeleton className="h-6 w-32 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
                {error && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-destructive py-8">
                      <div className="flex flex-col items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        <p>Erro ao carregar eventos. Tente novamente.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && !error && (() => {
                  if (safeEvents.length === 0) {
                    return (
                      <TableRow>
                        <TableCell colSpan={5} className="p-0">
                          <StripeEmptyState
                            icon={Activity}
                            title="Nenhum evento encontrado"
                            subtitle="Os eventos serão exibidos aqui quando ocorrerem ações no sistema"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  }
                  return safeEvents.map((event) => {
                    // Ensure type and message exist before using .includes()
                    const type = event.type || "";
                    const message = event.message || "";
                    const source = event.source || "unknown";
                    
                    return (
                    <TableRow key={event.id}>
                      <TableCell>
                        <StripeStatusBadge
                          status={event.severity || (type.toLowerCase().includes("error") || message.toLowerCase().includes("error") ? "error" : type.toLowerCase().includes("warning") || message.toLowerCase().includes("warning") ? "warning" : "info")}
                          label={getEventTypeLabel(type, event.origin || "unknown")}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                          <span className="text-xs text-muted-foreground">{event.origin || "unknown"}</span>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {event.message || "-"}
                      </TableCell>
                      <TableCell>
                        {format(new Date(event.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <PremiumButton
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedEvent(event)}
                            >
                              <Eye className="h-4 w-4" />
                            </PremiumButton>
                          </DialogTrigger>
                          <DialogContent className="max-w-[90%] sm:max-w-[800px] rounded-2xl">
                            <DialogHeader>
                              <DialogTitle>Detalhes do Evento</DialogTitle>
                              <DialogDescription>
                                  Informações completas do evento de assinatura
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-semibold">Tipo</Label>
                                  <p className="text-sm text-muted-foreground">{event.type}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-semibold">Severidade</Label>
                                  <p className="text-sm text-muted-foreground">{event.severity}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-semibold">Origem</Label>
                                  <p className="text-sm text-muted-foreground">{event.origin}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-semibold">Provider</Label>
                                  <p className="text-sm text-muted-foreground">{event.provider}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-semibold">Subscription ID</Label>
                                  <p className="text-sm text-muted-foreground font-mono">{event.subscriptionId}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-semibold">Client ID</Label>
                                  <p className="text-sm text-muted-foreground font-mono">{event.clientId}</p>
                                </div>
                              </div>
                              <div>
                                <Label className="text-sm font-semibold">Mensagem</Label>
                                <p className="text-sm text-muted-foreground">{event.message}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-semibold">Payload Completo</Label>
                                <ScrollArea className="max-h-[60vh] mt-2">
                                  <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto">
                                    {JSON.stringify(event.payload || {}, null, 2)}
                                  </pre>
                                </ScrollArea>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                    );
                  });
                })()}
              </TableBody>
            </Table>
          </ScrollArea>
        </StripeSectionCard>
      </div>
    </AdminLayout>
  );
}

