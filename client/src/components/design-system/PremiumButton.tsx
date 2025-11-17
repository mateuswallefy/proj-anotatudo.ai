import { Button } from "@/components/ui/button";
import { ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface PremiumButtonProps extends ButtonProps {
  variant?: "default" | "outline" | "outline" | "ghost" | "destructive" | "secondary";
}

export const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const isDefault = variant === "default";
    
    return (
      <Button
        ref={ref}
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
);

PremiumButton.displayName = "PremiumButton";

