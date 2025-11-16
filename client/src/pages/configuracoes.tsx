import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Trash2, UserPlus, KeyRound, Camera, Crown, Plus, Bell, DollarSign, CreditCard, TrendingUp, Target } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

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
    if (!notificationPreferences) {
      console.log('notificationPreferences não carregadas ainda');
      return;
    }
    
    const currentValue = notificationPreferences[key];
    const newValue = currentValue === 'ativo' ? 'inativo' : 'ativo';
    
    console.log('Toggle notificação:', key, 'de', currentValue, 'para', newValue);
    
    updateNotificationMutation.mutate({
      [key]: newValue,
    });
  };

  return (
    <div className="space-y-6 p-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="title-page">Configurações</h1>
        <p className="text-muted-foreground" data-testid="subtitle-page">Gerencie suas preferências e configurações da conta</p>
      </div>

      {/* Notifications Section */}
      <Card data-testid="card-notifications">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>Configure suas preferências de alertas e lembretes</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Alertas de Orçamento */}
          <div
            className="flex items-center justify-between p-4 rounded-lg border hover-elevate cursor-pointer"
            onClick={() => handleNotificationToggle('alertasOrcamento')}
            data-testid="notification-alertas-orcamento"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/10">
                <DollarSign className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Alertas de Orçamento</h4>
                <p className="text-sm text-muted-foreground">Quando exceder limites</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant={notificationPreferences?.alertasOrcamento === 'ativo' ? 'default' : 'secondary'}
                className={notificationPreferences?.alertasOrcamento === 'ativo' ? 'bg-success text-success-foreground' : ''}
                data-testid="badge-alertas-orcamento"
              >
                {notificationPreferences?.alertasOrcamento === 'ativo' ? 'Ativo' : 'Inativo'}
              </Badge>
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
            className="flex items-center justify-between p-4 rounded-lg border hover-elevate cursor-pointer"
            onClick={() => handleNotificationToggle('vencimentoCartoes')}
            data-testid="notification-vencimento-cartoes"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Vencimento de Cartões</h4>
                <p className="text-sm text-muted-foreground">Lembrete de faturas</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant={notificationPreferences?.vencimentoCartoes === 'ativo' ? 'default' : 'secondary'}
                className={notificationPreferences?.vencimentoCartoes === 'ativo' ? 'bg-success text-success-foreground' : ''}
                data-testid="badge-vencimento-cartoes"
              >
                {notificationPreferences?.vencimentoCartoes === 'ativo' ? 'Ativo' : 'Inativo'}
              </Badge>
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
            className="flex items-center justify-between p-4 rounded-lg border hover-elevate cursor-pointer"
            onClick={() => handleNotificationToggle('insightsSemanais')}
            data-testid="notification-insights-semanais"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-info/10">
                <TrendingUp className="h-5 w-5 text-info" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Insights Semanais</h4>
                <p className="text-sm text-muted-foreground">Relatório por email</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant={notificationPreferences?.insightsSemanais === 'ativo' ? 'default' : 'secondary'}
                className={notificationPreferences?.insightsSemanais === 'ativo' ? 'bg-success text-success-foreground' : ''}
                data-testid="badge-insights-semanais"
              >
                {notificationPreferences?.insightsSemanais === 'ativo' ? 'Ativo' : 'Inativo'}
              </Badge>
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
            className="flex items-center justify-between p-4 rounded-lg border hover-elevate cursor-pointer"
            onClick={() => handleNotificationToggle('metasAtingidas')}
            data-testid="notification-metas-atingidas"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-success/10">
                <Target className="h-5 w-5 text-success" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Metas Atingidas</h4>
                <p className="text-sm text-muted-foreground">Celebrar conquistas</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant={notificationPreferences?.metasAtingidas === 'ativo' ? 'default' : 'secondary'}
                className={notificationPreferences?.metasAtingidas === 'ativo' ? 'bg-success text-success-foreground' : ''}
                data-testid="badge-metas-atingidas"
              >
                {notificationPreferences?.metasAtingidas === 'ativo' ? 'Ativo' : 'Inativo'}
              </Badge>
              <Switch
                checked={notificationPreferences?.metasAtingidas === 'ativo'}
                onCheckedChange={() => handleNotificationToggle('metasAtingidas')}
                data-testid="switch-metas-atingidas"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Section */}
      <Card data-testid="card-profile">
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Atualize sua foto de perfil e informações pessoais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user?.profileImageUrl || ""} />
              <AvatarFallback className="text-2xl">{getUserInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <div>
                <Label htmlFor="profile-image">URL da Foto de Perfil</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="profile-image"
                    placeholder="https://exemplo.com/foto.jpg"
                    value={profileImageUrl}
                    onChange={(e) => setProfileImageUrl(e.target.value)}
                    data-testid="input-profile-image"
                  />
                  <Button
                    onClick={handleProfileImageUpdate}
                    disabled={updateProfileImageMutation.isPending || !profileImageUrl}
                    data-testid="button-update-image"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Atualizar
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome</Label>
                  <div className="mt-1 font-medium">{user?.firstName || "-"}</div>
                </div>
                <div>
                  <Label>Sobrenome</Label>
                  <div className="mt-1 font-medium">{user?.lastName || "-"}</div>
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <div className="mt-1 font-medium">{user?.email}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Info */}
      <Card data-testid="card-plan-info">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Plano Atual
          </CardTitle>
          <CardDescription>Informações sobre sua assinatura</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold capitalize" data-testid="text-plan-name">
                  {user?.plano || "Free"}
                </h3>
                <Badge variant="secondary" data-testid="badge-plan-status">Ativo</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1" data-testid="text-plan-description">
                Acesso completo aos recursos do AnotaTudo.AI
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Section */}
      <Card data-testid="card-password">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Alterar Senha
          </CardTitle>
          <CardDescription>Atualize sua senha para manter sua conta segura</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="current-password">Senha Atual</Label>
              <Input
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
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
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
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input
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

            <Button
              type="submit"
              disabled={changePasswordMutation.isPending}
              data-testid="button-change-password"
            >
              {changePasswordMutation.isPending ? "Alterando..." : "Alterar Senha"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Members Section */}
      <Card data-testid="card-members">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Membros Compartilhados
          </CardTitle>
          <CardDescription>
            Adicione outras pessoas para compartilhar o gerenciamento financeiro (ex: cônjuge, família)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={memberForm.handleSubmit(handleMemberSubmit)} className="flex gap-2">
            <Input
              placeholder="email@exemplo.com"
              {...memberForm.register("memberEmail")}
              data-testid="input-member-email"
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={addMemberMutation.isPending}
              data-testid="button-add-member"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
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
              <div className="space-y-2">
                {members.filter(m => m.status === 'ativo').map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover-elevate"
                    data-testid={`member-${member.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>M</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium" data-testid={`member-name-${member.id}`}>Membro</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" data-testid={`member-role-${member.id}`}>{member.role}</Badge>
                          <span className="text-xs text-muted-foreground" data-testid={`member-date-${member.id}`}>
                            Adicionado {new Date(member.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeMemberMutation.mutate(member.id)}
                      disabled={removeMemberMutation.isPending}
                      data-testid={`button-remove-member-${member.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground" data-testid="text-no-members">
                Nenhum membro compartilhado ainda. Adicione outras pessoas para gerenciar as finanças juntos!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card data-testid="card-appearance">
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
          <CardDescription>Personalize o visual da aplicação</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="theme">Tema</Label>
              <p className="text-sm text-muted-foreground">
                Altere entre o modo claro e escuro
              </p>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
