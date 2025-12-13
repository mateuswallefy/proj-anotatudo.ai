import { ReactNode } from "react";

interface DashboardContainerProps {
  children: ReactNode;
}

export function DashboardContainer({ children }: DashboardContainerProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">
      {/* Main Content */}
      <section className="pt-4 pb-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {children}
        </div>
      </section>
    </div>
  );
}
