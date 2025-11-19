import { useState, useEffect, startTransition } from "react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Trash2, 
  ShieldOff, 
  Shield, 
  Key, 
  X, 
  User as UserIcon, 
  CreditCard, 
  Lock, 
  AlertTriangle, 
  LogOut, 
  Users,
  Plus,
  Eye,
  Search
} from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
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
import { Label } from "@/components/ui/label";

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
  billingStatus: z.enum(["trial", "active", "paused", "canceled", "overdue", "none"]).optional(),
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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [suspendConfirmOpen, setSuspendConfirmOpen] = useState(false);
  const [reactivateConfirmOpen, setReactivateConfirmOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

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
    enabled: !!selectedUser?.id && editDialogOpen,
    refetchOnWindowFocus: false,
  });

  // Create form
  const createForm = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      whatsappNumber: "",
      planLabel: "",
      billingStatus: "none",
    },
  });

  // Edit form
  const editForm = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      nome: "",
      sobrenome: "",
      email: "",
      whatsappNumber: "",
      plano: "free",
      planLabel: "",
      billingStatus: "none",
      status: "active",
    },
  });

  // Update edit form when user is selected
  useEffect(() => {
    if (selectedUser && editDialogOpen) {
      editForm.reset({
        nome: selectedUser.firstName || selectedUser.name?.split(" ")[0] || "",
        sobrenome: selectedUser.lastName || selectedUser.name?.split(" ").slice(1).join(" ") || "",
        email: selectedUser.email || "",
        whatsappNumber: selectedUser.whatsappNumber || selectedUser.telefone || "",
        plano: selectedUser.plano || "free",
        planLabel: selectedUser.planLabel || "",
        billingStatus: (selectedUser.billingStatus || "none") as any,
        status: selectedUser.billingStatus === "paused" ? "suspended" : "active",
      });
    }
  }, [selectedUser, editDialogOpen]);

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: (data: CreateUserForm) => {
      return apiRequest("POST", "/api/admin/users", {
        name: data.name,
        email: data.email,
        whatsappNumber: data.whatsappNumber || null,
        planLabel: data.planLabel || null,
        billingStatus: data.billingStatus || "none",
      });
    },
    onSuccess: async (data: any) => {
      startTransition(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
        queryClient.refetchQueries({ queryKey: ["/api/admin/users"] });
      });
      
      // Highlight the newly created user
      if (data?.id) {
        setHighlightedId(data.id);
        setTimeout(() => {
          setHighlightedId(null);
        }, 1200);
      }
      
      toast({
        title: "Sucesso!",
        description: "Operação concluída com êxito.",
      });
      setTimeout(() => {
        setCreateDialogOpen(false);
      }, 200);
    },
    onError: (error: any) => {
      toast({
        title: "Erro!",
        description: "Não foi possível completar a ação.",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: EditUserForm) => {
      if (!selectedUser?.id) throw new Error("User not selected");
      const response = await apiRequest("PATCH", `/api/admin/users/${selectedUser.id}`, data);
      return await response.json();
    },
    onSuccess: async (updatedUser) => {
      startTransition(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
        queryClient.refetchQueries({ queryKey: ["/api/admin/users"] });
      });
      
      setSelectedUser(updatedUser);
      
      // Highlight the updated user
      if (updatedUser?.id) {
        setHighlightedId(updatedUser.id);
        setTimeout(() => {
          setHighlightedId(null);
        }, 1200);
      }
      
      toast({
        title: "Sucesso!",
        description: "Operação concluída com êxito.",
      });
      setTimeout(() => {
        setEditDialogOpen(false);
      }, 200);
    },
    onError: (error: any) => {
      toast({
        title: "Erro!",
        description: "Não foi possível completar a ação.",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Sucesso!",
        description: "Operação concluída com êxito.",
      });
      setDeleteConfirmOpen(false);
      setEditDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro!",
        description: "Não foi possível completar a ação.",
        variant: "destructive",
      });
    },
  });

  const suspendUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/admin/users/${id}/suspend`);
      return await response.json();
    },
    onSuccess: async (updatedUser) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setSelectedUser(updatedUser);
      setSuspendConfirmOpen(false);
      toast({
        title: "Sucesso!",
        description: "Operação concluída com êxito.",
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

  const reactivateUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/admin/users/${id}/reactivate`);
      return await response.json();
    },
    onSuccess: async (updatedUser) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setSelectedUser(updatedUser);
      setReactivateConfirmOpen(false);
      toast({
        title: "Sucesso!",
        description: "Operação concluída com êxito.",
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

  const forceLogoutMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/admin/users/${id}/logout`);
      return await response.json();
    },
    onSuccess: (data: any) => {
      setLogoutConfirmOpen(false);
      toast({
        title: "Sucesso!",
        description: "Operação concluída com êxito.",
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

  const resetPasswordMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/admin/users/${id}/reset-password`);
      return await response.json();
    },
    onSuccess: (data: any) => {
      setTempPassword(data.temporaryPassword);
      setResetPasswordDialogOpen(true);
      toast({
        title: "Sucesso!",
        description: "Operação concluída com êxito.",
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

  const handleCreateSubmit = (data: CreateUserForm) => {
    createUserMutation.mutate(data);
  };

  const handleUpdateSubmit = (data: EditUserForm) => {
    updateUserMutation.mutate(data);
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleDelete = () => {
    if (selectedUser?.id) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };

  const handleSuspend = () => {
    if (selectedUser?.id) {
      suspendUserMutation.mutate(selectedUser.id);
    }
  };

  const handleReactivate = () => {
    if (selectedUser?.id) {
      reactivateUserMutation.mutate(selectedUser.id);
    }
  };

  const handleForceLogout = () => {
    if (selectedUser?.id) {
      forceLogoutMutation.mutate(selectedUser.id);
    }
  };

  const handleResetPassword = () => {
    if (selectedUser?.id) {
      resetPasswordMutation.mutate(selectedUser.id);
    }
  };

  return (
    <AdminLayout 
      currentPath="/admin/clientes"
      pageTitle="Clientes"
      pageSubtitle="Gerencie todos os clientes do AnotaTudo.AI."
    >
      <div className="space-y-8 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <PageHeader
          title="Clientes"
          subtitle="Gerencie todos os clientes do AnotaTudo.AI."
          action={
            <Dialog 
              open={createDialogOpen} 
              onOpenChange={(open) => {
                setCreateDialogOpen(open);
                if (!open) {
                  createForm.reset();
                }
              }}
            >
              <DialogTrigger asChild>
                <PremiumButton>
                  <Plus className="h-5 w-5 mr-2" />
                  Novo cliente
                </PremiumButton>
              </DialogTrigger>
              <DialogContent className="max-w-[90%] sm:max-w-[600px] rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Novo Cliente</DialogTitle>
                  <DialogDescription>
                    Crie um novo cliente manualmente.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 md:space-y-6 py-4">
                  <Form {...createForm}>
                    <form id="create-user-form" onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4 md:space-y-5">
                      <FormField
                        control={createForm.control}
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
                        control={createForm.control}
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
                        control={createForm.control}
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
                        control={createForm.control}
                        name="planLabel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Plano</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11 md:h-12 rounded-xl">
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
                        control={createForm.control}
                        name="billingStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status de Cobrança</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11 md:h-12 rounded-xl">
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
                    </form>
                  </Form>
                </div>
                <DialogFooter className="flex flex-col md:flex-row gap-3 md:justify-end mt-6">
                  <PremiumButton
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                    disabled={createUserMutation.isPending}
                    className="w-full md:w-auto"
                  >
                    Cancelar
                  </PremiumButton>
                  <PremiumButton 
                    type="submit"
                    form="create-user-form"
                    disabled={createUserMutation.isPending}
                    className="w-full md:w-auto"
                  >
                    {createUserMutation.isPending ? "Criando..." : "Salvar alterações"}
                  </PremiumButton>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          }
        />

        <div className="space-y-6 mt-8">
          {/* Filters */}
          <AppCard className="p-5 md:p-6 cr-card-animate">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex-1 w-full md:max-w-md">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <PremiumInput
                    placeholder="Buscar por nome, email ou WhatsApp"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-12"
                  />
                </div>
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
          <AppCard className="p-0 overflow-hidden cr-card-animate">
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
                    <>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={`skeleton-${i}`}>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}
                  {error && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-destructive py-8">
                        <div className="flex flex-col items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          <p>Erro ao carregar clientes. Tente novamente.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && !error && (() => {
                    const items = data?.items ?? [];
                    if (items.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                            <div className="flex flex-col items-center gap-2">
                              <Users className="h-8 w-8 opacity-50" />
                              <p className="font-medium">Nenhum cliente encontrado</p>
                              <p className="text-sm">Tente ajustar os filtros de busca</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return items.map((user) => (
                      <TableRow
                        key={user.id}
                        className={`cursor-pointer hover:bg-muted/40 transition-colors ${user.id === highlightedId ? "cr-highlight" : ""}`}
                        onClick={() => openEditDialog(user)}
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
                              openEditDialog(user);
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

        {/* Edit User Dialog - Premium Modal */}
        <Dialog 
          open={editDialogOpen} 
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) {
              editForm.reset();
            }
          }}
        >
          <DialogContent className="max-w-[90%] sm:max-w-[600px] rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-4 mb-2">
                <Avatar className="h-12 w-12 border-2 border-border">
                  <AvatarImage src={selectedUser?.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-base font-semibold">
                    {selectedUser?.firstName?.[0]?.toUpperCase() || selectedUser?.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <DialogTitle className="text-xl font-bold">
                    {selectedUser?.firstName && selectedUser?.lastName
                      ? `${selectedUser.firstName} ${selectedUser.lastName}`
                      : selectedUser?.name || "Cliente"}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    {selectedUser?.email || "-"}
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <DataBadge
                  variant="outline"
                  color={selectedUser ? getBillingStatusColor(selectedUser.billingStatus) : undefined}
                  className="text-xs"
                >
                  {selectedUser?.billingStatus === "paused" ? "Suspenso" : selectedUser?.billingStatus === "active" ? "Ativo" : selectedUser?.billingStatus || "N/A"}
                </DataBadge>
                {selectedUser?.role === "admin" && (
                  <DataBadge variant="outline" color="hsl(217, 91%, 60%)" className="text-xs">
                    Admin
                  </DataBadge>
                )}
              </div>
            </DialogHeader>

            <div className="space-y-4 md:space-y-6 py-4">
              <Tabs defaultValue="informacoes" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="informacoes" className="text-xs sm:text-sm">
                    <UserIcon className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Info</span>
                  </TabsTrigger>
                  <TabsTrigger value="assinatura" className="text-xs sm:text-sm">
                    <CreditCard className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Assinatura</span>
                  </TabsTrigger>
                  <TabsTrigger value="acesso" className="text-xs sm:text-sm">
                    <Lock className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Acesso</span>
                  </TabsTrigger>
                  <TabsTrigger value="acoes" className="text-xs sm:text-sm">
                    <AlertTriangle className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Ações</span>
                  </TabsTrigger>
                </TabsList>

                {/* Tab: Informações - Editable Form */}
                <TabsContent value="informacoes" className="mt-0 space-y-6">
                  <Form {...editForm}>
                    <form onSubmit={editForm.handleSubmit(handleUpdateSubmit)} className="space-y-6">
                      <div className="space-y-4">
                        <SectionTitle title="Dados Pessoais" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      </div>

                      <div className="space-y-4">
                        <SectionTitle title="Contato" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                  Alterar email irá desconectar o cliente.
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
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <SectionTitle title="Plano e Status" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={editForm.control}
                            name="plano"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Plano</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-11 md:h-12 rounded-xl">
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
                            name="billingStatus"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Status de Cobrança</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-11 md:h-12 rounded-xl">
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
                          <FormField
                            control={editForm.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Status de Acesso</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-11 md:h-12 rounded-xl">
                                      <SelectValue placeholder="Selecione o status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="active">Ativo</SelectItem>
                                    <SelectItem value="suspended">Suspenso</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <DialogFooter className="flex flex-col md:flex-row gap-3 md:justify-end mt-6 px-0">
                        <PremiumButton
                          type="button"
                          variant="outline"
                          onClick={() => setEditDialogOpen(false)}
                          disabled={updateUserMutation.isPending}
                          className="w-full md:w-auto"
                        >
                          Cancelar
                        </PremiumButton>
                        <PremiumButton
                          type="submit"
                          disabled={updateUserMutation.isPending}
                          className="w-full md:w-auto"
                        >
                          {updateUserMutation.isPending ? "Salvando..." : "Salvar alterações"}
                        </PremiumButton>
                      </DialogFooter>
                    </form>
                  </Form>
                </TabsContent>

                {/* Tab: Assinatura */}
                <TabsContent value="assinatura" className="mt-0 space-y-6">
                  <div className="space-y-4">
                    <SectionTitle title="Assinaturas" />
                    {detailLoading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Skeleton className="h-4 w-32 mx-auto mb-2" />
                        <Skeleton className="h-4 w-24 mx-auto" />
                      </div>
                    ) : userDetail?.subscriptions && userDetail.subscriptions.length > 0 ? (
                      <div className="space-y-3">
                        {userDetail.subscriptions.map((sub: any) => (
                          <AppCard key={sub.id} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-base">{sub.planName}</p>
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
                          </AppCard>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Nenhuma assinatura encontrada
                      </p>
                    )}
                  </div>
                </TabsContent>

                {/* Tab: Acesso */}
                <TabsContent value="acesso" className="mt-0 space-y-6">
                  <div className="space-y-4">
                    <SectionTitle title="Controle de Acesso" />
                    <AppCard className="p-4">
                      <div className="flex items-center justify-between mb-4">
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

                      <Separator className="my-4" />

                      <div className="space-y-3">
                        {selectedUser?.billingStatus === "paused" ? (
                          <PremiumButton
                            onClick={() => setReactivateConfirmOpen(true)}
                            className="w-full"
                            disabled={reactivateUserMutation.isPending}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            {reactivateUserMutation.isPending ? "Reativando..." : "Reativar Acesso"}
                          </PremiumButton>
                        ) : (
                          <PremiumButton
                            variant="secondary"
                            onClick={() => setSuspendConfirmOpen(true)}
                            className="w-full"
                            disabled={suspendUserMutation.isPending}
                          >
                            <ShieldOff className="h-4 w-4 mr-2" />
                            {suspendUserMutation.isPending ? "Suspender..." : "Suspender Acesso"}
                          </PremiumButton>
                        )}

                        <PremiumButton
                          variant="outline"
                          onClick={() => setLogoutConfirmOpen(true)}
                          className="w-full"
                          disabled={forceLogoutMutation.isPending}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          {forceLogoutMutation.isPending ? "Desconectando..." : "Forçar Logout"}
                        </PremiumButton>
                      </div>
                    </AppCard>
                  </div>
                </TabsContent>

                {/* Tab: Ações */}
                <TabsContent value="acoes" className="mt-0 space-y-6">
                  <div className="space-y-4">
                    <SectionTitle title="Ações Administrativas" />
                    <p className="text-sm text-muted-foreground">
                      Ações críticas que afetam o cliente. Use com cuidado.
                    </p>

                    <div className="space-y-3">
                      <PremiumButton
                        onClick={() => setDeleteConfirmOpen(true)}
                        variant="destructive"
                        className="w-full"
                        disabled={deleteUserMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {deleteUserMutation.isPending ? "Excluindo..." : "Excluir Cliente"}
                      </PremiumButton>

                      <PremiumButton
                        onClick={handleResetPassword}
                        className="w-full"
                        disabled={resetPasswordMutation.isPending}
                      >
                        <Key className="h-4 w-4 mr-2" />
                        {resetPasswordMutation.isPending ? "Resetando..." : "Resetar Senha"}
                      </PremiumButton>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent className="max-w-[90%] sm:max-w-[600px] rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold text-destructive">
                Excluir Cliente
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base mt-2">
                Esta ação não pode ser desfeita. O cliente será permanentemente removido, incluindo:
                <ul className="list-disc list-inside mt-3 space-y-1 text-sm">
                  <li>Todos os dados do cliente</li>
                  <li>Assinaturas vinculadas</li>
                  <li>Histórico de transações</li>
                  <li>Integração WhatsApp</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col md:flex-row gap-3 md:justify-end mt-6">
              <AlertDialogCancel asChild>
                <PremiumButton variant="outline" className="w-full md:w-auto">
                  Cancelar
                </PremiumButton>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <PremiumButton
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteUserMutation.isPending}
                  className="w-full md:w-auto"
                >
                  {deleteUserMutation.isPending ? "Excluindo..." : "Excluir Cliente"}
                </PremiumButton>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Suspend Confirmation Dialog */}
        <AlertDialog open={suspendConfirmOpen} onOpenChange={setSuspendConfirmOpen}>
          <AlertDialogContent className="max-w-[90%] sm:max-w-[600px] rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold">
                Suspender Acesso
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base mt-2">
                O cliente terá o acesso suspenso e será desconectado de todas as sessões ativas.
                Ele não poderá fazer login até que o acesso seja reativado.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col md:flex-row gap-3 md:justify-end mt-6">
              <AlertDialogCancel asChild>
                <PremiumButton variant="outline" className="w-full md:w-auto">
                  Cancelar
                </PremiumButton>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <PremiumButton
                  onClick={handleSuspend}
                  disabled={suspendUserMutation.isPending}
                  className="w-full md:w-auto"
                >
                  {suspendUserMutation.isPending ? "Suspender..." : "Suspender Acesso"}
                </PremiumButton>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reactivate Confirmation Dialog */}
        <AlertDialog open={reactivateConfirmOpen} onOpenChange={setReactivateConfirmOpen}>
          <AlertDialogContent className="max-w-[90%] sm:max-w-[600px] rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold">
                Reativar Acesso
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base mt-2">
                O cliente terá o acesso reativado e poderá fazer login novamente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col md:flex-row gap-3 md:justify-end mt-6">
              <AlertDialogCancel asChild>
                <PremiumButton variant="outline" className="w-full md:w-auto">
                  Cancelar
                </PremiumButton>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <PremiumButton
                  onClick={handleReactivate}
                  disabled={reactivateUserMutation.isPending}
                  className="w-full md:w-auto"
                >
                  {reactivateUserMutation.isPending ? "Reativando..." : "Reativar Acesso"}
                </PremiumButton>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Force Logout Confirmation Dialog */}
        <AlertDialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
          <AlertDialogContent className="max-w-[90%] sm:max-w-[600px] rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold">
                Forçar Logout
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base mt-2">
                O cliente será desconectado de todas as sessões ativas. Ele precisará fazer login novamente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col md:flex-row gap-3 md:justify-end mt-6">
              <AlertDialogCancel asChild>
                <PremiumButton variant="outline" className="w-full md:w-auto">
                  Cancelar
                </PremiumButton>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <PremiumButton
                  onClick={handleForceLogout}
                  disabled={forceLogoutMutation.isPending}
                  className="w-full md:w-auto"
                >
                  {forceLogoutMutation.isPending ? "Desconectando..." : "Forçar Logout"}
                </PremiumButton>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reset Password Dialog */}
        <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
          <DialogContent className="max-w-[90%] sm:max-w-[600px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Senha Resetada</DialogTitle>
              <DialogDescription>
                Uma nova senha foi gerada para o cliente. Compartilhe esta senha de forma segura.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
                <Label className="text-sm font-semibold mb-2 block">Nova Senha Temporária</Label>
                <div className="flex items-center gap-2">
                  <PremiumInput
                    value={tempPassword || ""}
                    readOnly
                    className="font-mono text-lg"
                  />
                  <PremiumButton
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (tempPassword) {
                        navigator.clipboard.writeText(tempPassword);
                        toast({
                          title: "Senha copiada!",
                          description: "A senha foi copiada para a área de transferência.",
                        });
                      }
                    }}
                  >
                    <Key className="h-4 w-4" />
                  </PremiumButton>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  ⚠️ Esta senha será exibida apenas uma vez. Certifique-se de salvá-la em local seguro.
                </p>
              </div>
            </div>
            <DialogFooter className="flex flex-col md:flex-row gap-3 md:justify-end mt-6">
              <PremiumButton
                variant="outline"
                onClick={() => setResetPasswordDialogOpen(false)}
                className="w-full md:w-auto"
              >
                Fechar
              </PremiumButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

