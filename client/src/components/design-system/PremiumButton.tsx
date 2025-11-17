import { Button } from "@/components/ui/button";
import { ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PremiumButtonProps extends ButtonProps {
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
}

export function PremiumButton({ className, variant = "default", ...props }: PremiumButtonProps) {
  const isDefault = variant === "default";
  
  return (
    <Button
      variant={variant}
      className={cn(
        "rounded-xl font-medium transition-all duration-200",
        isDefault && "shadow-lg hover:shadow-xl",
        className
      )}
      {...props}
    />
  );
}

