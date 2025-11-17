import { useTab, TabType } from "@/contexts/TabContext";
import { usePeriod } from "@/contexts/PeriodContext";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { 
  LayoutDashboard, 
  Receipt, 
  PiggyBank, 
  Wallet, 
  Target, 
  CreditCard, 
  Lightbulb, 
  Settings,
  Bell,
  X,
  AlertTriangle,
  TrendingUp,
  Shield,
  User,
  LogOut
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { PremiumButton } from "@/components/design-system/PremiumButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/auth";

const tabs: Array<{ id: TabType; label: string; icon: any }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "transacoes", label: "Transações", icon: Receipt },
  { id: "economias", label: "Economias", icon: PiggyBank },
  { id: "orcamento", label: "Orçamento", icon: Wallet },
  { id: "metas", label: "Metas", icon: Target },
  { id: "cartoes", label: "Cartões", icon: CreditCard },
  { id: "insights", label: "Insights", icon: Lightbulb },
  { id: "configuracoes", label: "Configurações", icon: Settings },
];

type Alerta = {
  id: string;
  userId: string;
  tipoAlerta: 'orcamento_excedido' | 'vencimento_fatura' | 'meta_atingida' | 'gasto_acima_media' | 'outro';
  titulo: string;
  descricao: string | null;
  prioridade: 'baixa' | 'media' | 'alta';
  lido: 'sim' | 'nao';
  dataExpiracao: string | null;
  createdAt: string;
};

const getAlertIcon = (tipo: string) => {
  switch (tipo) {
    case 'orcamento_excedido':
      return AlertTriangle;
    case 'vencimento_fatura':
      return CreditCard;
    case 'meta_atingida':
      return Target;
    case 'gasto_acima_media':
      return TrendingUp;
    default:
      return AlertTriangle;
  }
};

const getPrioridadeColor = (prioridade: string) => {
  switch (prioridade) {
    case 'alta':
      return 'destructive';
    case 'media':
      return 'default';
    case 'baixa':
      return 'secondary';
    default:
      return 'secondary';
  }
};

export function NavBar() {
  const { activeTab, setActiveTab } = useTab();
  const { period, setPeriod } = usePeriod();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Buscar alertas não lidos
  const { data: alertas } = useQuery<Alerta[]>({
    queryKey: ["/api/alertas"],
  });

  const alertasNaoLidos = alertas?.filter(a => a.lido === 'nao') || [];

  // Marcar alerta como lido
  const marcarComoLidoMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/alertas/${id}/ler`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alertas"] });
    },
  });

  // Generate period options (last 12 months)
  const periodOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    const value = format(date, "yyyy-MM");
    const label = format(date, "MMMM yyyy", { locale: ptBR });
    return { value, label: label.charAt(0).toUpperCase() + label.slice(1) };
  });

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
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
          
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px] [&>span]:line-clamp-none" data-testid="period-selector">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ThemeToggle />

          {/* User Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" data-testid="button-user-menu">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || "User"} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
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

      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Logo className="h-10" />
        </div>

        {/* Mobile Controls */}
        <div className="flex items-center gap-1.5">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px] h-9 [&>span]:line-clamp-none [&>span]:whitespace-nowrap text-xs" data-testid="period-selector-mobile">
              <SelectValue placeholder="30 dias" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ThemeToggle />

          {/* User Dropdown Menu - Mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" data-testid="button-user-menu-mobile">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || "User"} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
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
                data-testid="menu-item-profile-mobile"
              >
                <User className="h-4 w-4 mr-2" />
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout()}
                data-testid="menu-item-logout-mobile"
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 relative" data-testid="button-notifications">
                <Bell className="h-4 w-4" />
                {alertasNaoLidos.length > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full"></span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">Notificações</h3>
                {alertasNaoLidos.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {alertasNaoLidos.length} nova{alertasNaoLidos.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              
              <div className="max-h-[400px] overflow-y-auto">
                {alertasNaoLidos.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {alertasNaoLidos.map((alerta) => {
                      const Icon = getAlertIcon(alerta.tipoAlerta);
                      return (
                        <div 
                          key={alerta.id} 
                          className="p-4 hover-elevate"
                          data-testid={`alerta-${alerta.id}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className="font-medium text-sm">{alerta.titulo}</p>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 -mt-1 -mr-1"
                                  onClick={() => marcarComoLidoMutation.mutate(alerta.id)}
                                  data-testid={`button-dismiss-${alerta.id}`}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              {alerta.descricao && (
                                <p className="text-xs text-muted-foreground mb-2">{alerta.descricao}</p>
                              )}
                              <Badge variant={getPrioridadeColor(alerta.prioridade) as any} className="text-xs">
                                {alerta.prioridade}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </nav>
  );
}
