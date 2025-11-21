import { cn } from "@/lib/utils";

type StatusVariant =
  | "active"
  | "trial"
  | "paused"
  | "canceled"
  | "overdue"
  | "suspended"
  | "authenticated"
  | "awaiting_email"
  | "up"
  | "degraded"
  | "down"
  | "info"
  | "warning"
  | "error";

interface StripeStatusBadgeProps {
  status: StatusVariant | string;
  label?: string;
  className?: string;
}

const statusConfig: Record<
  string,
  { label: string; className: string; dotClassName: string }
> = {
  active: {
    label: "Ativo",
    className: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800",
    dotClassName: "bg-green-500",
  },
  trial: {
    label: "Em Teste",
    className: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    dotClassName: "bg-blue-500",
  },
  paused: {
    label: "Pausado",
    className: "bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
    dotClassName: "bg-gray-500",
  },
  canceled: {
    label: "Cancelado",
    className: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800",
    dotClassName: "bg-red-500",
  },
  overdue: {
    label: "Atrasado",
    className: "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    dotClassName: "bg-orange-500",
  },
  suspended: {
    label: "Suspenso",
    className: "bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
    dotClassName: "bg-gray-500",
  },
  authenticated: {
    label: "Autenticado",
    className: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800",
    dotClassName: "bg-green-500",
  },
  awaiting_email: {
    label: "Aguardando Email",
    className: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
    dotClassName: "bg-yellow-500",
  },
  up: {
    label: "Operacional",
    className: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800",
    dotClassName: "bg-green-500",
  },
  degraded: {
    label: "Degradado",
    className: "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    dotClassName: "bg-orange-500",
  },
  down: {
    label: "Indisponível",
    className: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800",
    dotClassName: "bg-red-500",
  },
  info: {
    label: "Info",
    className: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    dotClassName: "bg-blue-500",
  },
  warning: {
    label: "Aviso",
    className: "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    dotClassName: "bg-orange-500",
  },
  error: {
    label: "Erro",
    className: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800",
    dotClassName: "bg-red-500",
  },
};

export function StripeStatusBadge({
  status,
  label,
  className,
}: StripeStatusBadgeProps) {
  const config = statusConfig[status.toLowerCase()] || {
    label: label || status,
    className: "bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
    dotClassName: "bg-gray-500",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border",
        config.className,
        className
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", config.dotClassName)}
      />
      {label || config.label}
    </span>
  );
}


