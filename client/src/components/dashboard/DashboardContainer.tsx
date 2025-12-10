import { ReactNode } from "react";

interface DashboardContainerProps {
  children: ReactNode;
}

export function DashboardContainer({ children }: DashboardContainerProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="p-4 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="space-y-4 sm:space-y-5 md:space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}

