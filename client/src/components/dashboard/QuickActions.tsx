import { Plus, Target, Bell } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function QuickActions() {
  const [, setLocation] = useLocation();

  const actions = [
    {
      id: 'register-transaction',
      icon: Plus,
      label: 'Registrar Transação',
      onClick: () => setLocation('/transacoes/nova'),
      color: 'bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white dark:bg-[var(--accent-primary)] dark:hover:bg-[var(--accent-primary)]/80',
      glowColor: 'primary',
    },
    {
      id: 'create-goal',
      icon: Target,
      label: 'Criar Meta',
      onClick: () => setLocation('/metas/nova'),
      color: 'bg-[var(--accent-secondary)] hover:bg-[var(--accent-secondary)]/90 text-white dark:bg-[var(--accent-secondary)] dark:hover:bg-[var(--accent-secondary)]/80',
      glowColor: 'secondary',
    },
    {
      id: 'set-reminder',
      icon: Bell,
      label: 'Configurar Lembrete',
      onClick: () => setLocation('/config/lembretes'),
      color: 'bg-[var(--accent-success)] hover:bg-[var(--accent-success)]/90 text-white dark:bg-[var(--accent-success)] dark:hover:bg-[var(--accent-success)]/80',
      glowColor: 'green',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            onClick={action.onClick}
            className={cn(
              "group relative flex flex-col items-center justify-center gap-3",
              "py-6 px-4 rounded-[var(--radius-lg)]",
              "transition-all duration-200 ease-out",
              "shadow-sm hover:shadow-lg",
              "hover:scale-[1.02] active:scale-[0.98]",
              action.color,
              action.glowColor === 'primary' && "dark:shadow-[0_0_20px_var(--glow-primary)]",
              action.glowColor === 'secondary' && "dark:shadow-[0_0_20px_var(--glow-secondary)]",
              action.glowColor === 'green' && "dark:shadow-[0_0_20px_var(--glow-green)]"
            )}
            data-testid={`quick-action-${action.id}`}
          >
            <div className="relative">
              <Icon className="h-6 w-6 md:h-7 md:w-7 transition-transform group-hover:scale-110" />
            </div>
            <span className="text-sm md:text-base font-semibold text-center leading-tight">
              {action.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
