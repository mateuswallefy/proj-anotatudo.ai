import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MessageSquare, Mail, Lock, User, ArrowRight, Sparkles, Phone } from "lucide-react";
import { insertUserSchema, loginSchema } from "@shared/schema";

type RegisterFormData = z.infer<typeof insertUserSchema>;
type LoginFormData = z.infer<typeof loginSchema>;

const whatsappLoginSchema = z.object({
  telefone: z.string()
    .min(11, "Telefone deve ter no mínimo 11 dígitos (DDD + número)")
    .max(16, "Telefone inválido")
    .regex(/^\+?\d{11,15}$/, "Use apenas números com DDD (ex: 91983139299 ou +5591983139299)"),
});

type WhatsAppLoginFormData = z.infer<typeof whatsappLoginSchema>;

export default function Auth() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"whatsapp" | "login" | "register">("whatsapp");

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const whatsappForm = useForm<WhatsAppLoginFormData>({
    resolver: zodResolver(whatsappLoginSchema),
    defaultValues: {
      telefone: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      await apiRequest("POST", "/api/auth/register", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo ao AnotaTudo.AI",
      });
      setTimeout(() => {
        setLocation("/");
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      await apiRequest("POST", "/api/auth/login", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Login realizado!",
        description: "Redirecionando para o dashboard...",
      });
      setTimeout(() => {
        setLocation("/");
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Email ou senha incorretos",
        variant: "destructive",
      });
    },
  });

  const whatsappLoginMutation = useMutation({
    mutationFn: async (data: WhatsAppLoginFormData) => {
      await apiRequest("POST", "/api/auth/whatsapp-login", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Acesso liberado!",
        description: "Bem-vindo ao seu dashboard financeiro.",
      });
      setTimeout(() => {
        setLocation("/");
      }, 100);
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Telefone não encontrado ou não autenticado. Verifique se você já enviou seu email via WhatsApp.";
      toast({
        title: "Não foi possível acessar",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onRegisterSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onWhatsAppSubmit = (data: WhatsAppLoginFormData) => {
    whatsappLoginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left side - Branding */}
        <div className="hidden lg:block space-y-8 p-8">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AnotaTudo.AI</h1>
              <p className="text-muted-foreground">Inteligência Financeira</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">IA Multimodal</h3>
                <p className="text-sm text-muted-foreground">
                  Envie mensagens, áudios, fotos ou vídeos pelo WhatsApp e transforme tudo em registros financeiros.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">WhatsApp Integrado</h3>
                <p className="text-sm text-muted-foreground">
                  Gerencie suas finanças direto pelo aplicativo que você já usa todos os dias.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <ArrowRight className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Dashboard Completo</h3>
                <p className="text-sm text-muted-foreground">
                  Visualize gráficos, evolução temporal, cartões de crédito e muito mais em um só lugar.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              "A melhor ferramenta de gestão financeira que já usei. Simples, rápida e inteligente."
            </p>
            <p className="text-sm font-medium mt-2">— Usuário Beta</p>
          </div>
        </div>

        {/* Right side - Auth form */}
        <Card className="w-full max-w-md mx-auto shadow-2xl" data-testid="card-auth-form">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 lg:hidden mb-4">
              <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">AnotaTudo.AI</CardTitle>
            </div>
            <CardTitle className="text-2xl">
              {activeTab === "whatsapp" ? "Acesso via WhatsApp" : activeTab === "login" ? "Bem-vindo de volta" : "Criar conta"}
            </CardTitle>
            <CardDescription>
              {activeTab === "whatsapp"
                ? "Entre com o telefone autenticado no WhatsApp"
                : activeTab === "login"
                ? "Entre com sua conta para acessar o dashboard"
                : "Comece a gerenciar suas finanças com IA"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "whatsapp" | "login" | "register")}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="whatsapp" data-testid="tab-whatsapp">WhatsApp</TabsTrigger>
                <TabsTrigger value="login" data-testid="tab-login">Entrar</TabsTrigger>
                <TabsTrigger value="register" data-testid="tab-register">Criar Conta</TabsTrigger>
              </TabsList>

              {/* WhatsApp Login Tab */}
              <TabsContent value="whatsapp">
                <form onSubmit={whatsappForm.handleSubmit(onWhatsAppSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp-phone">Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="whatsapp-phone"
                        type="tel"
                        placeholder="91983139299"
                        className="pl-9"
                        {...whatsappForm.register("telefone")}
                        data-testid="input-whatsapp-phone"
                      />
                    </div>
                    {whatsappForm.formState.errors.telefone && (
                      <p className="text-sm text-destructive">
                        {whatsappForm.formState.errors.telefone.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Com DDD: 91983139299 ou +5591983139299
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={whatsappLoginMutation.isPending}
                    data-testid="button-whatsapp-submit"
                  >
                    {whatsappLoginMutation.isPending ? "Verificando..." : "Acessar Dashboard"}
                  </Button>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-center text-muted-foreground">
                      Ainda não autenticou? Envie uma mensagem para nosso WhatsApp e informe seu email.
                    </p>
                  </div>
                </form>
              </TabsContent>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-9"
                        {...loginForm.register("email")}
                        data-testid="input-login-email"
                      />
                    </div>
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {loginForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-9"
                        {...loginForm.register("password")}
                        data-testid="input-login-password"
                      />
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                    data-testid="button-login-submit"
                  >
                    {loginMutation.isPending ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-firstName">Nome</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="register-firstName"
                          placeholder="João"
                          className="pl-9"
                          {...registerForm.register("firstName")}
                          data-testid="input-register-firstName"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-lastName">Sobrenome</Label>
                      <Input
                        id="register-lastName"
                        placeholder="Silva"
                        {...registerForm.register("lastName")}
                        data-testid="input-register-lastName"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-9"
                        {...registerForm.register("email")}
                        data-testid="input-register-email"
                      />
                    </div>
                    {registerForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {registerForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        className="pl-9"
                        {...registerForm.register("password")}
                        data-testid="input-register-password"
                      />
                    </div>
                    {registerForm.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending}
                    data-testid="button-register-submit"
                  >
                    {registerMutation.isPending ? "Criando conta..." : "Criar Conta"}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Ao criar uma conta, você concorda com nossos Termos de Serviço e Política de Privacidade.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
