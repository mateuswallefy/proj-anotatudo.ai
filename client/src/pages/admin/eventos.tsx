import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/design-system/PageHeader";
import { AppCard } from "@/components/design-system/AppCard";
import { DataBadge } from "@/components/design-system/DataBadge";
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Eye, Activity, AlertTriangle } from "lucide-react";

type SubscriptionEvent = {
  id: string;
  subscriptionId: string;
  type: string;
  rawPayload: any;
  createdAt: string;
  subscription?: {
    planName: string;
    userId: string;
  };
};

const getEventTypeColor = (type: string) => {
  if (type.includes("created") || type.includes("activated")) {
    return "hsl(142, 76%, 36%)";
  }
  if (type.includes("canceled") || type.includes("failed")) {
    return "hsl(0, 72%, 51%)";
  }
  if (type.includes("renewed") || type.includes("succeeded")) {
    return "hsl(217, 91%, 60%)";
  }
  return "hsl(215, 16%, 47%)";
};

const getEventTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    "subscription.created": "Assinatura criada",
    "subscription.activated": "Assinatura ativada",
    "subscription.canceled": "Assinatura cancelada",
    "subscription.renewed": "Assinatura renovada",
    "subscription.paused": "Assinatura pausada",
    "payment.succeeded": "Pagamento confirmado",
    "payment.failed": "Pagamento falhou",
  };
  return labels[type] || type;
};

export default function AdminEventos() {
  const [selectedEvent, setSelectedEvent] = useState<SubscriptionEvent | null>(null);

  // Note: We need to get recent events from subscriptions
  // For now, we'll fetch subscriptions and then get events from a specific subscription
  // This is a simplified version - in production, you'd want a dedicated endpoint
  const { data: subscriptionsData, isLoading, error } = useQuery<SubscriptionEvent[]>({
    queryKey: ["/api/admin/subscriptions"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/subscriptions");
      return await response.json();
    },
  });

  // For now, we'll show a placeholder message since we don't have a direct events endpoint
  // In production, create /api/admin/events endpoint
  const events: SubscriptionEvent[] = subscriptionsData ?? [];

  return (
    <AdminLayout 
      currentPath="/admin/eventos"
      pageTitle="Eventos"
      pageSubtitle="Visualize todos os eventos de assinatura do AnotaTudo.AI."
    >
      <div className="space-y-8 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <PageHeader
          title="Eventos"
          subtitle="Visualize todos os eventos de assinatura do AnotaTudo.AI."
        />

        <div className="space-y-6 mt-8">
        {/* Table */}
        <AppCard className="p-0 overflow-hidden">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cliente ID</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
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
                  const items = events ?? [];
                  if (items.length === 0) {
                    return (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                          <div className="flex flex-col items-center gap-2">
                            <Activity className="h-8 w-8 opacity-50" />
                            <p className="font-medium">Nenhum evento encontrado</p>
                            <p className="text-sm">
                              Os eventos serão exibidos aqui quando as assinaturas gerarem eventos.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }
                  return items.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <DataBadge variant="outline" color={getEventTypeColor(event.type)}>
                          {getEventTypeLabel(event.type)}
                        </DataBadge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {event.subscription?.userId
                          ? `${event.subscription.userId.slice(0, 8)}...`
                          : "-"}
                      </TableCell>
                      <TableCell>{event.subscription?.planName || "-"}</TableCell>
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
                          <DialogContent className="max-w-[90%] sm:max-w-[600px] rounded-2xl">
                            <DialogHeader>
                              <DialogTitle>Detalhes do Evento</DialogTitle>
                              <DialogDescription>
                                Payload completo do evento
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <ScrollArea className="max-h-[60vh]">
                                <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto">
                                  {JSON.stringify(selectedEvent?.rawPayload || {}, null, 2)}
                                </pre>
                              </ScrollArea>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ));
                })()}
              </TableBody>
            </Table>
          </ScrollArea>
        </AppCard>
        </div>
      </div>
    </AdminLayout>
  );
}

