import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { PeriodProvider } from "@/contexts/PeriodContext";
import { TabProvider, useTab } from "@/contexts/TabContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useEffect, startTransition, useState } from "react";
import { useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import Auth from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import Lancamentos from "@/pages/lancamentos";
import ContasCartoes from "@/pages/contas-cartoes";
import Agenda from "@/pages/agenda";
import Metas from "@/pages/metas";
import Relatorios from "@/pages/relatorios";
import Categorias from "@/pages/categorias";
import TetosGastos from "@/pages/tetos-gastos";
import Insights from "@/pages/insights";
import Configuracoes from "@/pages/configuracoes";
import AdminPage from "@/pages/admin";
import AdminClientes from "@/pages/admin/clientes";
import AdminAssinaturas from "@/pages/admin/assinaturas";
import AdminEventos from "@/pages/admin/eventos";
import AdminWebhooks from "@/pages/admin/webhooks";
import AdminHealth from "@/pages/admin/health";
import AdminTestes from "@/pages/admin/testes";

function AuthenticatedShell() {
  const { activeTab } = useTab();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  // Ajustar padding baseado no estado da sidebar e responsividade
  const getMainPadding = () => {
    if (isMobile) {
      return "pl-0 pt-16"; // Mobile: padding top para o botão hamburger
    }
    return sidebarOpen ? "pl-60" : "pl-20"; // Desktop/Tablet: padding lateral (240px = 60*4, 80px = 20*4)
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <main className={`flex-1 overflow-auto transition-all duration-300 ${getMainPadding()}`}>
        <div className="w-full" style={{ display: activeTab === "dashboard" ? "block" : "none" }}>
          <Dashboard />
        </div>
        <div className="w-full" style={{ display: activeTab === "transacoes" ? "block" : "none" }}>
          <Lancamentos />
        </div>
        <div className="w-full" style={{ display: activeTab === "contas" ? "block" : "none" }}>
          <ContasCartoes />
        </div>
        <div className="w-full" style={{ display: activeTab === "agenda" ? "block" : "none" }}>
          <Agenda />
        </div>
        <div className="w-full" style={{ display: activeTab === "metas" ? "block" : "none" }}>
          <Metas />
        </div>
        <div className="w-full" style={{ display: activeTab === "relatorios" ? "block" : "none" }}>
          <Relatorios />
        </div>
        <div className="w-full" style={{ display: activeTab === "categorias" ? "block" : "none" }}>
          <Categorias />
        </div>
        <div className="w-full" style={{ display: activeTab === "tetos" ? "block" : "none" }}>
          <TetosGastos />
        </div>
        <div className="w-full" style={{ display: activeTab === "insights" ? "block" : "none" }}>
          <Insights />
        </div>
        <div className="w-full" style={{ display: activeTab === "configuracoes" ? "block" : "none" }}>
          <Configuracoes />
        </div>
      </main>

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
    if (location === "/admin/webhooks") {
      return <AdminWebhooks />;
    }
    if (location === "/admin/health") {
      return <AdminHealth />;
    }
    if (location === "/admin/testes") {
      return <AdminTestes />;
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
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
