import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NavBar } from "@/components/NavBar";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useAuth } from "@/hooks/useAuth";
import { PeriodProvider } from "@/contexts/PeriodContext";
import { TabProvider, useTab } from "@/contexts/TabContext";
import { useEffect, startTransition } from "react";
import { useLocation } from "wouter";
import Auth from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import Transacoes from "@/pages/transacoes";
import Economias from "@/pages/economias";
import Orcamento from "@/pages/orcamento";
import Metas from "@/pages/metas";
import Cartoes from "@/pages/cartoes";
import Insights from "@/pages/insights";
import Configuracoes from "@/pages/configuracoes";
import AdminPage from "@/pages/admin";
import AdminClientes from "@/pages/admin/clientes";
import AdminAssinaturas from "@/pages/admin/assinaturas";
import AdminEventos from "@/pages/admin/eventos";

function AuthenticatedShell() {
  const { activeTab } = useTab();

  // Prefetch non-period-specific data on mount
  useEffect(() => {
    startTransition(() => {
      queryClient.prefetchQuery({ queryKey: ["/api/cartoes"] });
      queryClient.prefetchQuery({ queryKey: ["/api/goals"] });
      queryClient.prefetchQuery({ queryKey: ["/api/spending-limits"] });
      queryClient.prefetchQuery({ queryKey: ["/api/account-members"] });
      queryClient.prefetchQuery({ queryKey: ["/api/contas"] });
      queryClient.prefetchQuery({ queryKey: ["/api/investimentos"] });
      queryClient.prefetchQuery({ queryKey: ["/api/alertas"] });
      queryClient.prefetchQuery({ queryKey: ["/api/insights-ai"] });
    });
  }, []);

  return (
    <div className="flex flex-col h-screen w-full">
      <NavBar />
      
      <main className="flex-1 overflow-auto w-full pb-16 lg:pb-0">
        <div className="w-full" style={{ display: activeTab === "dashboard" ? "block" : "none" }}>
          <Dashboard />
        </div>
        <div className="w-full" style={{ display: activeTab === "transacoes" ? "block" : "none" }}>
          <Transacoes />
        </div>
        <div className="w-full" style={{ display: activeTab === "economias" ? "block" : "none" }}>
          <Economias />
        </div>
        <div className="w-full" style={{ display: activeTab === "orcamento" ? "block" : "none" }}>
          <Orcamento />
        </div>
        <div className="w-full" style={{ display: activeTab === "metas" ? "block" : "none" }}>
          <Metas />
        </div>
        <div className="w-full" style={{ display: activeTab === "cartoes" ? "block" : "none" }}>
          <Cartoes />
        </div>
        <div className="w-full" style={{ display: activeTab === "insights" ? "block" : "none" }}>
          <Insights />
        </div>
        <div className="w-full" style={{ display: activeTab === "configuracoes" ? "block" : "none" }}>
          <Configuracoes />
        </div>
      </main>

      <BottomNavigation />
      <Toaster />
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  // Check if we're on an admin route
  const isAdminRoute = location.startsWith("/admin");
  
  // Check if we're on login/auth route
  const isAuthRoute = location === "/login" || location === "/auth";

  // Redirect authenticated users away from login/auth pages
  useEffect(() => {
    if (isAuthenticated && isAuthRoute) {
      setLocation("/");
    }
  }, [isAuthenticated, isAuthRoute, setLocation]);

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

  // If authenticated and trying to access login/auth, show loading while redirecting
  if (isAuthenticated && isAuthRoute) {
    return null;
  }

  // Render login/auth page if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <Auth />
        <Toaster />
      </>
    );
  }

  // Render admin routes separately (they have their own layout)
  if (isAdminRoute) {
    if (location === "/admin") {
      return <AdminPage />;
    }
    if (location === "/admin/clientes") {
      return <AdminClientes />;
    }
    if (location === "/admin/assinaturas") {
      return <AdminAssinaturas />;
    }
    if (location === "/admin/eventos") {
      return <AdminEventos />;
    }
    // Default to overview
    return <AdminPage />;
  }

  return (
    <PeriodProvider>
      <TabProvider>
        <AuthenticatedShell />
      </TabProvider>
    </PeriodProvider>
  );
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
