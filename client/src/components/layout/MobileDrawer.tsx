import { useTab } from "@/contexts/TabContext";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/lib/auth";
import { useLocation } from "wouter";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  CreditCard,
  Calendar,
  Target,
  FileText,
  Tag,
  TrendingUp,
  Settings,
  LogOut,
  User,
  HelpCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/Logo";
import { SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  tabId?: string;
  path?: string;
}

const menuItems: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, tabId: "dashboard" },
  { id: "lancamentos", label: "Lançamentos", icon: Receipt, tabId: "transacoes" },
  { id: "contas", label: "Contas & Cartões", icon: Wallet, tabId: "contas" },
  { id: "agenda", label: "Agenda", icon: Calendar, tabId: "agenda" },
  { id: "metas", label: "Metas", icon: Target, tabId: "metas" },
  { id: "relatorios", label: "Relatórios", icon: FileText, tabId: "relatorios" },
  { id: "categorias", label: "Categorias", icon: Tag, tabId: "categorias" },
  { id: "tetos", label: "Tetos de Gastos", icon: CreditCard, tabId: "tetos" },
  { id: "insights", label: "Insights", icon: TrendingUp, tabId: "insights" },
  { id: "configuracoes", label: "Configurações", icon: Settings, tabId: "configuracoes" },
];

export function MobileDrawer() {
  const { activeTab, setActiveTab } = useTab();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const handleItemClick = (item: MenuItem) => {
    if (item.tabId) {
      setActiveTab(item.tabId as any);
    } else if (item.path) {
      setLocation(item.path);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex flex-col h-full bg-[#005CA9] text-white overflow-hidden">
      {/* Header compacto com Logo e Close */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Logo className="h-6" white />
          <div className="flex flex-col">
            <span className="text-white font-semibold text-sm">AnotaTudo</span>
            <span className="text-white/70 text-xs">Seu controle financeiro</span>
          </div>
        </div>
        <SheetClose asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/10 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </SheetClose>
      </div>

      {/* Navigation Items - Scrollável */}
      <nav className="flex-1 overflow-y-auto px-4 py-2">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.tabId;
            
            return (
              <SheetClose key={item.id} asChild>
                <button
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-all",
                    isActive
                      ? "bg-blue-400/30 text-white font-bold"
                      : "text-white/90 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className="h-5 w-5 text-white/85" />
                  <span className="text-sm text-white/90">{item.label}</span>
                </button>
              </SheetClose>
            );
          })}
        </div>
      </nav>

      {/* User Profile Section - Rodapé fixo */}
      <div className="px-4 py-4 border-t border-white/20 flex-shrink-0">
        <div className="flex flex-col items-center gap-2 mb-3">
          <Avatar className="h-11 w-11 border-2 border-[#F39200] hover:border-[#003F73] transition-colors">
            <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || "User"} />
            <AvatarFallback className="bg-[#F39200]/20 text-white text-sm font-semibold">
              {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 text-center">
            <p className="text-sm font-semibold text-white">
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.firstName || user?.email || "Usuário"}
            </p>
            <p className="text-xs text-white/70">{user?.email || ""}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-1">
          <SheetClose asChild>
            <button
              onClick={() => setActiveTab("configuracoes")}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-white/90 hover:bg-white/10 hover:text-white transition-all"
            >
              <HelpCircle className="h-5 w-5 text-white/85" />
              <span className="text-sm text-white/90">Ajuda</span>
            </button>
          </SheetClose>
          
          <SheetClose asChild>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-white/90 hover:bg-white/10 hover:text-white transition-all"
            >
              <LogOut className="h-5 w-5 text-white/85" />
              <span className="text-sm text-white/90">Sair</span>
            </button>
          </SheetClose>
        </div>
      </div>
    </div>
  );
}

