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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Trash2, UserPlus, KeyRound, Camera, Crown } from "lucide-react";
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

export default function Configuracoes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profileImageUrl || "");

  // Fetch account members
  const { data: members } = useQuery<AccountMember[]>({
    queryKey: ["/api/account-members"],
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

  return (
    <div className="space-y-6 p-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold mb-2">Configurações</h1>
        <p className="text-muted-foreground">Gerencie suas preferências e configurações da conta</p>
      </div>

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
                <h3 className="text-lg font-semibold capitalize">
                  {user?.plano || "Free"}
                </h3>
                <Badge variant="secondary">Ativo</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
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
            <p className="text-sm text-destructive">
              {memberForm.formState.errors.memberEmail.message}
            </p>
          )}

          <Separator />

          <div className="space-y-3">
            <h4 className="font-semibold">Membros Ativos</h4>
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
                        <p className="font-medium">Membro</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{member.role}</Badge>
                          <span className="text-xs text-muted-foreground">
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
              <p className="text-sm text-muted-foreground">
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
