import { ReactNode, useState } from "react";
import { useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Activity,
  Menu,
  HeartPulse
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { PremiumButton } from "@/components/design-system/PremiumButton";
import { AdminHeader } from "./AdminHeader";
import { cn } from "@/lib/utils";

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
  { id: "health", label: "Health Center", icon: HeartPulse, path: "/admin/health" },
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
    <div className="space-y-2 p-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPath === item.path || (item.path === "/admin" && currentPath === "/admin");
        
        return (
          <PremiumButton
            key={item.id}
            variant={isActive ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-3 h-12 rounded-xl",
              isActive && "bg-accent"
            )}
            onClick={() => handleNavClick(item.path)}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </PremiumButton>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header - Fixed at top */}
      <AdminHeader title={pageTitle || "Painel Admin"} subtitle={pageSubtitle} />

      <div className="flex pt-16 md:pt-20">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:bg-background/95 lg:backdrop-blur supports-[backdrop-filter]:lg:bg-background/60 pt-20">
          <div className="flex flex-col h-full">
            <div className="p-6 border-b">
              <h1 className="text-xl font-bold">Painel Admin</h1>
              <p className="text-sm text-muted-foreground mt-1">AnotaTudo.AI</p>
            </div>
            <nav className="flex-1 overflow-y-auto p-4">
              <SidebarContent />
            </nav>
          </div>
        </aside>

        {/* Mobile Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden fixed top-20 left-4 z-40"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
            </div>
            <SidebarContent />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <main className="flex-1 lg:pl-64 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
