import { useTab } from "@/contexts/TabContext";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/lib/auth";
import { useLocation } from "wouter";
import {
  LayoutDashboard,
  Receipt,
  Tag,
  CreditCard,
  Bell,
  Calendar,
  Settings,
  LogOut,
  User,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/Logo";
import { SheetClose } from "@/components/ui/sheet";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  badge?: string;
}

export function MobileNavDrawer() {
  const { setActiveTab } = useTab();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const menuItems: MenuItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      onClick: () => setActiveTab("dashboard"),
    },
    {
      id: "transacoes",
      label: "Transações",
      icon: Receipt,
      onClick: () => setActiveTab("transacoes"),
    },
    {
      id: "categorias",
      label: "Categorias",
      icon: Tag,
      onClick: () => {
        // Navegar para página de categorias quando implementada
        console.log("Categorias - em breve");
      },
    },
    {
      id: "assinatura",
      label: "Assinatura / Plano",
      icon: CreditCard,
      onClick: () => setActiveTab("configuracoes"),
    },
    {
      id: "lembretes",
      label: "Lembretes",
      icon: Bell,
      onClick: () => {
        // Navegar para lembretes quando implementado
        console.log("Lembretes - em breve");
      },
    },
    {
      id: "integracoes",
      label: "Integrações",
      icon: Calendar,
      onClick: () => {
        // Navegar para integrações quando implementado
        console.log("Integrações - em breve");
      },
      badge: "Google Agenda",
    },
  ];

  const handleProfileClick = () => {
    setActiveTab("configuracoes");
  };

  const handleLogout = () => {
    logout();
  };

  const handleAdminClick = () => {
    setLocation("/admin");
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b">
        <Logo className="h-10" />
        <div>
          <p className="text-sm font-semibold">AnotaTudo.AI</p>
          <p className="text-xs text-muted-foreground">Seu controle financeiro</p>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || "User"} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.email || "Usuário"}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <SheetClose key={item.id} asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-12 px-4 text-base"
                  onClick={item.onClick}
                  data-testid={`menu-item-${item.id}`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="text-xs text-muted-foreground ml-2">{item.badge}</span>
                  )}
                </Button>
              </SheetClose>
            );
          })}
        </div>

        <Separator className="my-4" />

        {/* Bottom Menu Items */}
        <div className="space-y-1">
          <SheetClose asChild>
            <Button
              variant="ghost"
              className="w-full justify-start h-12 px-4 text-base"
              onClick={handleProfileClick}
              data-testid="menu-item-perfil"
            >
              <User className="mr-3 h-5 w-5" />
              <span className="flex-1 text-left">Conta / Perfil</span>
            </Button>
          </SheetClose>

          {user?.role === "admin" && (
            <SheetClose asChild>
              <Button
                variant="ghost"
                className="w-full justify-start h-12 px-4 text-base"
                onClick={handleAdminClick}
                data-testid="menu-item-admin"
              >
                <Shield className="mr-3 h-5 w-5" />
                <span className="flex-1 text-left">Painel Admin</span>
              </Button>
            </SheetClose>
          )}

          <SheetClose asChild>
            <Button
              variant="ghost"
              className="w-full justify-start h-12 px-4 text-base text-destructive hover:text-destructive"
              onClick={handleLogout}
              data-testid="menu-item-sair"
            >
              <LogOut className="mr-3 h-5 w-5" />
              <span className="flex-1 text-left">Sair</span>
            </Button>
          </SheetClose>
        </div>
      </nav>
    </div>
  );
}

