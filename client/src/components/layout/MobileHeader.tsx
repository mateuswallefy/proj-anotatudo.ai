import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MobileDrawer } from "./MobileDrawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MobileHeaderProps {
  onMenuOpen?: () => void;
}

export function MobileHeader({ onMenuOpen }: MobileHeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full bg-[#005CA9] shadow-md">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Left: Hamburger Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-white hover:bg-white/10 rounded-full"
              onClick={onMenuOpen}
              data-testid="button-menu-hamburger"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0 border-0 [&>button]:hidden">
            <MobileDrawer />
          </SheetContent>
        </Sheet>

        {/* Center: Logo */}
        <div className="flex items-center justify-center flex-1">
          <Logo className="h-10" white />
        </div>

        {/* Right: Avatar */}
        <Avatar className="h-10 w-10 border-2 border-[#F39200] hover:border-[#003F73] transition-colors">
          <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || "User"} />
          <AvatarFallback className="bg-[#F39200]/20 text-white text-sm font-semibold">
            {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

