import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Trash2, UserPlus, KeyRound, Camera, Crown, Bell, DollarSign, CreditCard, TrendingUp, Target } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { PageHeader, PremiumButton, AppCard, SectionTitle, DataBadge, PremiumInput } from "@/components/design-system";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual obrigatória"),
  newPassword: z.string().min(8, "Nova senha deve ter no mínimo 8 caracteres"),
  confirmPassword: z.string().min(1, "Confirme a nova senha"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

const addMemberSchema = z.object({
  memberEmail: z.string().email("Email inválido"),
  role: z.enum(['member', 'viewer']).default('member'),
});

type AddMemberFormData = z.infer<typeof addMemberSchema>;

interface AccountMember {
  id: string;
  accountOwnerId: string;
  memberId: string;
  role: string;
  status: string;
  createdAt: string;
}

interface NotificationPreferences {
  alertasOrcamento: 'ativo' | 'inativo';
  vencimentoCartoes: 'ativo' | 'inativo';
  insightsSemanais: 'ativo' | 'inativo';
  metasAtingidas: 'ativo' | 'inativo';
}

export default function Configuracoes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profileImageUrl || "");

  // Fetch account members
  const { data: members } = useQuery<AccountMember[]>({
    queryKey: ["/api/account-members"],
  });

  // Fetch notification preferences
  const { data: notificationPreferences } = useQuery<NotificationPreferences>({
    queryKey: ["/api/notification-preferences"],
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordFormData) => {
      await apiRequest("POST", "/api/user/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: () => {
      toast({
        title: "Senha alterada!",
        description: "Sua senha foi atualizada com sucesso.",
      });
      passwordForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao alterar senha",
        description: error.message || "Verifique sua senha atual",
        variant: "destructive",
      });
    },
  });

  // Update profile image mutation
  const updateProfileImageMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      await apiRequest("POST", "/api/user/profile-image", { imageUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Foto atualizada!",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar foto",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (data: AddMemberFormData) => {
      await apiRequest("POST", "/api/account-members", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account-members"] });
      toast({
        title: "Membro adicionado!",
        description: "O membro foi adicionado à sua conta.",
      });
      memberForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar membro",
        description: error.message || "Usuário não encontrado ou já é membro",
        variant: "destructive",
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await apiRequest("DELETE", `/api/account-members/${memberId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account-members"] });
      toast({
        title: "Membro removido",
        description: "O membro foi removido da conta.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover membro",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  // Update notification preferences mutation
  const updateNotificationMutation = useMutation({
    mutationFn: async (preferences: Partial<NotificationPreferences>) => {
      await apiRequest("POST", "/api/notification-preferences", preferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-preferences"] });
      toast({
        title: "Preferências atualizadas!",
        description: "Suas preferências de notificação foram salvas.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar preferências",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const memberForm = useForm<AddMemberFormData>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      memberEmail: "",
      role: "member",
    },
  });

  const handlePasswordSubmit = (data: ChangePasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  const handleMemberSubmit = (data: AddMemberFormData) => {
    addMemberMutation.mutate(data);
  };

  const handleProfileImageUpdate = () => {
    if (profileImageUrl) {
      updateProfileImageMutation.mutate(profileImageUrl);
    }
  };

  const getUserInitials = () => {
    if (!user) return "U";
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    return `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "U";
  };

  const handleNotificationToggle = (key: keyof NotificationPreferences) => {
    if (!notificationPreferences) return;
    
    const currentValue = notificationPreferences[key];
    const newValue = currentValue === 'ativo' ? 'inativo' : 'ativo';
    
    updateNotificationMutation.mutate({
      [key]: newValue,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-8 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Premium Header */}
        <PageHeader
          title="Configurações"
          subtitle="Gerencie suas preferências e configurações da conta"
        />

        {/* Notifications Section */}
        <div className="space-y-6">
          <SectionTitle
            title="Notificações"
            subtitle="Configure suas preferências de alertas e lembretes"
          />
          
          <AppCard className="p-5 md:p-6" borderAccent="purple" data-testid="card-notifications">
            <div className="space-y-4">
              {/* Alertas de Orçamento */}
              <div
                className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-border hover:bg-card/50 transition-all cursor-pointer"
                onClick={() => handleNotificationToggle('alertasOrcamento')}
                data-testid="notification-alertas-orcamento"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10">
                    <DollarSign className="h-6 w-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-base">Alertas de Orçamento</h4>
                    <p className="text-sm text-muted-foreground">Quando exceder limites</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DataBadge
                    variant={notificationPreferences?.alertasOrcamento === 'ativo' ? 'default' : 'outline'}
                    color={notificationPreferences?.alertasOrcamento === 'ativo' ? 'hsl(142, 76%, 36%)' : undefined}
                    data-testid="badge-alertas-orcamento"
                  >
                    {notificationPreferences?.alertasOrcamento === 'ativo' ? 'Ativo' : 'Inativo'}
                  </DataBadge>
                  <Switch
                    checked={notificationPreferences?.alertasOrcamento === 'ativo'}
                    onCheckedChange={() => handleNotificationToggle('alertasOrcamento')}
                    data-testid="switch-alertas-orcamento"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              {/* Vencimento de Cartões */}
              <div
                className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-border hover:bg-card/50 transition-all cursor-pointer"
                onClick={() => handleNotificationToggle('vencimentoCartoes')}
                data-testid="notification-vencimento-cartoes"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-base">Vencimento de Cartões</h4>
                    <p className="text-sm text-muted-foreground">Lembrete de faturas</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DataBadge
                    variant={notificationPreferences?.vencimentoCartoes === 'ativo' ? 'default' : 'outline'}
                    color={notificationPreferences?.vencimentoCartoes === 'ativo' ? 'hsl(142, 76%, 36%)' : undefined}
                    data-testid="badge-vencimento-cartoes"
                  >
                    {notificationPreferences?.vencimentoCartoes === 'ativo' ? 'Ativo' : 'Inativo'}
                  </DataBadge>
                  <Switch
                    checked={notificationPreferences?.vencimentoCartoes === 'ativo'}
                    onCheckedChange={() => handleNotificationToggle('vencimentoCartoes')}
                    data-testid="switch-vencimento-cartoes"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              {/* Insights Semanais */}
              <div
                className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-border hover:bg-card/50 transition-all cursor-pointer"
                onClick={() => handleNotificationToggle('insightsSemanais')}
                data-testid="notification-insights-semanais"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10">
                    <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-base">Insights Semanais</h4>
                    <p className="text-sm text-muted-foreground">Relatório por email</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DataBadge
                    variant={notificationPreferences?.insightsSemanais === 'ativo' ? 'default' : 'outline'}
                    color={notificationPreferences?.insightsSemanais === 'ativo' ? 'hsl(142, 76%, 36%)' : undefined}
                    data-testid="badge-insights-semanais"
                  >
                    {notificationPreferences?.insightsSemanais === 'ativo' ? 'Ativo' : 'Inativo'}
                  </DataBadge>
                  <Switch
                    checked={notificationPreferences?.insightsSemanais === 'ativo'}
                    onCheckedChange={() => handleNotificationToggle('insightsSemanais')}
                    data-testid="switch-insights-semanais"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              {/* Metas Atingidas */}
              <div
                className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-border hover:bg-card/50 transition-all cursor-pointer"
                onClick={() => handleNotificationToggle('metasAtingidas')}
                data-testid="notification-metas-atingidas"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10">
                    <Target className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-base">Metas Atingidas</h4>
                    <p className="text-sm text-muted-foreground">Celebrar conquistas</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DataBadge
                    variant={notificationPreferences?.metasAtingidas === 'ativo' ? 'default' : 'outline'}
                    color={notificationPreferences?.metasAtingidas === 'ativo' ? 'hsl(142, 76%, 36%)' : undefined}
                    data-testid="badge-metas-atingidas"
                  >
                    {notificationPreferences?.metasAtingidas === 'ativo' ? 'Ativo' : 'Inativo'}
                  </DataBadge>
                  <Switch
                    checked={notificationPreferences?.metasAtingidas === 'ativo'}
                    onCheckedChange={() => handleNotificationToggle('metasAtingidas')}
                    data-testid="switch-metas-atingidas"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            </div>
          </AppCard>
        </div>

        {/* Profile Section */}
        <div className="space-y-6">
          <SectionTitle
            title="Perfil"
            subtitle="Atualize sua foto de perfil e informações pessoais"
          />
          
          <AppCard className="p-5 md:p-6" borderAccent="blue" data-testid="card-profile">
            <div className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user?.profileImageUrl || ""} />
              <AvatarFallback className="text-2xl">{getUserInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <div>
                <Label htmlFor="profile-image" className="text-sm font-semibold mb-2 block">URL da Foto de Perfil</Label>
                <div className="flex gap-3">
                  <PremiumInput
                    id="profile-image"
                    placeholder="https://exemplo.com/foto.jpg"
                    value={profileImageUrl}
                    onChange={(e) => setProfileImageUrl(e.target.value)}
                    data-testid="input-profile-image"
                    className="flex-1"
                  />
                  <PremiumButton
                    onClick={handleProfileImageUpdate}
                    disabled={updateProfileImageMutation.isPending || !profileImageUrl}
                    data-testid="button-update-image"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Atualizar
                  </PremiumButton>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Nome</Label>
                  <div className="font-medium text-base">{user?.firstName || "-"}</div>
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Sobrenome</Label>
                  <div className="font-medium text-base">{user?.lastName || "-"}</div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold mb-2 block">Email</Label>
                <div className="font-medium text-base">{user?.email}</div>
              </div>
            </div>
          </div>
            </div>
          </AppCard>
        </div>

        {/* Plan Info */}
        <AppCard className="p-5 md:p-6" borderAccent="purple" data-testid="card-plan-info">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Crown className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold capitalize" data-testid="text-plan-name">
                  {user?.plano || "Free"}
                </h3>
                <DataBadge variant="default" color="hsl(142, 76%, 36%)" data-testid="badge-plan-status">
                  Ativo
                </DataBadge>
              </div>
              <p className="text-sm text-muted-foreground" data-testid="text-plan-description">
                Acesso completo aos recursos do AnotaTudo.AI
              </p>
            </div>
          </div>
        </AppCard>

        {/* Password Section */}
        <div className="space-y-6">
          <SectionTitle
            title="Alterar Senha"
            subtitle="Atualize sua senha para manter sua conta segura"
          />
          
          <AppCard className="p-5 md:p-6" borderAccent="blue" data-testid="card-password">
            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-5">
              <div>
                <Label htmlFor="current-password" className="text-sm font-semibold mb-2 block">Senha Atual</Label>
                <PremiumInput
                  id="current-password"
                  type="password"
                  {...passwordForm.register("currentPassword")}
                  data-testid="input-current-password"
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-sm text-destructive mt-1">
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="new-password" className="text-sm font-semibold mb-2 block">Nova Senha</Label>
                <PremiumInput
                  id="new-password"
                  type="password"
                  {...passwordForm.register("newPassword")}
                  data-testid="input-new-password"
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-sm text-destructive mt-1">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="confirm-password" className="text-sm font-semibold mb-2 block">Confirmar Nova Senha</Label>
                <PremiumInput
                  id="confirm-password"
                  type="password"
                  {...passwordForm.register("confirmPassword")}
                  data-testid="input-confirm-password"
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive mt-1">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <PremiumButton
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  data-testid="button-change-password"
                >
                  <KeyRound className="h-4 w-4 mr-2" />
                  {changePasswordMutation.isPending ? "Alterando..." : "Alterar Senha"}
                </PremiumButton>
              </div>
            </form>
          </AppCard>
        </div>

        {/* Account Members Section */}
        <div className="space-y-6">
          <SectionTitle
            title="Membros Compartilhados"
            subtitle="Adicione outras pessoas para compartilhar o gerenciamento financeiro"
          />
          
          <AppCard className="p-5 md:p-6" borderAccent="purple" data-testid="card-members">
            <div className="space-y-6">
              <form onSubmit={memberForm.handleSubmit(handleMemberSubmit)} className="flex gap-3">
                <PremiumInput
                  placeholder="email@exemplo.com"
                  {...memberForm.register("memberEmail")}
                  data-testid="input-member-email"
                  className="flex-1"
                />
                <PremiumButton
                  type="submit"
                  disabled={addMemberMutation.isPending}
                  data-testid="button-add-member"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar
                </PremiumButton>
              </form>

              {memberForm.formState.errors.memberEmail && (
                <p className="text-sm text-destructive" data-testid="error-member-email">
                  {memberForm.formState.errors.memberEmail.message}
                </p>
              )}

              <Separator />

              <div className="space-y-3">
                <h4 className="font-semibold" data-testid="title-active-members">Membros Ativos</h4>
                {members && members.length > 0 ? (
                  <div className="space-y-3">
                    {members.filter(m => m.status === 'ativo').map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-border hover:bg-card/50 transition-all"
                        data-testid={`member-${member.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="text-sm font-semibold">M</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-base" data-testid={`member-name-${member.id}`}>Membro</p>
                            <div className="flex items-center gap-2 mt-1">
                              <DataBadge variant="outline" data-testid={`member-role-${member.id}`}>
                                {member.role}
                              </DataBadge>
                              <span className="text-xs text-muted-foreground" data-testid={`member-date-${member.id}`}>
                                Adicionado {new Date(member.createdAt).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <PremiumButton
                          variant="destructive"
                          size="sm"
                          onClick={() => removeMemberMutation.mutate(member.id)}
                          disabled={removeMemberMutation.isPending}
                          data-testid={`button-remove-member-${member.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </PremiumButton>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground" data-testid="text-no-members">
                    Nenhum membro compartilhado ainda. Adicione outras pessoas para gerenciar as finanças juntos!
                  </p>
                )}
              </div>
            </div>
          </AppCard>
        </div>

        {/* Appearance */}
        <AppCard className="p-5 md:p-6" borderAccent="blue" data-testid="card-appearance">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="theme" className="text-sm font-semibold mb-1 block">Tema</Label>
              <p className="text-sm text-muted-foreground">
                Altere entre o modo claro e escuro
              </p>
            </div>
            <ThemeToggle />
          </div>
        </AppCard>
      </div>
    </div>
  );
}

