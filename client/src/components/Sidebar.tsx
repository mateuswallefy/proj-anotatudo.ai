import { useState, useEffect } from "react";
import { useTab, TabType } from "@/contexts/TabContext";
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
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

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

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen, mobileMenuOpen: externalMobileMenuOpen, setMobileMenuOpen: externalSetMobileMenuOpen }: SidebarProps) {
  const { activeTab, setActiveTab } = useTab();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [internalMobileMenuOpen, setInternalMobileMenuOpen] = useState(false);
  
  // Usar estado externo se fornecido, senão usar interno
  const mobileMenuOpen = externalMobileMenuOpen !== undefined ? externalMobileMenuOpen : internalMobileMenuOpen;
  const setMobileMenuOpen = externalSetMobileMenuOpen || setInternalMobileMenuOpen;

  // Responsividade: definir estado inicial baseado no tamanho da tela
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
      return;
    }

    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        // Mobile
        setIsOpen(false);
      } else if (width < 1024) {
        // Tablet: começa fechada
        setIsOpen(false);
      } else {
        // Desktop: começa aberta
        setIsOpen(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile, setIsOpen]);

  // Desabilitar scroll do body quando drawer mobile estiver aberto
  useEffect(() => {
    if (isMobile && mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, mobileMenuOpen]);

  const handleTabClick = (tabId: TabType) => {
    setActiveTab(tabId);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const SidebarContent = ({ forceOpen = false }: { forceOpen?: boolean }) => {
    const displayOpen = forceOpen || isOpen;
    
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-900">
        {/* Logo Section */}
        <div className={cn(
          "flex items-center border-b border-gray-200 dark:border-gray-800",
          displayOpen ? "justify-between px-6" : "justify-center px-2",
          "py-4"
        )}>
          {displayOpen ? (
            <>
              <Logo className="h-10" />
              {isMobile && (
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Fechar menu"
                >
                  <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </button>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center w-10 h-10">
              <Logo className="h-8 w-8" iconOnly />
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <li key={tab.id}>
                  <button
                    onClick={() => handleTabClick(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-[#3B82F6] text-white shadow-sm hover:bg-[#1E40AF]"
                        : "text-[#334155] dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                      displayOpen ? "justify-start" : "justify-center"
                    )}
                    data-testid={`sidebar-tab-${tab.id}`}
                    title={!displayOpen ? tab.label : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {displayOpen && (
                      <span className="text-sm font-medium whitespace-nowrap">
                        {tab.label}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-2 space-y-1">
          {/* Admin Button */}
          {user?.role === "admin" && (
            <button
              onClick={() => setLocation("/admin")}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                displayOpen ? "justify-start" : "justify-center"
              )}
              title={!displayOpen ? "Painel Admin" : undefined}
            >
              <Shield className="h-5 w-5 flex-shrink-0" />
              {displayOpen && (
                <span className="text-sm font-medium whitespace-nowrap">
                  Painel Admin
                </span>
              )}
            </button>
          )}

          {/* Theme Toggle */}
          <div
            className={cn(
              "flex items-center",
              displayOpen ? "justify-start px-3" : "justify-center"
            )}
          >
            <ThemeToggle />
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                  displayOpen ? "justify-start" : "justify-center"
                )}
                title={!displayOpen ? "Menu do usuário" : undefined}
              >
                <Avatar className="h-8 w-8 border-2 border-[#FACC15] flex-shrink-0">
                  <AvatarImage
                    src={user?.profileImageUrl || undefined}
                    alt={user?.firstName || "User"}
                  />
                  <AvatarFallback className="bg-[#FACC15] text-gray-900 text-xs font-semibold">
                    {user?.firstName?.[0]?.toUpperCase() ||
                      user?.email?.[0]?.toUpperCase() ||
                      "U"}
                  </AvatarFallback>
                </Avatar>
                {displayOpen && (
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {user?.firstName && user?.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user?.email || "Usuário"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user?.email || ""}
                    </p>
                  </div>
                )}
              </button>
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
                onClick={() => {
                  setActiveTab("configuracoes");
                  if (isMobile) setMobileMenuOpen(false);
                }}
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
    );
  };

  // Mobile: drawer usando transform translate-x (sem Sheet)
  if (isMobile) {
    return (
      <>
        {/* Overlay quando drawer está aberto */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              opacity: mobileMenuOpen ? 1 : 0,
              pointerEvents: mobileMenuOpen ? "auto" : "none",
            }}
          />
        )}

        {/* Drawer Sidebar */}
        <aside
          className={cn(
            "fixed top-0 left-0 h-screen w-[280px] sm:w-[320px] z-50",
            "bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800",
            "transform transition-transform duration-300 ease-in-out",
            "shadow-xl"
          )}
          style={{
            transform: mobileMenuOpen ? "translateX(0)" : "translateX(-100%)",
          }}
        >
          {/* Conteúdo da Sidebar */}
          <SidebarContent forceOpen={true} />
        </aside>
      </>
    );
  }

  // Desktop/Tablet: sidebar fixa (sem header acima, começa no topo)
  return (
    <>
      <aside
        className={cn(
          "h-screen fixed left-0 top-0 z-40 bg-white dark:bg-gray-900",
          "border-r border-gray-200 dark:border-gray-800",
          "transition-all duration-300 ease-in-out",
          isOpen ? "w-60" : "w-20"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed top-6 z-50 bg-white dark:bg-gray-900",
          "border border-gray-200 dark:border-gray-800 rounded-full p-1.5",
          "shadow-lg hover:shadow-xl hover:bg-gray-50 dark:hover:bg-gray-800",
          "transition-all duration-200",
          isOpen ? "left-[228px]" : "left-[68px]"
        )}
        aria-label={isOpen ? "Fechar sidebar" : "Abrir sidebar"}
      >
        {isOpen ? (
          <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        )}
      </button>
    </>
  );
}
