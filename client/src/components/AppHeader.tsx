import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/Logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";

export function AppHeader() {
  const { user } = useAuth();

  const getGreetingWithEmoji = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return { greeting: "Bom dia", emoji: "☀️" };
    }
    
    if (hour >= 12 && hour < 18) {
      return { greeting: "Boa tarde", emoji: "🌤️" };
    }
    
    return { greeting: "Boa noite", emoji: "🌙" };
  };

  const { greeting, emoji } = getGreetingWithEmoji();
  const userName = user?.firstName || "Usuário";

  // Header aparece APENAS no mobile (< 768px), escondido no tablet/desktop usando md:hidden
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 md:hidden">
      <div className="flex items-center gap-3 px-4 py-3 h-16">
        {/* Logo centralizado */}
        <div className="flex items-center justify-center flex-1">
          <Logo className="h-8" />
        </div>
        
        {/* Greeting */}
        <h1 className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex-1 text-center">
          {greeting}, {userName}! {emoji}
        </h1>

        {/* Avatar no canto direito */}
        <div className="flex items-center justify-end flex-1">
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
      </div>
    </header>
  );
}

