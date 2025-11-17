import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/design-system/PageHeader";
import { AppCard } from "@/components/design-system/AppCard";
import { PremiumInput } from "@/components/design-system/PremiumInput";
import { PremiumButton } from "@/components/design-system/PremiumButton";
import { DataBadge } from "@/components/design-system/DataBadge";
import { SectionTitle } from "@/components/design-system/SectionTitle";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trash2, ShieldOff, Shield, Key, X, User as UserIcon, CreditCard, Lock, AlertTriangle, LogOut } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Eye } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const createUserSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  whatsappNumber: z.string().optional(),
  planLabel: z.string().optional(),
  billingStatus: z.enum(["trial", "active", "paused", "canceled", "overdue", "none"]).optional(),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

const editUserSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  sobrenome: z.string().optional(),
  email: z.string().email("Email inválido"),
  whatsappNumber: z.string().optional(),
  plano: z.string().optional(),
  planLabel: z.string().optional(),
  status: z.enum(["active", "suspended"]).optional(),
});

type EditUserForm = z.infer<typeof editUserSchema>;

type User = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string;
  email: string;
  whatsappNumber: string | null;
  telefone?: string | null;
  billingStatus: string;
  planLabel: string | null;
  plano?: string | null;
  role?: string;
  status?: string;
  profileImageUrl?: string | null;
  createdAt: string;
};

type UserDetail = {
  user: any;
  subscriptions: any[];
  eventsRecentes: any[];
};

