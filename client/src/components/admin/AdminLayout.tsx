import { ReactNode, useState } from "react";
import { useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Activity,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
];

interface AdminLayoutProps {
  children: ReactNode;
  currentPath: string;
}

export function AdminLayout({ children, currentPath }: AdminLayoutProps) {
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
          <Button
            key={item.id}
            variant={isActive ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-3 h-12",
              isActive && "bg-accent"
            )}
            onClick={() => handleNavClick(item.path)}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold">Painel Admin</h1>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
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
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:bg-background/95 lg:backdrop-blur supports-[backdrop-filter]:lg:bg-background/60 pt-0">
          <div className="flex flex-col h-full">
            <div className="p-6 border-b">
              <h1 className="text-xl font-bold">Painel Admin</h1>
              <p className="text-sm text-muted-foreground mt-1">AnotaTudo.AI</p>
            </div>
            <nav className="flex-1 overflow-y-auto">
              <SidebarContent />
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:pl-64">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
