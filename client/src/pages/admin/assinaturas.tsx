import { useState, useEffect, startTransition } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StripeSectionCard } from "@/components/admin/StripeSectionCard";
import { StripeStatusBadge } from "@/components/admin/StripeStatusBadge";
import { StripeEmptyState } from "@/components/admin/StripeEmptyState";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
import { formatCurrency } from "@/lib/utils";
import { PremiumInput } from "@/components/design-system/PremiumInput";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreditCard, AlertTriangle, Search } from "lucide-react";
import { PremiumButton } from "@/components/design-system/PremiumButton";

type Subscription = {
  id: string;
  userId: string;
  provider: "caktos" | "manual";
  providerSubscriptionId: string;
  planName: string;
  priceCents: number;
  currency: string;
  billingInterval: "month" | "year";
  interval?: "monthly" | "yearly";
  status: "trial" | "active" | "paused" | "canceled" | "overdue";
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
};

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
    case "paused":
      return "hsl(215, 16%, 47%)";
    default:
      return "hsl(215, 16%, 47%)";
  }
};

export default function AdminAssinaturas() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [intervalFilter, setIntervalFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, error, refetch } = useQuery<Subscription[]>({
    queryKey: ["/api/admin/subscriptions", { 
      q: debouncedSearch, 
      status: statusFilter === "all" ? undefined : statusFilter, 
      provider: providerFilter === "all" ? undefined : providerFilter,
      interval: intervalFilter === "all" ? undefined : intervalFilter,
      period: periodFilter === "all" ? undefined : periodFilter,
    }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("q", debouncedSearch);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (providerFilter !== "all") params.append("provider", providerFilter);
      if (intervalFilter !== "all") params.append("interval", intervalFilter);
      if (periodFilter !== "all") params.append("period", periodFilter);
      
      const response = await apiRequest("GET", `/api/admin/subscriptions?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Erro ao carregar assinaturas" }));
        throw new Error(errorData.message || "Erro ao carregar assinaturas");
      }
      return await response.json();
    },
    retry: 1,
  });

  return (
    <AdminLayout 
      currentPath="/admin/assinaturas"
      pageTitle="Assinaturas"
      pageSubtitle="Gerencie todas as assinaturas do AnotaTudo.AI."
    >
      <AdminPageHeader
          title="Assinaturas"
        subtitle="Controle de planos, status e cobrança"
        />

      <div className="space-y-6">
        {/* Search and Filters */}
        <StripeSectionCard>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1 w-full md:max-w-md">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <PremiumInput
                  placeholder="Buscar por email, plano ou status..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12"
                />
              </div>
            </div>
          </div>
          
          {/* Advanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="trial">Teste</SelectItem>
                  <SelectItem value="paused">Pausadas</SelectItem>
                  <SelectItem value="canceled">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Intervalo</Label>
              <Select value={intervalFilter} onValueChange={setIntervalFilter}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Período</Label>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="7days">Últimos 7 dias</SelectItem>
                  <SelectItem value="30days">Últimos 30 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Provedor</Label>
              <Tabs value={providerFilter} onValueChange={setProviderFilter} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="caktos">Caktos</TabsTrigger>
                <TabsTrigger value="manual">Manual</TabsTrigger>
              </TabsList>
            </Tabs>
            </div>
          </div>
        </StripeSectionCard>

        {/* Table */}
        <StripeSectionCard className="p-0 overflow-hidden">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                  <TableHead className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">Cliente ID</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">Plano</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">Valor</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">Intervalo</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">Status</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">Próximo Vencimento</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">Origem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={`skeleton-${i}`}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
                {error && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-destructive py-8">
                      <div className="flex flex-col items-center gap-3">
                        <AlertTriangle className="h-8 w-8" />
                        <p className="font-medium">Erro ao carregar assinaturas</p>
                        <p className="text-sm text-muted-foreground">
                          {error instanceof Error ? error.message : "Tente novamente"}
                        </p>
                        <PremiumButton
                          variant="outline"
                          size="sm"
                          onClick={() => startTransition(() => refetch())}
                          className="mt-2"
                        >
                          Tentar novamente
                        </PremiumButton>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && !error && (() => {
                  const items = data ?? [];
                  if (items.length === 0) {
                    return (
                      <TableRow>
                        <TableCell colSpan={7} className="p-0">
                          <StripeEmptyState
                            icon={CreditCard}
                            title="Nenhuma assinatura encontrada"
                            subtitle="Tente ajustar os filtros"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  }
                  return items.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-mono text-sm">
                        {sub.userId.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="font-medium">{sub.planName}</TableCell>
                      <TableCell className="font-mono font-bold tabular-nums">
                        {formatCurrency(sub.priceCents / 100)}
                      </TableCell>
                      <TableCell>
                        {sub.interval === "yearly" ? "Anual" : sub.interval === "monthly" ? "Mensal" : (sub.billingInterval === "month" ? "Mensal" : "Anual")}
                      </TableCell>
                      <TableCell>
                        <StripeStatusBadge status={sub.status} />
                      </TableCell>
                      <TableCell>
                        {sub.currentPeriodEnd
                          ? format(new Date(sub.currentPeriodEnd), "dd/MM/yyyy", {
                              locale: ptBR,
                            })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {sub.provider === "caktos" ? "Caktos" : "Manual"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ));
                })()}
              </TableBody>
            </Table>
          </ScrollArea>
        </StripeSectionCard>
      </div>
    </AdminLayout>
  );
}

