import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/design-system/PageHeader";
import { AppCard } from "@/components/design-system/AppCard";
import { DataBadge } from "@/components/design-system/DataBadge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Subscription = {
  id: string;
  userId: string;
  provider: "caktos" | "manual";
  providerSubscriptionId: string;
  planName: string;
  priceCents: number;
  currency: string;
  billingInterval: "month" | "year";
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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");

  const { data, isLoading, error } = useQuery<Subscription[]>({
    queryKey: ["/api/admin/subscriptions", { status: statusFilter === "all" ? undefined : statusFilter, provider: providerFilter === "all" ? undefined : providerFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (providerFilter !== "all") params.append("provider", providerFilter);
      
      const response = await apiRequest("GET", `/api/admin/subscriptions?${params.toString()}`);
      return await response.json();
    },
  });

  return (
    <AdminLayout currentPath="/admin/assinaturas">
      <PageHeader
        title="Assinaturas"
        subtitle="Gerencie todas as assinaturas do AnotaTudo.AI."
      />

      <div className="space-y-6 mt-8">
        {/* Filters */}
        <AppCard className="p-5 md:p-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full md:w-auto">
              <TabsList className="grid w-full md:w-auto grid-cols-3 md:grid-cols-6">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="active">Ativas</TabsTrigger>
                <TabsTrigger value="trial">Teste</TabsTrigger>
                <TabsTrigger value="paused">Pausadas</TabsTrigger>
                <TabsTrigger value="canceled">Canceladas</TabsTrigger>
                <TabsTrigger value="overdue">Atrasadas</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs value={providerFilter} onValueChange={setProviderFilter} className="w-full md:w-auto">
              <TabsList className="grid w-full md:w-auto grid-cols-2">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="caktos">Caktos</TabsTrigger>
                <TabsTrigger value="manual">Manual</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </AppCard>

        {/* Table */}
        <AppCard className="p-0 overflow-hidden">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente ID</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Intervalo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Próximo Vencimento</TableHead>
                  <TableHead>Origem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Carregando assinaturas...
                    </TableCell>
                  </TableRow>
                )}
                {error && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-red-600 py-8">
                      Erro ao carregar assinaturas. Tente novamente.
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && !error && (() => {
                  const items = data ?? [];
                  if (items.length === 0) {
                    return (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Nenhuma assinatura encontrada
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
                        {sub.billingInterval === "month" ? "Mensal" : "Anual"}
                      </TableCell>
                      <TableCell>
                        <DataBadge variant="outline" color={getStatusColor(sub.status)}>
                          {sub.status}
                        </DataBadge>
                      </TableCell>
                      <TableCell>
                        {sub.currentPeriodEnd
                          ? format(new Date(sub.currentPeriodEnd), "dd/MM/yyyy", {
                              locale: ptBR,
                            })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <DataBadge variant="outline">
                          {sub.provider === "caktos" ? "Caktos" : "Manual"}
                        </DataBadge>
                      </TableCell>
                    </TableRow>
                  ));
                })()}
              </TableBody>
            </Table>
          </ScrollArea>
        </AppCard>
      </div>
    </AdminLayout>
  );
}

