import { useAuth } from "@/hooks/useAuth";

export function DashboardHeader() {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const userName = user?.firstName || "usuário";
  const greeting = getGreeting();

  // Mock status - você pode integrar com dados reais depois
  const status = "Tudo certo por aqui! 💚";

  return (
    <div className="space-y-2 mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-2">
            {greeting}, {userName} 👋
          </h1>
          <p className="text-[var(--text-secondary)] text-sm md:text-base">
            {status}
          </p>
        </div>
      </div>
    </div>
  );
}


