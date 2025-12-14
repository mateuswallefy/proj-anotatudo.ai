import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Label } from "@/components/ui/label";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MessageSquare, Mail, Lock, User, ArrowRight, Sparkles } from "lucide-react";
import { insertUserSchema, loginSchema } from "@shared/schema";
import { PremiumButton, PremiumInput, AppCard } from "@/components/design-system";

type RegisterFormData = z.infer<typeof insertUserSchema>;
type LoginFormData = z.infer<typeof loginSchema>;

export default function Auth() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

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
      console.log('[Frontend] ============================================');
      console.log('[Frontend] 🔥 Iniciando login...');
      console.log('[Frontend] Email:', data.email);
      console.log('[Frontend] URL:', '/api/auth/login');
      console.log('[Frontend] Credentials:', 'include');
      console.log('[Frontend] Cookies ANTES do login:', document.cookie || 'nenhum cookie');
      
      // CRÍTICO: Aguardar resposta completa antes de processar
      const response = await apiRequest("POST", "/api/auth/login", data);
      
      console.log('[Frontend] ===== RESPOSTA DO LOGIN =====');
      console.log('[Frontend] Response status:', response.status);
      console.log('[Frontend] Response ok:', response.ok);
      console.log('[Frontend] Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Verificar Set-Cookie header
      const setCookieHeader = response.headers.get('Set-Cookie');
      console.log('[Frontend] 🔥 Set-Cookie header recebido:', setCookieHeader || 'NÃO PRESENTE');
      
      // Aguardar um pouco para o browser processar o cookie
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verificar cookies após login
      const cookiesAfterLogin = document.cookie;
      console.log('[Frontend] 🔥 Cookies APÓS login:', cookiesAfterLogin || 'nenhum cookie');
      console.log('[Frontend] 🔥 Cookie connect.sid presente:', cookiesAfterLogin.includes('connect.sid'));
      
      if (!cookiesAfterLogin.includes('connect.sid')) {
        console.error('[Frontend] ⚠️ ATENÇÃO: Cookie connect.sid NÃO foi salvo pelo navegador!');
        console.error('[Frontend] Possíveis causas:');
        console.error('[Frontend] 1. Set-Cookie header não foi enviado pelo backend');
        console.error('[Frontend] 2. Browser bloqueou o cookie (SameSite, Secure, etc)');
        console.error('[Frontend] 3. Domain/path do cookie não corresponde');
      } else {
        console.log('[Frontend] ✅ Cookie connect.sid salvo com sucesso!');
      }
      
      console.log('[Frontend] ============================================');
      
      // Parsear resposta JSON
      const userData = await response.json();
      return userData;
    },
    onSuccess: (userData) => {
      console.log('[Frontend] ===== onSuccess do login =====');
      console.log('[Frontend] User data recebido:', userData);
      console.log('[Frontend] Cookies antes de invalidar queries:', document.cookie);
      
      // CRÍTICO: Aguardar um pouco antes de invalidar queries
      // Isso garante que o cookie já foi processado pelo browser
      setTimeout(() => {
        console.log('[Frontend] Invalidando queries para buscar usuário autenticado...');
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        
        toast({
          title: "Login realizado!",
          description: "Redirecionando para o dashboard...",
        });
        
        // Aguardar mais um pouco antes de redirecionar
        setTimeout(() => {
          console.log('[Frontend] Redirecionando para dashboard...');
          setLocation("/");
        }, 200);
      }, 300);
    },
    onError: (error: any) => {
      console.error('[Frontend] Login error:', error);
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Email ou senha incorretos",
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
        <AppCard className="w-full max-w-md mx-auto p-6 md:p-8 rounded-2xl" borderAccent="blue" data-testid="card-auth-form">
          <CardHeader className="space-y-2 pb-4">
            <div className="flex items-center gap-2 lg:hidden mb-4">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl font-bold">AnotaTudo.AI</CardTitle>
            </div>
            <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight">
              {activeTab === "login" ? "Bem-vindo de volta" : "Criar conta"}
            </CardTitle>
            <CardDescription className="text-base">
              {activeTab === "login"
                ? "Entre com sua conta para acessar o dashboard"
                : "Comece a gerenciar suas finanças com IA"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
              <TabsList className="grid w-full grid-cols-2 mb-6 h-11 rounded-xl">
                <TabsTrigger value="login" data-testid="tab-login" className="rounded-lg">Entrar</TabsTrigger>
                <TabsTrigger value="register" data-testid="tab-register" className="rounded-lg">Criar Conta</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-semibold">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                      <PremiumInput
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-9"
                        {...loginForm.register("email")}
                        data-testid="input-login-email"
                      />
                    </div>
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-destructive mt-1">
                        {loginForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm font-semibold">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                      <PremiumInput
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-9"
                        {...loginForm.register("password")}
                        data-testid="input-login-password"
                      />
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-destructive mt-1">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <PremiumButton
                    type="submit"
                    className="w-full h-11"
                    disabled={loginMutation.isPending}
                    data-testid="button-login-submit"
                  >
                    {loginMutation.isPending ? "Entrando..." : "Entrar"}
                  </PremiumButton>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-firstName" className="text-sm font-semibold">Nome</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                        <PremiumInput
                          id="register-firstName"
                          placeholder="João"
                          className="pl-9"
                          {...registerForm.register("firstName")}
                          data-testid="input-register-firstName"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-lastName" className="text-sm font-semibold">Sobrenome</Label>
                      <PremiumInput
                        id="register-lastName"
                        placeholder="Silva"
                        {...registerForm.register("lastName")}
                        data-testid="input-register-lastName"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-sm font-semibold">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                      <PremiumInput
                        id="register-email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-9"
                        {...registerForm.register("email")}
                        data-testid="input-register-email"
                      />
                    </div>
                    {registerForm.formState.errors.email && (
                      <p className="text-sm text-destructive mt-1">
                        {registerForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-sm font-semibold">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                      <PremiumInput
                        id="register-password"
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        className="pl-9"
                        {...registerForm.register("password")}
                        data-testid="input-register-password"
                      />
                    </div>
                    {registerForm.formState.errors.password && (
                      <p className="text-sm text-destructive mt-1">
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <PremiumButton
                    type="submit"
                    className="w-full h-11"
                    disabled={registerMutation.isPending}
                    data-testid="button-register-submit"
                  >
                    {registerMutation.isPending ? "Criando conta..." : "Criar Conta"}
                  </PremiumButton>

                  <p className="text-xs text-center text-muted-foreground">
                    Ao criar uma conta, você concorda com nossos Termos de Serviço e Política de Privacidade.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </AppCard>
      </div>
    </div>
  );
}