const getBillingStatusColor = (status: string) => {
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

export default function AdminClientes() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userActionsOpen, setUserActionsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<{ items: User[]; pagination: any }>({
    queryKey: ["/api/admin/users", { search, status: statusFilter === "all" ? undefined : statusFilter, page }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "50",
      });
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);
      
      const response = await apiRequest("GET", `/api/admin/users?${params.toString()}`);
      return await response.json();
    },
  });

  const { data: userDetail, isLoading: detailLoading } = useQuery<UserDetail>({
    queryKey: ["/api/admin/users", selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser?.id) return null;
      const response = await apiRequest("GET", `/api/admin/users/${selectedUser.id}`);
      return await response.json();
    },
    enabled: !!selectedUser?.id && userActionsOpen,
    refetchOnWindowFocus: false,
  });

  // Edit form for user information
  const editForm = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      nome: "",
      sobrenome: "",
      email: "",
      whatsappNumber: "",
      plano: "free",
      planLabel: "",
      status: "active",
    },
  });

  // Update form when user is selected
  useEffect(() => {
    if (selectedUser && userActionsOpen) {
      editForm.reset({
        nome: selectedUser.firstName || selectedUser.name?.split(" ")[0] || "",
        sobrenome: selectedUser.lastName || selectedUser.name?.split(" ").slice(1).join(" ") || "",
        email: selectedUser.email || "",
        whatsappNumber: selectedUser.whatsappNumber || selectedUser.telefone || "",
        plano: selectedUser.plano || "free",
        planLabel: selectedUser.planLabel || "",
        status: selectedUser.billingStatus === "paused" ? "suspended" : "active",
      });
    }
  }, [selectedUser, userActionsOpen]);

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      whatsappNumber: "",
      planLabel: "",
      billingStatus: "none",
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (data: CreateUserForm) => {
      const [firstName, ...lastNameParts] = data.name.split(" ");
      return apiRequest("POST", "/api/admin/users", {
        name: data.name,
        email: data.email,
        whatsappNumber: data.whatsappNumber || null,
        planLabel: data.planLabel || null,
        billingStatus: data.billingStatus || "none",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Cliente criado!",
        description: "O cliente foi criado com sucesso.",
      });
      setCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar cliente",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const handleCreateSubmit = (data: CreateUserForm) => {
    createUserMutation.mutate(data);
  };

  const openUserPanel = (user: User) => {
    setSelectedUser(user);
    setUserActionsOpen(true);
    // Reset form with user data
    editForm.reset({
      nome: user.firstName || user.name?.split(" ")[0] || "",
      sobrenome: user.lastName || user.name?.split(" ").slice(1).join(" ") || "",
      email: user.email || "",
      whatsappNumber: user.whatsappNumber || user.telefone || "",
      plano: user.plano || "free",
      planLabel: user.planLabel || "",
      status: user.billingStatus === "paused" ? "suspended" : "active",
    });
  };

  const handleDeleteUser = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/users/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Cliente excluído",
        description: "O cliente foi excluído com sucesso.",
      });
      setUserActionsOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir cliente",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: EditUserForm) => {
      if (!selectedUser?.id) throw new Error("User not selected");
      const response = await apiRequest("PATCH", `/api/admin/users/${selectedUser.id}`, data);
      return await response.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      // Update selected user with new data
      setSelectedUser(updatedUser);
      toast({
        title: "Cliente atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar cliente",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const handleUpdateUser = (data: EditUserForm) => {
    updateUserMutation.mutate(data);
  };

  const handleSuspendUser = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/admin/users/${id}/suspend`);
      return await response.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setSelectedUser(updatedUser);
      toast({
        title: "Acesso suspenso",
        description: "O acesso do cliente foi suspenso com sucesso. Todas as sessões foram encerradas.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao suspender acesso",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const handleReactivateUser = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/admin/users/${id}/reactivate`);
      return await response.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setSelectedUser(updatedUser);
      toast({
        title: "Acesso reativado",
        description: "O acesso do cliente foi reativado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao reativar acesso",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const handleForceLogout = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/admin/users/${id}/logout`);
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Logout forçado",
        description: `O cliente foi desconectado. ${data.sessionsDeleted || 0} sessão(ões) encerrada(s).`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao forçar logout",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const handleResetPassword = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/admin/users/${id}/reset-password`);
      return await response.json();
    },
    onSuccess: (data: any) => {
      setTempPassword(data.temporaryPassword);
      setResetPasswordDialogOpen(true);
      toast({
        title: "Senha resetada",
        description: "Uma nova senha foi gerada e está sendo exibida.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao resetar senha",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  return (
    <AdminLayout currentPath="/admin/clientes">
      <PageHeader
        title="Clientes"
        subtitle="Gerencie todos os clientes do AnotaTudo.AI."
        action={
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <PremiumButton>
                <Plus className="h-5 w-5 mr-2" />
                Novo cliente
              </PremiumButton>
            </DialogTrigger>
            <DialogContent className="rounded-2xl max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Cliente</DialogTitle>
                <DialogDescription>
                  Crie um novo cliente manualmente.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome *</FormLabel>
                        <FormControl>
                          <PremiumInput {...field} placeholder="Nome completo" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <PremiumInput type="email" {...field} placeholder="email@exemplo.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="whatsappNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp</FormLabel>
                        <FormControl>
                          <PremiumInput {...field} placeholder="+55 11 99999-9999" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="planLabel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plano</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o plano" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="billingStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status de Cobrança</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Nenhum</SelectItem>
                            <SelectItem value="trial">Teste</SelectItem>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="paused">Pausado</SelectItem>
                            <SelectItem value="canceled">Cancelado</SelectItem>
                            <SelectItem value="overdue">Atrasado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-3 justify-end pt-4">
                    <PremiumButton
                      type="button"
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                    >
                      Cancelar
                    </PremiumButton>
                    <PremiumButton type="submit" disabled={createUserMutation.isPending}>
                      {createUserMutation.isPending ? "Criando..." : "Criar"}
                    </PremiumButton>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="space-y-6 mt-8">
        {/* Filters */}
        <AppCard className="p-5 md:p-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1 w-full md:max-w-md">
              <PremiumInput
                searchIcon
                placeholder="Buscar por nome, email ou WhatsApp"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full md:w-auto">
              <TabsList className="grid w-full md:w-auto grid-cols-3 md:grid-cols-6">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="active">Ativos</TabsTrigger>
                <TabsTrigger value="trial">Teste</TabsTrigger>
                <TabsTrigger value="overdue">Atrasados</TabsTrigger>
                <TabsTrigger value="canceled">Cancelados</TabsTrigger>
                <TabsTrigger value="paused">Pausados</TabsTrigger>
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
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Carregando clientes...
                    </TableCell>
                  </TableRow>
                )}
                {error && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-red-600 py-8">
                      Erro ao carregar clientes. Tente novamente.
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && !error && (() => {
                  const items = data?.items ?? data?.users ?? [];
                  if (items.length === 0) {
                    return (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Nenhum cliente encontrado
                        </TableCell>
                      </TableRow>
                    );
                  }
                  return items.map((user) => (
                    <TableRow
                      key={user.id}
                      className="cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => openUserPanel(user)}
                    >
                      <TableCell className="font-medium">
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.name || "-"}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.whatsappNumber || "-"}</TableCell>
                      <TableCell>{user.planLabel || "-"}</TableCell>
                      <TableCell>
                        <DataBadge
                          variant="outline"
                          color={getBillingStatusColor(user.billingStatus)}
                        >
                          {user.billingStatus}
                        </DataBadge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(user.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <PremiumButton
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            openUserPanel(user);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </PremiumButton>
                      </TableCell>
                    </TableRow>
                  ));
                })()}
              </TableBody>
            </Table>
          </ScrollArea>
        </AppCard>

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Página {data.pagination.page} de {data.pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <PremiumButton
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </PremiumButton>
              <PremiumButton
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
              >
                Próxima
              </PremiumButton>
            </div>
          </div>
        )}
      </div>

      {/* User Premium Drawer - Full Featured Panel */}
      <Drawer open={userActionsOpen} onOpenChange={setUserActionsOpen}>
        <DrawerContent className="p-0 max-h-[90vh] flex flex-col">
          {/* Premium Header with Avatar */}
          <div className="px-6 pt-6 pb-4 border-b bg-gradient-to-b from-background to-muted/20">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-border">
                  <AvatarImage src={selectedUser?.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                    {selectedUser?.firstName?.[0]?.toUpperCase() || selectedUser?.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <DrawerTitle className="text-2xl font-bold mb-1">
                    {selectedUser?.firstName && selectedUser?.lastName
                      ? `${selectedUser.firstName} ${selectedUser.lastName}`
                      : selectedUser?.name || "Cliente"}
                  </DrawerTitle>
                  <DrawerDescription className="text-base text-muted-foreground">
                    {selectedUser?.email || "-"}
                  </DrawerDescription>
                </div>
              </div>
              <DrawerClose asChild>
                <PremiumButton variant="ghost" size="icon" className="rounded-full">
                  <X className="h-5 w-5" />
                </PremiumButton>
              </DrawerClose>
            </div>
            <div className="flex items-center gap-2">
              <DataBadge
                variant="outline"
                color={selectedUser ? getBillingStatusColor(selectedUser.billingStatus) : undefined}
                className="text-sm font-medium"
              >
                {selectedUser?.billingStatus === "paused" ? "Suspenso" : selectedUser?.billingStatus === "active" ? "Ativo" : selectedUser?.billingStatus || "N/A"}
              </DataBadge>
              {selectedUser?.role === "admin" && (
                <DataBadge variant="outline" color="hsl(217, 91%, 60%)">
                  Admin
                </DataBadge>
              )}
            </div>
          </div>

          {/* Tabs Navigation */}
          <Tabs defaultValue="informacoes" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 border-b">
              <TabsList className="grid w-full grid-cols-4 h-auto">
                <TabsTrigger value="informacoes" className="flex items-center gap-2 py-3">
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Informações</span>
                </TabsTrigger>
                <TabsTrigger value="assinatura" className="flex items-center gap-2 py-3">
                  <CreditCard className="h-4 w-4" />
                  <span className="hidden sm:inline">Assinatura</span>
                </TabsTrigger>
                <TabsTrigger value="acesso" className="flex items-center gap-2 py-3">
                  <Lock className="h-4 w-4" />
                  <span className="hidden sm:inline">Acesso</span>
                </TabsTrigger>
                <TabsTrigger value="acoes" className="flex items-center gap-2 py-3">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="hidden sm:inline">Ações</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6">
                {/* Tab: Informações - Editable Form */}
                <TabsContent value="informacoes" className="mt-0 space-y-6">
                  <Form {...editForm}>
                    <form onSubmit={editForm.handleSubmit(handleUpdateUser)} className="space-y-6">
                      <AppCard className="p-5 md:p-6">
                        <SectionTitle title="Dados Pessoais" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <FormField
                            control={editForm.control}
                            name="nome"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome *</FormLabel>
                                <FormControl>
                                  <PremiumInput {...field} placeholder="Nome" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={editForm.control}
                            name="sobrenome"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Sobrenome</FormLabel>
                                <FormControl>
                                  <PremiumInput {...field} placeholder="Sobrenome" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </AppCard>

                      <AppCard className="p-5 md:p-6">
                        <SectionTitle title="Contato" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <FormField
                            control={editForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email *</FormLabel>
                                <FormControl>
                                  <PremiumInput type="email" {...field} placeholder="email@exemplo.com" />
                                </FormControl>
                                <FormMessage />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Alterar email irá desconectar o cliente e atualizar o mapeamento WhatsApp.
                                </p>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={editForm.control}
                            name="whatsappNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>WhatsApp</FormLabel>
                                <FormControl>
                                  <PremiumInput {...field} placeholder="+55 11 99999-9999" />
                                </FormControl>
                                <FormMessage />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Atualizar WhatsApp sincroniza com o sistema de mensagens.
                                </p>
                              </FormItem>
                            )}
                          />
                        </div>
                      </AppCard>

                      <AppCard className="p-5 md:p-6">
                        <SectionTitle title="Plano e Status" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <FormField
                            control={editForm.control}
                            name="plano"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Plano</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o plano" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="free">Free</SelectItem>
                                    <SelectItem value="premium">Premium</SelectItem>
                                    <SelectItem value="enterprise">Enterprise</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={editForm.control}
                            name="planLabel"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Rótulo do Plano</FormLabel>
                                <FormControl>
                                  <PremiumInput {...field} placeholder="Ex: Plano Anual" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={editForm.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>Status de Acesso</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="active">Ativo</SelectItem>
                                    <SelectItem value="suspended">Suspenso</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Usuários suspensos terão acesso bloqueado e serão desconectados.
                                </p>
                              </FormItem>
                            )}
                          />
                        </div>
                      </AppCard>

                      <DrawerFooter className="px-0 pb-0">
                        <PremiumButton
                          type="submit"
                          disabled={updateUserMutation.isPending}
                          className="w-full"
                        >
                          {updateUserMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                        </PremiumButton>
                      </DrawerFooter>
                    </form>
                  </Form>
                </TabsContent>

                {/* Tab: Assinatura */}
                <TabsContent value="assinatura" className="mt-0 space-y-6">
                  <AppCard className="p-5 md:p-6">
                    <SectionTitle title="Assinaturas" />
                    {detailLoading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Carregando assinaturas...
                      </div>
                    ) : userDetail?.subscriptions && userDetail.subscriptions.length > 0 ? (
                      <div className="space-y-3 mt-4">
                        {userDetail.subscriptions.map((sub: any) => (
                          <div
                            key={sub.id}
                            className="p-4 rounded-xl border border-border/50 hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-lg">{sub.planName}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {formatCurrency(sub.priceCents / 100)} /{" "}
                                  {sub.billingInterval === "month" ? "mês" : "ano"}
                                </p>
                                {sub.currentPeriodEnd && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Próximo vencimento:{" "}
                                    {format(new Date(sub.currentPeriodEnd), "dd/MM/yyyy", {
                                      locale: ptBR,
                                    })}
                                  </p>
                                )}
                              </div>
                              <DataBadge
                                variant="outline"
                                color={getBillingStatusColor(sub.status)}
                              >
                                {sub.status}
                              </DataBadge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-4 text-center py-8">
                        Nenhuma assinatura encontrada
                      </p>
                    )}
                  </AppCard>
                </TabsContent>

                {/* Tab: Acesso */}
                <TabsContent value="acesso" className="mt-0 space-y-6">
                  <AppCard className="p-5 md:p-6">
                    <SectionTitle title="Controle de Acesso" />
                    <div className="space-y-4 mt-4">
                      <div className="p-4 rounded-xl border border-border/50 bg-muted/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Status Atual</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {selectedUser?.billingStatus === "paused"
                                ? "Acesso suspenso - Cliente não pode fazer login"
                                : "Acesso ativo - Cliente pode usar o sistema normalmente"}
                            </p>
                          </div>
                          <DataBadge
                            variant="outline"
                            color={selectedUser ? getBillingStatusColor(selectedUser.billingStatus) : undefined}
                          >
                            {selectedUser?.billingStatus === "paused" ? "Suspenso" : "Ativo"}
                          </DataBadge>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        {selectedUser?.billingStatus === "paused" ? (
                          <PremiumButton
                            onClick={() => {
                              if (selectedUser?.id) {
                                handleReactivateUser.mutate(selectedUser.id);
                              }
                            }}
                            className="w-full"
                            disabled={handleReactivateUser.isPending}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            {handleReactivateUser.isPending ? "Reativando..." : "Reativar Acesso"}
                          </PremiumButton>
                        ) : (
                          <PremiumButton
                            variant="secondary"
                            onClick={() => {
                              if (selectedUser?.id && confirm("Tem certeza que deseja suspender o acesso deste cliente?")) {
                                handleSuspendUser.mutate(selectedUser.id);
                              }
                            }}
                            className="w-full"
                            disabled={handleSuspendUser.isPending}
                          >
                            <ShieldOff className="h-4 w-4 mr-2" />
                            {handleSuspendUser.isPending ? "Suspender..." : "Suspender Acesso"}
                          </PremiumButton>
                        )}

                        <PremiumButton
                          variant="outline"
                          onClick={() => {
                            if (selectedUser?.id && confirm("Deseja desconectar este cliente de todas as sessões?")) {
                              handleForceLogout.mutate(selectedUser.id);
                            }
                          }}
                          className="w-full"
                          disabled={handleForceLogout.isPending}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          {handleForceLogout.isPending ? "Desconectando..." : "Forçar Logout"}
                        </PremiumButton>
                      </div>
                    </div>
                  </AppCard>
                </TabsContent>

                {/* Tab: Ações */}
                <TabsContent value="acoes" className="mt-0 space-y-6">
                  <AppCard className="p-5 md:p-6">
                    <SectionTitle title="Ações Administrativas" />
                    <p className="text-sm text-muted-foreground mt-2 mb-6">
                      Ações críticas que afetam o cliente. Use com cuidado.
                    </p>

                    <div className="space-y-3">
                      <PremiumButton
                        onClick={() => {
                          if (selectedUser?.id) {
                            setDeleteConfirmOpen(true);
                          }
                        }}
                        variant="destructive"
                        className="w-full"
                        disabled={handleDeleteUser.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {handleDeleteUser.isPending ? "Excluindo..." : "Excluir Cliente"}
                      </PremiumButton>

                      <PremiumButton
                        onClick={() => {
                          if (selectedUser?.id && confirm("Tem certeza que deseja resetar a senha deste cliente? Uma nova senha será gerada e exibida.")) {
                            handleResetPassword.mutate(selectedUser.id);
                          }
                        }}
                        className="w-full"
                        disabled={handleResetPassword.isPending}
                      >
                        <Key className="h-4 w-4 mr-2" />
                        {handleResetPassword.isPending ? "Resetando..." : "Resetar Senha"}
                      </PremiumButton>
                    </div>
                  </AppCard>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-destructive">
              Excluir Cliente
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Esta ação não pode ser desfeita. O cliente será permanentemente removido, incluindo:
              <ul className="list-disc list-inside mt-3 space-y-1 text-sm">
                <li>Todos os dados do cliente</li>
                <li>Assinaturas vinculadas</li>
                <li>Histórico de transações</li>
                <li>Integração WhatsApp</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end pt-4">
            <PremiumButton
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={handleDeleteUser.isPending}
            >
              Cancelar
            </PremiumButton>
            <PremiumButton
              variant="destructive"
              onClick={() => {
                if (selectedUser?.id) {
                  handleDeleteUser.mutate(selectedUser.id);
                  setDeleteConfirmOpen(false);
                }
              }}
              disabled={handleDeleteUser.isPending}
            >
              {handleDeleteUser.isPending ? "Excluindo..." : "Confirmar Exclusão"}
            </PremiumButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Senha Resetada</DialogTitle>
            <DialogDescription className="text-base mt-2">
              Uma nova senha temporária foi gerada para o cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="p-4 bg-muted rounded-xl border-2 border-primary/20">
              <p className="text-sm font-medium text-muted-foreground mb-2">Nova Senha Temporária:</p>
              <p className="text-2xl font-mono font-bold text-primary break-all">
                {tempPassword || "N/A"}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              ⚠️ Anote esta senha agora. Ela não será exibida novamente. O cliente deve alterá-la no primeiro login.
            </p>
          </div>
          <DrawerFooter className="px-0 pb-0 pt-4">
            <PremiumButton
              onClick={() => {
                setResetPasswordDialogOpen(false);
                setTempPassword(null);
              }}
              className="w-full"
            >
              Fechar
            </PremiumButton>
          </DrawerFooter>
        </DialogContent>
      </Dialog>

    </AdminLayout>
  );
}

