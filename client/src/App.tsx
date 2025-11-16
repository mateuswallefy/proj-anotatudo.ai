import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NavBar } from "@/components/NavBar";
import { FAB } from "@/components/fab";
import { useAuth } from "@/hooks/useAuth";
import { PeriodProvider } from "@/contexts/PeriodContext";
import { TabProvider, useTab } from "@/contexts/TabContext";
import { useEffect, startTransition } from "react";
import Auth from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import Transacoes from "@/pages/transacoes";
import Economias from "@/pages/economias";
import Orcamento from "@/pages/orcamento";
import Metas from "@/pages/metas";
import Cartoes from "@/pages/cartoes";
import Insights from "@/pages/insights";
import Configuracoes from "@/pages/configuracoes";

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
      
      <main className="flex-1 overflow-auto w-full">
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

      <FAB />
      <Toaster />
    </div>
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
        <Auth />
        <Toaster />
      </>
    );
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
