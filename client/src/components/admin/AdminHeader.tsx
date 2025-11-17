import { useLocation } from "wouter";
import { ArrowLeft, LogOut } from "lucide-react";
import { PremiumButton } from "@/components/design-system/PremiumButton";
import { logout } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
}

const pageTitles: Record<string, string> = {
  "/admin": "Visão Geral",
  "/admin/clientes": "Clientes",
  "/admin/assinaturas": "Assinaturas",
  "/admin/eventos": "Eventos",
  "/admin/health": "Health Center",
};

export function AdminHeader({ title, subtitle }: AdminHeaderProps) {
  const [location, setLocation] = useLocation();

  const pageTitle = pageTitles[location] || title;

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          {/* Left side - Back button and title */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <PremiumButton
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="gap-2 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Voltar ao Dashboard</span>
            </PremiumButton>
            
            <div className="flex-1 min-w-0">
              <h1 className="text-lg md:text-xl font-bold truncate">{pageTitle}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground truncate hidden sm:block">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right side - Logout */}
          <PremiumButton
            variant="outline"
            size="sm"
            onClick={() => logout()}
            className="gap-2 shrink-0"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </PremiumButton>
        </div>
      </div>
    </header>
  );
}

