import { useState } from "react";
import { Plus, Target, Bell, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { QuickTransactionDialog } from "./QuickTransactionDialog";

interface QuickAction {
  id: string;
  icon: typeof Plus;
  label: string;
  onClick: () => void;
  color: string;
}

export function DashboardQuickActions() {
  const [, setLocation] = useLocation();
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);

  const actions: QuickAction[] = [
    {
      id: "register-transaction",
      icon: Plus,
      label: "Registrar Transação",
      onClick: () => setTransactionDialogOpen(true),
      color: "bg-[#4ADE80] hover:bg-[#4ADE80]/90",
    },
    {
      id: "create-goal",
      icon: Target,
      label: "Criar Meta",
      onClick: () => setLocation("/metas/nova"),
      color: "bg-[#60A5FA] hover:bg-[#60A5FA]/90",
    },
    {
      id: "set-reminder",
      icon: Bell,
      label: "Configurar Lembrete",
      onClick: () => setLocation("/config/lembretes"),
      color: "bg-[#A78BFA] hover:bg-[#A78BFA]/90",
    },
    {
      id: "view-analytics",
      icon: TrendingUp,
      label: "Ver Análises",
      onClick: () => setLocation("/insights"),
      color: "bg-[#FB7185] hover:bg-[#FB7185]/90",
    },
  ];

  return (
    <div className="bg-white/5 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
        Ações rápidas
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={action.onClick}
              className={cn(
                "group relative flex flex-col items-center justify-center gap-3",
                "py-8 px-4 rounded-2xl",
                "transition-all duration-300 ease-out",
                "shadow-lg hover:shadow-xl",
                "hover:scale-105 active:scale-95",
                action.color,
                "text-white"
              )}
            >
              {/* Floating icon */}
              <div className="relative">
                <Icon className="w-8 h-8 md:w-10 md:h-10 transition-transform group-hover:scale-110 group-hover:rotate-3" />
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Label */}
              <span className="text-sm font-semibold text-center leading-tight">
                {action.label}
              </span>

              {/* Shine effect on hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shine transition-opacity" />
            </button>
          );
        })}
      </div>

      <QuickTransactionDialog
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
      />
    </div>
  );
}




