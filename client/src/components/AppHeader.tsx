import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/Logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";

export function AppHeader() {
  const { user } = useAuth();
  const isMobile = useIsMobile();

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

  if (isMobile) {
    return (
      <header className="fixed top-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex flex-col items-center justify-center px-4 py-3 space-y-2">
          {/* Logo */}
          <Logo className="h-10" />
          
          {/* Greeting */}
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {greeting}, {userName}! {emoji}
          </h1>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-16">
      <div className="flex items-center justify-between px-6 h-full">
        {/* Logo */}
        <div className="flex items-center">
          <Logo className="h-10" />
        </div>

        {/* Greeting */}
        <div className="flex-1 flex items-center justify-center">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {greeting}, {userName}! {emoji}
          </h1>
        </div>

        {/* Profile Avatar */}
        <div className="flex items-center">
          <Avatar className="h-10 w-10 border-2 border-[#FACC15]">
            <AvatarImage
              src={user?.profileImageUrl || undefined}
              alt={userName}
            />
            <AvatarFallback className="bg-[#FACC15] text-gray-900 text-sm font-semibold">
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

