import { useTab } from "@/contexts/TabContext";
import { usePeriod } from "@/contexts/PeriodContext";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { 
  Shield,
  User,
  LogOut
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
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
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
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

export function NavBar() {
  const { setActiveTab } = useTab();
  const { period, setPeriod } = usePeriod();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Generate period options (last 12 months)
  const periodOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    const value = format(date, "yyyy-MM");
    const label = format(date, "MMMM yyyy", { locale: ptBR });
    return { value, label: label.charAt(0).toUpperCase() + label.slice(1) };
  });

  return (
    <nav className="border-b border-[var(--border)] bg-[var(--card)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--card)]/60 sticky top-0 z-50 transition-colors duration-200">
      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <Logo className="h-14" />
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

      {/* Mobile Header - Now using MobileHeader component */}
      <div className="lg:hidden">
        <MobileHeader />
      </div>
    </nav>
  );
}
