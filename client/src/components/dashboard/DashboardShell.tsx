import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: ReactNode;
  className?: string;
}

export function DashboardShell({ children, className }: DashboardShellProps) {
  return (
    <div
      className={cn(
        "min-h-screen pb-20 transition-colors duration-200 ease-out",
        "bg-[#F6F2FF] dark:bg-[#0E0E12]",
        className
      )}
    >
      <main className="px-4 md:px-6 space-y-6 md:space-y-8 py-6 md:py-8 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}

