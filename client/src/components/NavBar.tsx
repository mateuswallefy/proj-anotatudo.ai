import { useTab, TabType } from "@/contexts/TabContext";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { 
  LayoutDashboard, 
  Receipt, 
  Wallet, 
  Target, 
  Lightbulb, 
  Settings,
  Shield,
  User,
  LogOut,
  Calendar,
  FileText,
  Tag,
  TrendingUp
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { PremiumButton } from "@/components/design-system/PremiumButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/auth";
import { MobileHeader } from "@/components/layout/MobileHeader";

const tabs: Array<{ id: TabType; label: string; icon: any }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "transacoes", label: "Lançamentos", icon: Receipt },
  { id: "contas", label: "Contas & Cartões", icon: Wallet },
  { id: "agenda", label: "Agenda", icon: Calendar },
  { id: "metas", label: "Metas", icon: Target },
  { id: "relatorios", label: "Relatórios", icon: FileText },
  { id: "categorias", label: "Categorias", icon: Tag },
  { id: "tetos", label: "Tetos", icon: TrendingUp },
  { id: "insights", label: "Insights", icon: Lightbulb },
  { id: "configuracoes", label: "Configurações", icon: Settings },
];

export function NavBar() {
  const { activeTab, setActiveTab } = useTab();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <nav className="border-b border-[var(--border)] bg-[var(--card)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--card)]/60 sticky top-0 z-50 transition-colors duration-200">
      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <Logo className="h-14" />
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <Button
                  key={tab.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab(tab.id)}
                  className={`gap-2 ${isActive ? 'bg-accent' : ''}`}
                  data-testid={`tab-${tab.id}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden xl:inline">{tab.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {user?.role === "admin" && (
            <PremiumButton
              variant="outline"
              size="sm"
              onClick={() => setLocation("/admin")}
              className="gap-2"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden xl:inline">Painel Admin</span>
            </PremiumButton>
          )}
          
          <ThemeToggle />

          {/* User Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" data-testid="button-user-menu">
                <Avatar className="h-9 w-9 border-2 border-[#F39200]">
                  <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || "User"} />
                  <AvatarFallback className="bg-[#F39200] text-white text-sm font-semibold">
                    {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-semibold">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user?.email || "Usuário"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email || ""}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setActiveTab("configuracoes")}
                data-testid="menu-item-profile"
              >
                <User className="h-4 w-4 mr-2" />
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout()}
                data-testid="menu-item-logout"
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Header - Now using MobileHeader component */}
      <div className="lg:hidden">
        <MobileHeader />
      </div>
    </nav>
  );
}
