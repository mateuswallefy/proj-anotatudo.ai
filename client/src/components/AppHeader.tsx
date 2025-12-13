import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/Logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getGreetingMessage } from "@/lib/greeting";

export function AppHeader() {
  const { user } = useAuth();
  const { greeting, emoji } = getGreetingMessage();
  const userName = user?.firstName || "Usuário";

  // Header aparece APENAS no mobile (< 768px), escondido no tablet/desktop
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 md:hidden h-16">
      <div className="flex items-center h-full px-4">
        {/* Logo - coluna 1 */}
        <div className="flex-1 flex items-center justify-start">
          <Logo className="h-8" />
        </div>
        
        {/* Greeting - coluna 2 (centralizada) */}
        <div className="flex-1 flex items-center justify-center">
          <h1 className="text-sm font-semibold text-gray-800 dark:text-gray-100 text-center whitespace-nowrap">
            {greeting}, {userName}! {emoji}
          </h1>
        </div>

        {/* Avatar - coluna 3 */}
        <div className="flex-1 flex items-center justify-end">
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
