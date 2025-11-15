import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { User, Phone, Mail, Crown } from "lucide-react";

export default function Configuracoes() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências e informações da conta
        </p>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* User Info */}
        <Card data-testid="card-user-info">
          <CardHeader>
            <CardTitle>Informações do Usuário</CardTitle>
            <CardDescription>
              Suas informações pessoais e de autenticação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : "Usuário"}
                </h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    value={user?.email || ""}
                    disabled
                    className="flex-1"
                    data-testid="input-email"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Telefone (WhatsApp)</Label>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={user?.telefone || "Não configurado"}
                    disabled
                    className="flex-1"
                    data-testid="input-phone"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Configure seu número do WhatsApp para receber mensagens da IA
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Info */}
        <Card data-testid="card-plan-info">
          <CardHeader>
            <CardTitle>Plano Atual</CardTitle>
            <CardDescription>
              Informações sobre sua assinatura
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center">
                  <Crown className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold capitalize">
                      {user?.plano || "Free"}
                    </h3>
                    <Badge variant="secondary">Ativo</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Acesso completo aos recursos do AnotaTudo.AI
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card data-testid="card-appearance">
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
            <CardDescription>
              Personalize o visual da aplicação
            </CardDescription>
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

        {/* Notifications */}
        <Card data-testid="card-notifications">
          <CardHeader>
            <CardTitle>Notificações</CardTitle>
            <CardDescription>
              Configure quando e como você deseja ser notificado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Alertas de Limite de Cartão</Label>
                <p className="text-sm text-muted-foreground">
                  Receba notificações quando o limite estiver próximo de ser atingido
                </p>
              </div>
              <Badge variant="outline">Ativo</Badge>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Confirmação de Valores</Label>
                <p className="text-sm text-muted-foreground">
                  A IA pedirá confirmação quando o valor não estiver claro
                </p>
              </div>
              <Badge variant="outline">Ativo</Badge>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp Integration */}
        <Card data-testid="card-whatsapp-integration">
          <CardHeader>
            <CardTitle>Integração WhatsApp</CardTitle>
            <CardDescription>
              Configure a conexão com o WhatsApp para mensagens automáticas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm">
                  <strong>Endpoint do Webhook:</strong>
                </p>
                <code className="text-xs text-muted-foreground break-all">
                  {window.location.origin}/api/webhook/whatsapp
                </code>
              </div>
              <p className="text-sm text-muted-foreground">
                Configure este endpoint no Meta WhatsApp Cloud API para receber mensagens automáticas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive" data-testid="card-danger-zone">
          <CardHeader>
            <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
            <CardDescription>
              Ações irreversíveis relacionadas à sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" disabled data-testid="button-delete-account">
              Excluir Conta
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Esta ação não pode ser desfeita e todos os seus dados serão permanentemente removidos.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
