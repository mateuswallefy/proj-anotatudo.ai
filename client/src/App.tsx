import { Route, useLocation } from "wouter";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, startTransition, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Auth from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import Transacoes from "@/pages/transacoes";
import Cartoes from "@/pages/cartoes";
import Adicionar from "@/pages/adicionar";
import Configuracoes from "@/pages/configuracoes";

function AuthenticatedShell() {
  const [location] = useLocation();

  // Prefetch all critical data on mount
  useEffect(() => {
    startTransition(() => {
      queryClient.prefetchQuery({ queryKey: ["/api/transacoes"] });
      queryClient.prefetchQuery({ queryKey: ["/api/cartoes"] });
      queryClient.prefetchQuery({ queryKey: ["/api/insights"] });
      queryClient.prefetchQuery({ queryKey: ["/api/spending-progress"] });
      queryClient.prefetchQuery({ queryKey: ["/api/goals"] });
      queryClient.prefetchQuery({ queryKey: ["/api/spending-limits"] });
      queryClient.prefetchQuery({ queryKey: ["/api/account-members"] });
    });
  }, []);

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between px-4 py-3 border-b bg-background sticky top-0 z-10">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <div style={{ display: location === "/" ? "block" : "none" }}>
              <Dashboard />
            </div>
            <div style={{ display: location === "/transacoes" ? "block" : "none" }}>
              <Transacoes />
            </div>
            <div style={{ display: location === "/cartoes" ? "block" : "none" }}>
              <Cartoes />
            </div>
            <div style={{ display: location === "/adicionar" ? "block" : "none" }}>
              <Adicionar />
            </div>
            <div style={{ display: location === "/configuracoes" ? "block" : "none" }}>
              <Configuracoes />
            </div>
          </main>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading, refetchUser } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [processingToken, setProcessingToken] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token && !processingToken) {
      setProcessingToken(true);

      apiRequest('POST', '/api/auth/magic-link', { token })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
          refetchUser();
          
          window.history.replaceState({}, '', '/');
          setLocation('/');
          
          toast({
            title: "Login realizado!",
            description: "Bem-vindo ao seu dashboard financeiro.",
          });
        })
        .catch((error) => {
          console.error('[MagicLink] Erro ao processar token:', error);
          toast({
            variant: "destructive",
            title: "Link inválido ou expirado",
            description: "Solicite um novo link de acesso via WhatsApp.",
          });
          
          window.history.replaceState({}, '', '/');
        })
        .finally(() => {
          setProcessingToken(false);
        });
    }
  }, [toast, setLocation, refetchUser, processingToken]);

  if (isLoading || processingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {processingToken ? "Autenticando..." : "Carregando..."}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Route path="/" component={Auth} />
        <Toaster />
      </>
    );
  }

  return <AuthenticatedShell />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
