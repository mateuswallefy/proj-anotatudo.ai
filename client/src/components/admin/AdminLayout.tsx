import { ReactNode, useState } from "react";
import { useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Activity,
  Menu,
  HeartPulse,
  LogOut,
  Webhook,
  TestTube
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/auth";

interface AdminNavItem {
  id: string;
  label: string;
  icon: any;
  path: string;
}

const navItems: AdminNavItem[] = [
  { id: "overview", label: "Visão Geral", icon: LayoutDashboard, path: "/admin" },
  { id: "users", label: "Clientes", icon: Users, path: "/admin/clientes" },
  { id: "subscriptions", label: "Assinaturas", icon: CreditCard, path: "/admin/assinaturas" },
  { id: "events", label: "Eventos", icon: Activity, path: "/admin/eventos" },
  { id: "webhooks", label: "Webhooks", icon: Webhook, path: "/admin/webhooks" },
  { id: "health", label: "Health Center", icon: HeartPulse, path: "/admin/health" },
  { id: "testes", label: "Testes", icon: TestTube, path: "/admin/testes" },
];

interface AdminLayoutProps {
  children: ReactNode;
  currentPath: string;
  pageTitle?: string;
  pageSubtitle?: string;
}

export function AdminLayout({ children, currentPath, pageTitle, pageSubtitle }: AdminLayoutProps) {
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (path: string) => {
    setLocation(path);
    setMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <div className="space-y-1 p-3">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPath === item.path || (item.path === "/admin" && currentPath === "/admin");
        
        return (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.path)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f6f9fc] dark:bg-gray-950">
      <Toaster />
      
      {/* Topbar */}
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-between h-16 px-4 md:px-6">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0 bg-white dark:bg-gray-900">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">AnotaTudo.AI</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Painel Admin</p>
                </div>
                <SidebarContent />
              </SheetContent>
            </Sheet>

            {/* Breadcrumb */}
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Admin</span>
              <span>/</span>
              <span className="text-gray-900 dark:text-gray-50">{pageTitle || "Visão Geral"}</span>
            </div>
          </div>

          {/* Right side - Environment & Logout */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800">
              Produção
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout()}
              className="gap-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-50"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 dark:lg:border-gray-800 lg:bg-white dark:lg:bg-gray-900 pt-16">
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">AnotaTudo.AI</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Painel Admin</p>
            </div>
            <nav className="flex-1 overflow-y-auto">
              <SidebarContent />
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:pl-64 w-full min-h-[calc(100vh-4rem)]">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
          {children}
          </div>
        </main>
      </div>
    </div>
  );
}
