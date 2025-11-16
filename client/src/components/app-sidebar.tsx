import { Home, Receipt, CreditCard, Plus, Settings, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Transações",
    url: "/transacoes",
    icon: Receipt,
  },
  {
    title: "Cartões",
    url: "/cartoes",
    icon: CreditCard,
  },
  {
    title: "Adicionar",
    url: "/adicionar",
    icon: Plus,
  },
  {
    title: "Configurações",
    url: "/configuracoes",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.clear();
      // Force full page reload to ensure clean state
      window.location.href = "/auth";
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao fazer logout",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const getUserInitials = () => {
    if (!user) return "U";
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    return `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "U";
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xl font-bold px-4 py-6 mb-2">
            AnotaTudo.AI
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2 px-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`sidebar-${item.title.toLowerCase()}`}
                    className="h-12 text-base"
                  >
                    <a href={item.url}>
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t mt-auto">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || "User"} />
            <AvatarFallback className="bg-primary text-primary-foreground text-base">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user?.email || "Usuário"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email || ""}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start h-11"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {logoutMutation.isPending ? "Saindo..." : "Sair"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
