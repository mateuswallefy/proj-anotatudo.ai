import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StripeMetricCard } from "@/components/admin/StripeMetricCard";
import { StripeSectionCard } from "@/components/admin/StripeSectionCard";
import { StripeStatusBadge } from "@/components/admin/StripeStatusBadge";
import { StripeEmptyState } from "@/components/admin/StripeEmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  UserCheck, 
  Clock, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  Activity,
  ArrowRight
} from "lucide-react";
import { useLocation } from "wouter";
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

export default function AdminOverview() {
  const [, setLocation] = useLocation();
  
  const { data: overview, isLoading: overviewLoading } = useQuery<AdminOverview>({
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

  return (
    <AdminLayout 
      currentPath="/admin"
      pageTitle="Visão Geral"
      pageSubtitle="Acompanhe seus clientes, assinaturas e receita do AnotaTudo.AI."
    >
      <AdminPageHeader
          title="Painel Administrativo"
          subtitle="Acompanhe seus clientes, assinaturas e receita do AnotaTudo.AI."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/admin/clientes")}
            className="gap-2"
          >
            Ver Clientes
            <ArrowRight className="h-4 w-4" />
          </Button>
        }
      />

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {overviewLoading ? (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </>
          ) : (
            <>
            <StripeMetricCard
                icon={Users}
                label="Total de Clientes"
                value={(overview?.totalUsers || 0).toLocaleString()}
                iconColor="text-blue-600"
              iconBg="bg-blue-50 dark:bg-blue-900/20"
              />
            <StripeMetricCard
                icon={UserCheck}
                label="Clientes Ativos"
                value={(overview?.activeUsers || 0).toLocaleString()}
                subtitle={`${overview?.trialUsers || 0} em teste`}
                iconColor="text-emerald-600"
              iconBg="bg-emerald-50 dark:bg-emerald-900/20"
              />
            <StripeMetricCard
                icon={XCircle}
                label="Cancelados"
                value={(overview?.canceledUsers || 0).toLocaleString()}
                iconColor="text-red-600"
              iconBg="bg-red-50 dark:bg-red-900/20"
              />
            <StripeMetricCard
                icon={TrendingUp}
                label="MRR Estimado"
                value={formatCurrency((overview?.mrrCentsEstimado || 0) / 100)}
              subtitle="baseado em assinaturas ativas"
                iconColor="text-purple-600"
              iconBg="bg-purple-50 dark:bg-purple-900/20"
              />
            </>
          )}
        </div>

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {overviewLoading ? (
            <>
              {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </>
          ) : (
            <>
            <StripeMetricCard
                icon={Clock}
                label="Em Teste"
                value={overview?.trialUsers || 0}
                iconColor="text-blue-600"
              iconBg="bg-blue-50 dark:bg-blue-900/20"
              />
            <StripeMetricCard
                icon={AlertTriangle}
                label="Atrasados"
                value={overview?.overdueUsers || 0}
                iconColor="text-orange-600"
              iconBg="bg-orange-50 dark:bg-orange-900/20"
              />
            <StripeMetricCard
                icon={Calendar}
                label="Novos (30 dias)"
                value={overview?.newUsersLast30Days || 0}
                iconColor="text-purple-600"
              iconBg="bg-purple-50 dark:bg-purple-900/20"
              />
            </>
          )}
        </div>

        {/* Recent Events */}
      <StripeSectionCard
        title="Eventos Recentes"
        subtitle="Últimas atividades do sistema"
      >
          {eventsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : (() => {
            const items = recentEvents ?? [];
            if (items.length === 0) {
              return (
              <StripeEmptyState
                icon={Activity}
                title="Nenhum evento recente"
                subtitle="Os eventos aparecerão aqui quando houver atividade no sistema"
              />
              );
            }
            return (
              <div className="space-y-3">
                {items.slice(0, 10).map((event) => (
                  <div
                    key={event.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <StripeStatusBadge
                      status={event.type.includes("canceled") || event.type.includes("failed") ? "error" : event.type.includes("created") || event.type.includes("activated") ? "active" : "info"}
                      label={getEventTypeLabel(event.type)}
                    />
                      <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">
                          {event.subscription?.planName || "N/A"}
                        </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
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
      </StripeSectionCard>
    </AdminLayout>
  );
}

