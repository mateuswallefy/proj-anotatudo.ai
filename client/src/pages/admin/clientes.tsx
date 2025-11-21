import { useState, useEffect, startTransition } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StripeSectionCard } from "@/components/admin/StripeSectionCard";
import { StripeStatusBadge } from "@/components/admin/StripeStatusBadge";
import { StripeEmptyState } from "@/components/admin/StripeEmptyState";
import { PremiumInput } from "@/components/design-system/PremiumInput";
import { PremiumButton } from "@/components/design-system/PremiumButton";
import { Button } from "@/components/ui/button";
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
  interval: z.enum(["monthly", "yearly"]).optional().default("monthly"),
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
  interval: z.enum(["monthly", "yearly"]).optional(),
});

type EditUserForm = z.infer<typeof editUserSchema>;

type User = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string; // Backend returns formatted name
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [accessStatusFilter, setAccessStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [billingStatusFilter, setBillingStatusFilter] = useState<string>("all");
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

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, error } = useQuery<{ items: User[]; pagination: any }>({
    queryKey: ["/api/admin/users", { 
      q: debouncedSearch, 
      status: statusFilter === "all" ? undefined : statusFilter,
      accessStatus: accessStatusFilter === "all" ? undefined : accessStatusFilter,
      plan: planFilter === "all" ? undefined : planFilter,
      billingStatus: billingStatusFilter === "all" ? undefined : billingStatusFilter,
      page 
    }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "50",
      });
      if (debouncedSearch) params.append("q", debouncedSearch);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (accessStatusFilter !== "all") params.append("accessStatus", accessStatusFilter);
      if (planFilter !== "all") params.append("plan", planFilter);
      if (billingStatusFilter !== "all") params.append("billingStatus", billingStatusFilter);
      
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

  // Update edit form when user is selected or userDetail is loaded
  useEffect(() => {
    if (selectedUser && editDialogOpen) {
      // Use userDetail if available (has firstName/lastName), otherwise use selectedUser
      const userData = userDetail?.user || selectedUser;
      editForm.reset({
        nome: userData.firstName || userData.name?.split(" ")[0] || "",
        sobrenome: userData.lastName || userData.name?.split(" ").slice(1).join(" ") || "",
        email: userData.email || "",
        whatsappNumber: userData.whatsappNumber || userData.telefone || "",
        plano: userData.plano || "free",
        planLabel: userData.planLabel || "",
        billingStatus: (userData.billingStatus || "none") as any,
      });
    }
  }, [selectedUser, editDialogOpen, userDetail]);

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserForm) => {
      try {
        const response = await apiRequest("POST", "/api/admin/users", {
          name: data.name,
          email: data.email,
          whatsappNumber: data.whatsappNumber || null,
          planLabel: data.planLabel || null,
          billingStatus: data.billingStatus || "active",
          interval: data.interval || "monthly",
        });
        
        const result = await response.json();
        
        if (!result.success && result.message) {
          throw new Error(result.message);
        }
        
        return result;
      } catch (error: any) {
        // Try to extract error message from response
        let errorMessage = error?.message || "Erro ao criar cliente";
        
        // If error message contains status code, try to parse JSON
        if (errorMessage.includes(':')) {
          try {
            const parts = errorMessage.split(':');
            if (parts.length > 1) {
              const jsonPart = parts.slice(1).join(':').trim();
              const parsed = JSON.parse(jsonPart);
              if (parsed.message) {
                errorMessage = parsed.message;
              }
            }
          } catch {
            // Ignore parse errors
          }
        }
        
        throw new Error(errorMessage);
      }
    },
    onSuccess: async (data: any) => {
      // Force refetch of all related queries
      startTransition(() => {
        Promise.all([
          queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] }),
          queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] }),
          queryClient.refetchQueries({ queryKey: ["/api/admin/users"] }),
          queryClient.refetchQueries({ queryKey: ["/api/admin/subscriptions"] }),
        ]);
      });
      
      // If temporary password is returned, show it in dialog
      if (data.temporaryPassword) {
        setTempPassword(data.temporaryPassword);
        setResetPasswordDialogOpen(true);
      }
      
      // Highlight the newly created user
      if (data.id) {
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
      console.error("[Admin] ❌ Error creating user:", error);
      console.error("[Admin] Error details:", {
        message: error?.message,
        stack: error?.stack,
        raw: error,
      });
      toast({
        title: "Erro!",
        description: "Não foi possível completar a ação.",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: EditUserForm) => {
      if (!selectedUser?.id) throw new Error("Usuário não selecionado");
      
      try {
        const response = await apiRequest("PATCH", `/api/admin/users/${selectedUser.id}`, data);
        const result = await response.json();
        
        if (!result.success && result.message) {
          throw new Error(result.message);
        }
        
        return result;
      } catch (error: any) {
        let errorMessage = error?.message || "Erro ao atualizar cliente";
        
        // Try to parse error message
        if (errorMessage.includes(':')) {
          try {
            const parts = errorMessage.split(':');
            if (parts.length > 1) {
              const jsonPart = parts.slice(1).join(':').trim();
              const parsed = JSON.parse(jsonPart);
              if (parsed.message) {
                errorMessage = parsed.message;
              }
            }
          } catch {
            // Ignore parse errors
          }
        }
        
        throw new Error(errorMessage);
      }
    },
    onSuccess: async (updatedUser: any) => {
      // Force refetch of all related queries
      startTransition(() => {
        Promise.all([
          queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] }),
          queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] }),
          queryClient.invalidateQueries({ queryKey: ["/api/admin/users", selectedUser?.id] }),
          queryClient.refetchQueries({ queryKey: ["/api/admin/users"] }),
          queryClient.refetchQueries({ queryKey: ["/api/admin/subscriptions"] }),
        ]);
      });
      
      // Update selected user with new data
      if (updatedUser.id) {
        setSelectedUser(updatedUser);
        // Highlight the updated user
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
      console.error("[Admin] ❌ Error updating user:", error);
      toast({
        title: "Erro!",
        description: "Não foi possível completar a ação.",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        const response = await apiRequest("DELETE", `/api/admin/users/${id}`);
        const result = await response.json();
        
        if (!result.success && result.message) {
          throw new Error(result.message);
        }
        
        return result;
      } catch (error: any) {
        let errorMessage = error?.message || "Erro ao excluir cliente";
        
        // Try to parse error message
        if (errorMessage.includes(':')) {
          try {
            const parts = errorMessage.split(':');
            if (parts.length > 1) {
              const jsonPart = parts.slice(1).join(':').trim();
              const parsed = JSON.parse(jsonPart);
              if (parsed.message) {
                errorMessage = parsed.message;
              }
            }
          } catch {
            // Ignore parse errors
          }
        }
        
        throw new Error(errorMessage);
      }
    },
    onSuccess: async () => {
      // Force refetch of all related queries
      startTransition(() => {
        Promise.all([
          queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] }),
          queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] }),
          queryClient.refetchQueries({ queryKey: ["/api/admin/users"] }),
          queryClient.refetchQueries({ queryKey: ["/api/admin/subscriptions"] }),
        ]);
      });
      
      toast({
        title: "Sucesso!",
        description: "Operação concluída com êxito.",
      });
      setDeleteConfirmOpen(false);
      setEditDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      console.error("[Admin] ❌ Error deleting user:", error);
      console.error("[Admin] Delete error details:", {
        message: error?.message,
        stack: error?.stack,
        raw: error,
      });
      toast({
        title: "Erro!",
        description: "Não foi possível completar a ação.",
        variant: "destructive",
      });
      // Don't close dialogs on error
    },
  });

  const suspendUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/admin/users/${id}/suspend`);
      return await response.json();
    },
    onSuccess: async (updatedUser) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] }),
      ]);
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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] }),
      ]);
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

  const regeneratePasswordMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/admin/users/${id}/regenerate-password`);
      return await response.json();
    },
    onSuccess: (data: any) => {
      setTempPassword(data.temporaryPassword);
      setResetPasswordDialogOpen(true);
      toast({
        title: "Sucesso!",
        description: "Operação concluída com êxito.",
      });
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", selectedUser?.id] });
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
    // Prevent multiple submissions
    if (createUserMutation.isPending) {
      return;
    }
    createUserMutation.mutate(data);
  };

  const handleUpdateSubmit = (data: EditUserForm) => {
    // Prevent multiple submissions
    if (updateUserMutation.isPending) {
      return;
    }
    updateUserMutation.mutate(data);
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleDelete = () => {
    if (selectedUser?.id && !deleteUserMutation.isPending) {
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

  const handleRegeneratePassword = () => {
    if (selectedUser?.id) {
      regeneratePasswordMutation.mutate(selectedUser.id);
    }
  };

  return (
    <AdminLayout 
      currentPath="/admin/clientes"
      pageTitle="Clientes"
      pageSubtitle="Gerencie todos os clientes do AnotaTudo.AI."
    >
      <AdminPageHeader
          title="Clientes"
        subtitle="Gerencie assinaturas, status e acesso dos seus clientes."
        actions={
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
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                  Novo cliente
              </Button>
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
                    <form 
                      id="create-user-form" 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (createUserMutation.isPending) {
                          return;
                        }
                        createForm.handleSubmit(handleCreateSubmit)(e);
                      }} 
                      className="space-y-4 md:space-y-5"
                    >
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
                      <FormField
                        control={createForm.control}
                        name="interval"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Intervalo</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || "monthly"}>
                              <FormControl>
                                <SelectTrigger className="h-11 md:h-12 rounded-xl">
                                  <SelectValue placeholder="Selecione o intervalo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="monthly">Mensal</SelectItem>
                                <SelectItem value="yearly">Anual</SelectItem>
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
          <StripeSectionCard>
            <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex-1 w-full md:max-w-md">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <PremiumInput
                    placeholder="Buscar por nome, email ou WhatsApp..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                    }}
                      className="pl-10"
                  />
                </div>
              </div>
            </div>
            
            {/* Advanced Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status de Acesso</Label>
                <Select value={accessStatusFilter} onValueChange={(value) => { setAccessStatusFilter(value); setPage(1); }}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="authenticated">Ativo</SelectItem>
                    <SelectItem value="awaiting_email">Aguardando e-mail</SelectItem>
                    <SelectItem value="suspended">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Plano</Label>
                <Select value={planFilter} onValueChange={(value) => { setPlanFilter(value); setPage(1); }}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status de Cobrança</Label>
                <Select value={billingStatusFilter} onValueChange={(value) => { setBillingStatusFilter(value); setPage(1); }}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="trial">Teste</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="paused">Pausado</SelectItem>
                    <SelectItem value="canceled">Cancelado</SelectItem>
                    <SelectItem value="overdue">Atrasado</SelectItem>
                    <SelectItem value="none">Nenhum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status (Legado)</Label>
                <Tabs value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">Todos</TabsTrigger>
                    <TabsTrigger value="active">Ativos</TabsTrigger>
                    <TabsTrigger value="paused">Pausados</TabsTrigger>
                  </TabsList>
                </Tabs>
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
                    <TableHead className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">Nome</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">Email</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">WhatsApp</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">Plano</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">Status</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">Criado em</TableHead>
                    <TableHead className="text-right text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">Ações</TableHead>
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
                          <TableCell colSpan={7} className="p-0">
                            <StripeEmptyState
                              icon={Users}
                              title="Nenhum cliente encontrado"
                              subtitle="Tente ajustar os filtros de busca"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return items.map((user) => (
                      <TableRow
                        key={user.id}
                        className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${user.id === highlightedId ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                        onClick={() => openEditDialog(user)}
                      >
                        <TableCell className="font-medium">
                          {(() => {
                            if (user.firstName && user.lastName) {
                              return `${user.firstName} ${user.lastName}`;
                            }
                            if (user.name) {
                              return user.name;
                            }
                            return user.email?.split("@")[0] || "-";
                          })()}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.whatsappNumber || "-"}</TableCell>
                        <TableCell>{user.planLabel || "-"}</TableCell>
                        <TableCell>
                          <StripeStatusBadge
                            status={user.billingStatus}
                          />
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
          </StripeSectionCard>

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
          <DialogContent className="max-w-[90%] sm:max-w-[700px] rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="h-10 w-10 border border-gray-200 dark:border-gray-800">
                  <AvatarImage src={(userDetail?.user || selectedUser)?.profileImageUrl || undefined} />
                    <AvatarFallback className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-semibold">
                    {(() => {
                      const user = userDetail?.user || selectedUser;
                      return user?.firstName?.[0]?.toUpperCase() || user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U";
                    })()}
                  </AvatarFallback>
                </Avatar>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-1">
                    {(() => {
                      const user = userDetail?.user || selectedUser;
                      if (user?.firstName && user?.lastName) {
                        return `${user.firstName} ${user.lastName}`;
                      }
                      if (user?.name) {
                        return user.name;
                      }
                      return user?.email?.split("@")[0] || "Cliente";
                    })()}
                  </DialogTitle>
                    <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
                    {(userDetail?.user || selectedUser)?.email || "-"}
                  </DialogDescription>
                </div>
              </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StripeStatusBadge
                    status={(() => {
                    const user = userDetail?.user || selectedUser;
                      return user?.billingStatus || "none";
                  })()}
                  />
                {((userDetail?.user || selectedUser)?.role === "admin") && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    Admin
                    </span>
                )}
                </div>
              </div>
            </DialogHeader>

            <div className="py-6">
              <Tabs defaultValue="informacoes" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                  <TabsTrigger 
                    value="informacoes" 
                    className="text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm"
                  >
                    <UserIcon className="h-4 w-4 mr-1.5 sm:mr-2" />
                    <span className="hidden sm:inline">Info</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="assinatura" 
                    className="text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm"
                  >
                    <CreditCard className="h-4 w-4 mr-1.5 sm:mr-2" />
                    <span className="hidden sm:inline">Assinatura</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="acesso" 
                    className="text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm"
                  >
                    <Lock className="h-4 w-4 mr-1.5 sm:mr-2" />
                    <span className="hidden sm:inline">Acesso</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="acoes" 
                    className="text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm"
                  >
                    <AlertTriangle className="h-4 w-4 mr-1.5 sm:mr-2" />
                    <span className="hidden sm:inline">Ações</span>
                  </TabsTrigger>
                </TabsList>

                {/* Tab: Informações - Editable Form */}
                <TabsContent value="informacoes" className="mt-0 space-y-6">
                  <Form {...editForm}>
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (updateUserMutation.isPending) {
                          return;
                        }
                        editForm.handleSubmit(handleUpdateSubmit)(e);
                      }} 
                      className="space-y-6"
                    >
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 uppercase tracking-wide mb-3">
                          Dados Pessoais
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ID do Cliente</label>
                            <div className="h-10 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-mono text-sm flex items-center">
                              {(userDetail?.user || selectedUser)?.id || "-"}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={editForm.control}
                            name="nome"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Nome *</FormLabel>
                                <FormControl>
                                  <PremiumInput {...field} placeholder="Nome" className="h-10" />
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
                                <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Sobrenome</FormLabel>
                                <FormControl>
                                  <PremiumInput {...field} placeholder="Sobrenome" className="h-10" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 uppercase tracking-wide mb-3">
                          Contato
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={editForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Email *</FormLabel>
                                <FormControl>
                                  <PremiumInput type="email" {...field} placeholder="email@exemplo.com" className="h-10" />
                                </FormControl>
                                <FormMessage />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
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
                                <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">WhatsApp</FormLabel>
                                <FormControl>
                                  <PremiumInput {...field} placeholder="+55 11 99999-9999" className="h-10" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 uppercase tracking-wide mb-3">
                          Plano e Status
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={editForm.control}
                            name="plano"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Plano</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-10 rounded-lg border-gray-300 dark:border-gray-700">
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
                                <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Rótulo do Plano</FormLabel>
                                <FormControl>
                                  <PremiumInput {...field} placeholder="Ex: Plano Anual" className="h-10" />
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
                                <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Status de Cobrança</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-10 rounded-lg border-gray-300 dark:border-gray-700">
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
                        </div>
                      </div>

                      <DialogFooter className="flex flex-col md:flex-row gap-3 md:justify-end mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEditDialogOpen(false)}
                          disabled={updateUserMutation.isPending}
                          className="w-full md:w-auto"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          disabled={updateUserMutation.isPending}
                          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {updateUserMutation.isPending ? "Salvando..." : "Salvar alterações"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </TabsContent>

                {/* Tab: Assinatura */}
                <TabsContent value="assinatura" className="mt-0 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 uppercase tracking-wide mb-3">
                      Assinaturas
                    </h3>
                    {detailLoading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Skeleton className="h-4 w-32 mx-auto mb-2" />
                        <Skeleton className="h-4 w-24 mx-auto" />
                      </div>
                    ) : userDetail?.subscriptions && userDetail.subscriptions.length > 0 ? (
                      <div className="space-y-3">
                        {userDetail.subscriptions.map((sub: any) => (
                          <div key={sub.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-sm transition-shadow">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-base text-gray-900 dark:text-gray-50 mb-1">{sub.planName}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatCurrency(sub.priceCents / 100)} /{" "}
                                  {sub.billingInterval === "month" ? "mês" : "ano"}
                                </p>
                                {sub.currentPeriodEnd && (
                                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                    Próximo vencimento:{" "}
                                    {format(new Date(sub.currentPeriodEnd), "dd/MM/yyyy", {
                                      locale: ptBR,
                                    })}
                                  </p>
                                )}
                              </div>
                              <div className="flex-shrink-0">
                                <StripeStatusBadge status={sub.status} />
                            </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                        Nenhuma assinatura encontrada
                      </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Tab: Acesso */}
                <TabsContent value="acesso" className="mt-0 space-y-6">
                    <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 uppercase tracking-wide mb-3">
                      Controle de Acesso
                    </h3>
                    <div className="p-5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                        {(() => {
                          const user = userDetail?.user || selectedUser;
                          return (
                            <>
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex-1">
                                <p className="font-semibold text-sm text-gray-900 dark:text-gray-50 mb-1">Status Atual</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {user?.billingStatus === "paused"
                                      ? "Acesso suspenso - Cliente não pode fazer login"
                                      : "Acesso ativo - Cliente pode usar o sistema normalmente"}
                                  </p>
                                </div>
                              <div className="flex-shrink-0 ml-4">
                                <StripeStatusBadge
                                  status={user?.billingStatus === "paused" ? "suspended" : user?.billingStatus || "none"}
                                />
                              </div>
                              </div>

                              <Separator className="my-4" />

                              <div className="space-y-3">
                                {user?.billingStatus === "paused" ? (
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
                            </>
                          );
                        })()}
                    </div>
                    </div>
                  </TabsContent>

                {/* Tab: Ações */}
                <TabsContent value="acoes" className="mt-0 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 uppercase tracking-wide mb-2">
                      Ações Administrativas
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
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

                      <PremiumButton
                        onClick={handleRegeneratePassword}
                        className="w-full"
                        disabled={regeneratePasswordMutation.isPending}
                        variant="outline"
                      >
                        <Key className="h-4 w-4 mr-2" />
                        {regeneratePasswordMutation.isPending ? "Gerando..." : "🔑 Gerar Nova Senha"}
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
              <PremiumButton
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteUserMutation.isPending || !selectedUser?.id}
                className="w-full md:w-auto"
              >
                {deleteUserMutation.isPending ? "Excluindo..." : "Excluir Cliente"}
              </PremiumButton>
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
              <PremiumButton
                onClick={handleSuspend}
                disabled={suspendUserMutation.isPending}
                className="w-full md:w-auto"
              >
                {suspendUserMutation.isPending ? "Suspender..." : "Suspender Acesso"}
              </PremiumButton>
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
              <PremiumButton
                onClick={handleReactivate}
                disabled={reactivateUserMutation.isPending}
                className="w-full md:w-auto"
              >
                {reactivateUserMutation.isPending ? "Reativando..." : "Reativar Acesso"}
              </PremiumButton>
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
              <PremiumButton
                onClick={handleForceLogout}
                disabled={forceLogoutMutation.isPending}
                className="w-full md:w-auto"
              >
                {forceLogoutMutation.isPending ? "Desconectando..." : "Forçar Logout"}
              </PremiumButton>
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
    </AdminLayout>
  );
}

