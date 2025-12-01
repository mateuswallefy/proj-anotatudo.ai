import { Button } from "@/components/ui/button";
import { Plus, Star, Clock } from "lucide-react";
import { useLocation } from "wouter";

export function QuickActions() {
  const [, setLocation] = useLocation();

  const actions = [
    {
      id: 'register-transaction',
      icon: Plus,
      label: 'Registrar transação',
      onClick: () => {
        // Navegar para rota de criar transação ou abrir dialog
        setLocation('/transacoes/nova');
      },
      color: 'bg-[var(--accent-green)] hover:bg-[var(--accent-green)]/90 text-white dark:bg-[var(--accent-green)] dark:hover:bg-[var(--accent-green)]/80',
    },
    {
      id: 'create-goal',
      icon: Star,
      label: 'Criar meta',
      onClick: () => {
        // Navegar para rota de criar meta ou abrir dialog
        setLocation('/metas/nova');
      },
      color: 'bg-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/90 text-white dark:bg-[var(--accent-blue)] dark:hover:bg-[var(--accent-blue)]/80',
    },
    {
      id: 'set-reminder',
      icon: Clock,
      label: 'Configurar lembrete',
      onClick: () => {
        // Navegar para rota de lembretes ou abrir dialog
        setLocation('/config/lembretes');
      },
      color: 'bg-[var(--accent-orange)] hover:bg-[var(--accent-orange)]/90 text-white dark:bg-[var(--accent-orange)] dark:hover:bg-[var(--accent-orange)]/80',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.id}
            onClick={action.onClick}
            className={`${action.color} flex flex-col items-center justify-center h-auto py-4 px-3 rounded-xl shadow-sm hover:shadow-md transition-all`}
            data-testid={`quick-action-${action.id}`}
          >
            <Icon className="h-5 w-5 mb-1.5" />
            <span className="text-xs font-medium text-center leading-tight">
              {action.label}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
