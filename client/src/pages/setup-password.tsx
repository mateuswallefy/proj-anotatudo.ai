import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Lock, CheckCircle2, AlertCircle } from "lucide-react";

const setupPasswordSchema = z.object({
  password: z.string()
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
    .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
    .regex(/[0-9]/, "Senha deve conter pelo menos um número"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type SetupPasswordFormData = z.infer<typeof setupPasswordSchema>;

export default function SetupPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    
    if (!tokenParam) {
      toast({
        title: "Link inválido",
        description: "Token não encontrado. Solicite um novo link via WhatsApp.",
        variant: "destructive",
      });
      setTimeout(() => setLocation("/auth"), 2000);
    } else {
      setToken(tokenParam);
    }
  }, [toast, setLocation]);

  const form = useForm<SetupPasswordFormData>({
    resolver: zodResolver(setupPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const setupMutation = useMutation({
    mutationFn: async (data: SetupPasswordFormData) => {
      if (!token) {
        throw new Error("Token não encontrado");
      }
      
      await apiRequest("POST", "/api/auth/setup-password", {
        token,
        password: data.password,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Senha definida com sucesso!",
        description: "Você já está logado. Redirecionando para o dashboard...",
      });
      setTimeout(() => {
        setLocation("/");
      }, 1500);
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Erro ao definir senha. O link pode ter expirado.";
      toast({
        title: "Erro ao definir senha",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SetupPasswordFormData) => {
    setupMutation.mutate(data);
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <p className="text-center text-muted-foreground">
              Verificando link...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Defina sua Senha</CardTitle>
          <CardDescription>
            Crie uma senha segura para acessar seu dashboard financeiro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  {...form.register("password")}
                  data-testid="input-password"
                />
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  {...form.register("confirmPassword")}
                  data-testid="input-confirm-password"
                />
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="text-xs font-medium">Requisitos da senha:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                  Mínimo 8 caracteres
                </li>
                <li className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                  Pelo menos uma letra maiúscula
                </li>
                <li className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                  Pelo menos uma letra minúscula
                </li>
                <li className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                  Pelo menos um número
                </li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={setupMutation.isPending}
              data-testid="button-setup-password"
            >
              {setupMutation.isPending ? "Salvando..." : "Definir Senha e Acessar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
