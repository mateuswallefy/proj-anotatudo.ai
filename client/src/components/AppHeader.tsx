import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/Logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu } from "lucide-react";

interface AppHeaderProps {
  onMenuClick?: () => void;
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const { user } = useAuth();
  const userName = user?.firstName || "Usuário";

  // Header aparece APENAS no mobile (< 768px), escondido no tablet/desktop
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 md:hidden h-16">
      <div className="flex items-center justify-between px-4 h-full">
        {/* Botão Hamburger - esquerda */}
        <button
          onClick={onMenuClick}
          className="h-10 w-10 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          data-testid="button-menu-hamburger"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>

        {/* Logo - centro (100% centralizado) */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <Logo className="h-8" />
        </div>

        {/* Avatar - direita */}
        <Avatar className="h-9 w-9 border-2 border-[#FACC15]">
          <AvatarImage
            src={user?.profileImageUrl || undefined}
            alt={userName}
          />
          <AvatarFallback className="bg-[#FACC15] text-gray-900 text-xs font-semibold">
            {user?.firstName?.[0]?.toUpperCase() ||
              user?.email?.[0]?.toUpperCase() ||
              "U"}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
