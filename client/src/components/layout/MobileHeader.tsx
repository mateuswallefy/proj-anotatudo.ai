import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MobileDrawer } from "./MobileDrawer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MobileHeaderProps {
  onMenuOpen?: () => void;
}

export function MobileHeader({ onMenuOpen }: MobileHeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--card)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--card)]/60 transition-colors duration-200">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left: Hamburger Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={onMenuOpen}
              data-testid="button-menu-hamburger"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0 border-0 [&>button]:hidden">
            <MobileDrawer />
          </SheetContent>
        </Sheet>

        {/* Center: Logo/Title */}
        <div className="flex items-center gap-2">
          <Logo className="h-8" />
          <span className="text-sm font-semibold hidden sm:inline">AnotaTudo.AI</span>
        </div>

        {/* Right: Theme Toggle + Avatar */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || "User"} />
            <AvatarFallback className="bg-[#6C47FF] text-white text-xs">
              {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}

