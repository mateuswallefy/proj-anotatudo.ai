import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/design-system/PageHeader";
import { AppCard } from "@/components/design-system/AppCard";
import { MetricCard } from "@/components/cards/MetricCard";
import { StatCard } from "@/components/cards/StatCard";
import { DataBadge } from "@/components/design-system/DataBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  UserCheck, 
  Clock, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  Activity
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type AdminOverview = {
  totalUsers: number;
  activeUsers: number;
  trialUsers: number;
  canceledUsers: number;
  overdueUsers: number;
  mrrCentsEstimado: number;
  newUsersLast30Days: number;
};

type SubscriptionEvent = {
  id: string;
  type: string;
  createdAt: string;
  rawPayload: any;
  subscription: {
    id: string;
    planName: string;
    userId: string;
  };
};

export default function AdminOverview() {
  const { data: overview, isLoading: overviewLoading, error: overviewError } = useQuery<AdminOverview>({
    queryKey: ["/api/admin/overview"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/overview");
      return await response.json();
    },
  });

  // For now, we'll show a placeholder for events since we don't have a direct endpoint
  // In production, you'd want to create /api/admin/events endpoint
  const eventsLoading = false;
  const recentEvents: SubscriptionEvent[] = [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "hsl(142, 76%, 36%)";
      case "trial":
        return "hsl(217, 91%, 60%)";
      case "canceled":
        return "hsl(0, 72%, 51%)";
      case "overdue":
        return "hsl(38, 92%, 50%)";
      default:
        return "hsl(215, 16%, 47%)";
    }
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

  return (
    <AdminLayout 
      currentPath="/admin"
      pageTitle="Visão Geral"
      pageSubtitle="Acompanhe seus clientes, assinaturas e receita do AnotaTudo.AI."
    >
      <div className="space-y-8 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <PageHeader
          title="Painel Administrativo"
          subtitle="Acompanhe seus clientes, assinaturas e receita do AnotaTudo.AI."
        />

        <div className="space-y-8 mt-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {overviewLoading ? (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
              ))}
            </>
          ) : (
            <>
              <StatCard
                icon={Users}
                label="Total de Clientes"
                value={(overview?.totalUsers || 0).toLocaleString()}
                iconColor="text-blue-600"
                iconBg="bg-blue-100 dark:bg-blue-900/20"
              />
              <StatCard
                icon={UserCheck}
                label="Clientes Ativos"
                value={(overview?.activeUsers || 0).toLocaleString()}
                subtitle={`${overview?.trialUsers || 0} em teste`}
                iconColor="text-emerald-600"
                iconBg="bg-emerald-100 dark:bg-emerald-900/20"
              />
              <StatCard
                icon={XCircle}
                label="Cancelados"
                value={(overview?.canceledUsers || 0).toLocaleString()}
                iconColor="text-red-600"
                iconBg="bg-red-100 dark:bg-red-900/20"
              />
              <StatCard
                icon={TrendingUp}
                label="MRR Estimado"
                value={formatCurrency((overview?.mrrCentsEstimado || 0) / 100)}
                subtitle={`${overview?.newUsersLast30Days || 0} novos últimos 30 dias`}
                iconColor="text-purple-600"
                iconBg="bg-purple-100 dark:bg-purple-900/20"
              />
            </>
          )}
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {overviewLoading ? (
            <>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
            </>
          ) : (
            <>
              <MetricCard
                icon={Clock}
                label="Em Teste"
                value={overview?.trialUsers || 0}
                iconColor="text-blue-600"
                iconBg="bg-blue-100 dark:bg-blue-900/20"
              />
              <MetricCard
                icon={AlertTriangle}
                label="Atrasados"
                value={overview?.overdueUsers || 0}
                iconColor="text-orange-600"
                iconBg="bg-orange-100 dark:bg-orange-900/20"
              />
              <MetricCard
                icon={Calendar}
                label="Novos (30 dias)"
                value={overview?.newUsersLast30Days || 0}
                iconColor="text-purple-600"
                iconBg="bg-purple-100 dark:bg-purple-900/20"
              />
            </>
          )}
        </div>

        {/* Recent Events */}
        <AppCard className="p-5 md:p-6 cr-card-animate">
          <h2 className="text-2xl font-bold mb-4">Eventos Recentes</h2>
          {eventsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : (() => {
            const items = recentEvents ?? [];
            if (items.length === 0) {
              return (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Nenhum evento recente</p>
                  <p className="text-sm mt-1">Os eventos aparecerão aqui quando houver atividade</p>
                </div>
              );
            }
            return (
              <div className="space-y-3">
                {items.slice(0, 10).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <DataBadge
                        variant="outline"
                        color={getStatusColor(event.type)}
                      >
                        {getEventTypeLabel(event.type)}
                      </DataBadge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {event.subscription?.planName || "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(event.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </AppCard>
        </div>
      </div>
    </AdminLayout>
  );
}

