import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { forwardRef } from "react";

interface PremiumInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  searchIcon?: boolean;
}

export const PremiumInput = forwardRef<HTMLInputElement, PremiumInputProps>(
  ({ className, searchIcon, ...props }, ref) => {
    if (searchIcon) {
      return (
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            ref={ref}
            className={cn(
              "pl-12 h-14 text-base border-2 focus:border-blue-500 focus:ring-blue-500 transition-colors rounded-xl shadow-sm",
              className
            )}
            {...props}
          />
        </div>
      );
    }

    return (
      <Input
        ref={ref}
        className={cn(
          "h-11 md:h-12 rounded-xl border-2 text-base transition-colors focus:border-blue-500 focus:ring-blue-500",
          className
        )}
        {...props}
      />
    );
  }
);

PremiumInput.displayName = "PremiumInput";

