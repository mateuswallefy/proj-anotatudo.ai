import { Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, startTransition } from "react";
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
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
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
