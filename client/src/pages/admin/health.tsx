import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/design-system/PageHeader";
import { AppCard } from "@/components/design-system/AppCard";
import { PremiumButton } from "@/components/design-system/PremiumButton";
import { DataBadge } from "@/components/design-system/DataBadge";
import { SectionTitle } from "@/components/design-system/SectionTitle";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MessageSquare,
  Brain,
  Webhook,
  Server,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  TestTube,
} from "lucide-react";

type HealthStatus = "up" | "down" | "degraded";

type HealthOverview = {
  whatsapp: {
    status: HealthStatus;
    lastMessageAt: string | null;
    lastErrorAt: string | null;
    messagesLastHour: number;
    messagesLast24h: number;
    errorRate24h: number;
  };
  ai: {
    status: HealthStatus;
    lastCallAt: string | null;
    lastErrorAt: string | null;
    callsLastHour: number;
    callsLast24h: number;
    avgLatencyMsLastHour: number | null;
    errorRate24h: number;
  };
  webhooks: {
    status: HealthStatus;
    lastCaktosAt: string | null;
    lastErrorAt: string | null;
    successLast24h: number;
    errorsLast24h: number;
  };
  system: {
    status: HealthStatus;
    dbLatencyMs: number | null;
    eventsLastHour: number;
    eventsLast24h: number;
    errorsLast24h: number;
  };
};

type HealthLogItem = {
  id: string;
  createdAt: string;
  level: "info" | "warning" | "error";
  source: "whatsapp" | "ai" | "webhook" | "system" | "other";
  message: string;
  meta?: Record<string, any>;
};

const getStatusColor = (status: HealthStatus) => {
  switch (status) {
    case "up":
      return "hsl(142, 76%, 36%)";
    case "degraded":
      return "hsl(38, 92%, 50%)";
    case "down":
      return "hsl(0, 72%, 51%)";
    default:
      return "hsl(215, 16%, 47%)";
  }
};

const getStatusIcon = (status: HealthStatus) => {
  switch (status) {
    case "up":
      return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
    case "degraded":
      return <AlertTriangle className="h-5 w-5 text-amber-600" />;
    case "down":
      return <XCircle className="h-5 w-5 text-red-600" />;
    default:
      return <Clock className="h-5 w-5 text-muted-foreground" />;
  }
};

const getStatusLabel = (status: HealthStatus) => {
  switch (status) {
    case "up":
      return "Operacional";
    case "degraded":
      return "Degradado";
    case "down":
      return "Indisponível";
    default:
      return "Desconhecido";
  }
};

const getLevelColor = (level: string) => {
  switch (level) {
    case "error":
      return "hsl(0, 72%, 51%)";
    case "warning":
      return "hsl(38, 92%, 50%)";
    case "info":
      return "hsl(217, 91%, 60%)";
    default:
      return "hsl(215, 16%, 47%)";
  }
};

const getSourceLabel = (source: string) => {
  const labels: Record<string, string> = {
    whatsapp: "WhatsApp",
    ai: "IA / OpenAI",
    webhook: "Webhook",
    system: "Sistema",
    other: "Outro",
  };
  return labels[source] || source;
};

