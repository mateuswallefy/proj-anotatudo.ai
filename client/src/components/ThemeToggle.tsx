import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { useState } from "react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    toggleTheme();
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className="relative h-9 w-9 rounded-lg transition-all duration-200 hover:bg-accent/50 group"
      data-testid="button-theme-toggle"
      aria-label={theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"}
    >
      <div
        className={`relative transition-all duration-300 ease-out ${
          isAnimating ? "rotate-180 scale-110" : "rotate-0 scale-100"
        }`}
      >
        {theme === "light" ? (
          <Moon className="h-5 w-5 text-[#64748B] dark:text-[#94A3B8] transition-colors duration-200" />
        ) : (
          <Sun className="h-5 w-5 text-[#94A3B8] transition-colors duration-200" />
        )}
      </div>
      
      {/* Glow effect in dark mode */}
      {theme === "dark" && (
        <div className="absolute inset-0 rounded-lg bg-[var(--glow-blue)] blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
    </Button>
  );
}