const formatTimeAgo = (dateString: string | null) => {
  if (!dateString) return "Nunca";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Agora";
  if (diffMins < 60) return `há ${diffMins} min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  return `há ${diffDays}d`;
};

export default function AdminHealth() {
  const { toast } = useToast();
  const [logLevel, setLogLevel] = useState<string>("all");
  const [logSource, setLogSource] = useState<string>("all");

  const { data: healthData, isLoading: healthLoading } = useQuery<HealthOverview>({
    queryKey: ["admin-health-overview"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/health/overview");
      return await response.json();
    },
    refetchInterval: 15000, // 15 seconds
  });

  const { data: logs, isLoading: logsLoading } = useQuery<HealthLogItem[]>({
    queryKey: ["admin-health-logs", logLevel, logSource],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (logLevel !== "all") params.append("level", logLevel);
      if (logSource !== "all") params.append("source", logSource);
      const response = await apiRequest("GET", `/api/admin/health/logs?${params.toString()}`);
      return await response.json();
    },
    refetchInterval: 10000, // 10 seconds
  });

  const testWhatsAppMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/health/test/whatsapp");
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-health-overview"] });
      queryClient.invalidateQueries({ queryKey: ["admin-health-logs"] });
      toast({
        title: data.ok ? "Sucesso!" : "Erro!",
        description: data.ok ? "Operação concluída com êxito." : "Não foi possível completar a ação.",
        variant: data.ok ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro!",
        description: "Não foi possível completar a ação.",
        variant: "destructive",
      });
    },
  });

  const testAIMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/health/test/ai");
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-health-overview"] });
      queryClient.invalidateQueries({ queryKey: ["admin-health-logs"] });
      toast({
        title: data.ok ? "Sucesso!" : "Erro!",
        description: data.ok ? "Operação concluída com êxito." : "Não foi possível completar a ação.",
        variant: data.ok ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro!",
        description: "Não foi possível completar a ação.",
        variant: "destructive",
      });
    },
  });

  const testHealthCheckMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/health/test/check");
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-health-overview"] });
      queryClient.invalidateQueries({ queryKey: ["admin-health-logs"] });
      toast({
        title: data.details?.status === "healthy" ? "Sucesso!" : "Erro!",
        description: data.details?.status === "healthy" 
          ? "Operação concluída com êxito."
          : "Não foi possível completar a ação.",
        variant: data.details?.status === "healthy" ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro!",
        description: "Não foi possível completar a ação.",
        variant: "destructive",
      });
    },
  });

  return (
    <AdminLayout
      currentPath="/admin/health"
      pageTitle="Health Center"
      pageSubtitle="Monitoramento em tempo quase real do AnotaTudo.AI."
    >
      <div className="space-y-8 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <PageHeader
          title="Health Center"
          subtitle="Monitoramento em tempo quase real do AnotaTudo.AI."
        />

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {healthLoading ? (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-2xl" />
              ))}
            </>
          ) : (
            <>
              {/* WhatsApp Status */}
              <AppCard className="p-5 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-lg">WhatsApp</h3>
                  </div>
                  {healthData && getStatusIcon(healthData.whatsapp.status)}
                </div>
                <DataBadge
                  variant="outline"
                  color={healthData ? getStatusColor(healthData.whatsapp.status) : undefined}
                  className="mb-4"
                >
                  {healthData ? getStatusLabel(healthData.whatsapp.status) : "Carregando..."}
                </DataBadge>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    Última mensagem: {healthData ? formatTimeAgo(healthData.whatsapp.lastMessageAt) : "-"}
                  </p>
                  <p className="text-muted-foreground">
                    Erros (24h): {healthData ? healthData.whatsapp.messagesLast24h > 0 
                      ? `${Math.round(healthData.whatsapp.errorRate24h * 100)}%` 
                      : "0" : "-"}
                  </p>
                  <p className="font-mono font-bold text-lg">
                    {healthData ? healthData.whatsapp.messagesLast24h : 0} mensagens (24h)
                  </p>
                </div>
              </AppCard>

              {/* AI Status */}
              <AppCard className="p-5 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/20">
                      <Brain className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-lg">IA / OpenAI</h3>
                  </div>
                  {healthData && getStatusIcon(healthData.ai.status)}
                </div>
                <DataBadge
                  variant="outline"
                  color={healthData ? getStatusColor(healthData.ai.status) : undefined}
                  className="mb-4"
                >
                  {healthData ? getStatusLabel(healthData.ai.status) : "Carregando..."}
                </DataBadge>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    Última chamada: {healthData ? formatTimeAgo(healthData.ai.lastCallAt) : "-"}
                  </p>
                  <p className="text-muted-foreground">
                    Erros (24h): {healthData ? healthData.ai.callsLast24h > 0 
                      ? `${Math.round(healthData.ai.errorRate24h * 100)}%` 
                      : "0" : "-"}
                  </p>
                  <p className="font-mono font-bold text-lg">
                    {healthData ? healthData.ai.callsLast24h : 0} chamadas (24h)
                  </p>
                </div>
              </AppCard>

              {/* Webhooks Status */}
              <AppCard className="p-5 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/20">
                      <Webhook className="h-5 w-5 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-lg">Webhooks</h3>
                  </div>
                  {healthData && getStatusIcon(healthData.webhooks.status)}
                </div>
                <DataBadge
                  variant="outline"
                  color={healthData ? getStatusColor(healthData.webhooks.status) : undefined}
                  className="mb-4"
                >
                  {healthData ? getStatusLabel(healthData.webhooks.status) : "Carregando..."}
                </DataBadge>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    Último evento: {healthData ? formatTimeAgo(healthData.webhooks.lastCaktosAt) : "-"}
                  </p>
                  <p className="text-muted-foreground">
                    Erros (24h): {healthData ? healthData.webhooks.errorsLast24h : 0}
                  </p>
                  <p className="font-mono font-bold text-lg">
                    {healthData ? healthData.webhooks.successLast24h : 0} sucessos (24h)
                  </p>
                </div>
              </AppCard>

              {/* System Status */}
              <AppCard className="p-5 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-900/20">
                      <Server className="h-5 w-5 text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-lg">Sistema</h3>
                  </div>
                  {healthData && getStatusIcon(healthData.system.status)}
                </div>
                <DataBadge
                  variant="outline"
                  color={healthData ? getStatusColor(healthData.system.status) : undefined}
                  className="mb-4"
                >
                  {healthData ? getStatusLabel(healthData.system.status) : "Carregando..."}
                </DataBadge>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    Latência DB: {healthData && healthData.system.dbLatencyMs !== null 
                      ? `${healthData.system.dbLatencyMs}ms` 
                      : "-"}
                  </p>
                  <p className="text-muted-foreground">
                    Erros (24h): {healthData ? healthData.system.errorsLast24h : 0}
                  </p>
                  <p className="font-mono font-bold text-lg">
                    {healthData ? healthData.system.eventsLast24h : 0} eventos (24h)
                  </p>
                </div>
              </AppCard>
            </>
          )}
        </div>

        {/* Activity Summary */}
        <AppCard className="p-5 md:p-6">
          <SectionTitle title="Atividade nas últimas 24 horas" />
          {healthLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="p-4 rounded-xl border border-border/50 bg-muted/30">
                <p className="text-sm font-medium text-muted-foreground mb-2">Mensagens WhatsApp</p>
                <div className="flex items-baseline gap-2">
                  <p className="font-mono font-bold text-2xl tabular-nums">
                    {healthData ? healthData.whatsapp.messagesLast24h : 0}
                  </p>
                  <p className="text-sm text-muted-foreground">últimas 24h</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {healthData ? healthData.whatsapp.messagesLastHour : 0} na última hora
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border/50 bg-muted/30">
                <p className="text-sm font-medium text-muted-foreground mb-2">Chamadas IA</p>
                <div className="flex items-baseline gap-2">
                  <p className="font-mono font-bold text-2xl tabular-nums">
                    {healthData ? healthData.ai.callsLast24h : 0}
                  </p>
                  <p className="text-sm text-muted-foreground">últimas 24h</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {healthData ? healthData.ai.callsLastHour : 0} na última hora
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border/50 bg-muted/30">
                <p className="text-sm font-medium text-muted-foreground mb-2">Eventos / Erros</p>
                <div className="flex items-baseline gap-2">
                  <p className="font-mono font-bold text-2xl tabular-nums">
                    {healthData ? healthData.system.eventsLast24h : 0}
                  </p>
                  <p className="text-sm text-muted-foreground">últimas 24h</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {healthData ? healthData.system.errorsLast24h : 0} erros
                </p>
              </div>
            </div>
          )}
        </AppCard>

        {/* Logs */}
        <AppCard className="p-5 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <SectionTitle title="Logs recentes" />
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground animate-pulse" />
              <span className="text-xs text-muted-foreground">Atualizando a cada 10s</span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Select value={logLevel} onValueChange={setLogLevel}>
              <SelectTrigger className="w-full md:w-48 h-11 md:h-12 rounded-xl">
                <SelectValue placeholder="Nível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os níveis</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Select value={logSource} onValueChange={setLogSource}>
              <SelectTrigger className="w-full md:w-48 h-11 md:h-12 rounded-xl">
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as origens</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="ai">IA</SelectItem>
                <SelectItem value="webhook">Webhook</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Logs Table */}
          {logsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : !logs || logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Nenhum log recente</p>
              <p className="text-sm mt-1">
                Nenhum log encontrado dentro dos filtros selecionados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Mensagem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>
                        <DataBadge
                          variant="outline"
                          color={getLevelColor(log.level)}
                        >
                          {log.level}
                        </DataBadge>
                      </TableCell>
                      <TableCell>
                        <DataBadge variant="outline">
                          {getSourceLabel(log.source)}
                        </DataBadge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="truncate text-sm">{log.message}</p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </AppCard>

        {/* Quick Tools */}
        <AppCard className="p-5 md:p-6">
          <SectionTitle title="Ferramentas rápidas" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <PremiumButton
              onClick={() => testWhatsAppMutation.mutate()}
              disabled={testWhatsAppMutation.isPending}
              variant="outline"
              className="w-full"
            >
              {testWhatsAppMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Testar conexão WhatsApp
                </>
              )}
            </PremiumButton>
            <PremiumButton
              onClick={() => testAIMutation.mutate()}
              disabled={testAIMutation.isPending}
              variant="outline"
              className="w-full"
            >
              {testAIMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Testar chamada IA
                </>
              )}
            </PremiumButton>
            <PremiumButton
              onClick={() => testHealthCheckMutation.mutate()}
              disabled={testHealthCheckMutation.isPending}
              variant="outline"
              className="w-full"
            >
              {testHealthCheckMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4 mr-2" />
                  Forçar health check geral
                </>
              )}
            </PremiumButton>
          </div>
        </AppCard>
      </div>
    </AdminLayout>
  );
}

