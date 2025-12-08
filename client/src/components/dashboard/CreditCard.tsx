import { CreditCard as CreditCardIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CreditCardProps {
  id: string;
  nomeCartao: string;
  faturaAtual: number;
  limiteTotal: number;
  percent: number;
  closingDay?: number;
  dueDay?: number;
  status?: "Tranquilo" | "Atenção" | "Alerta";
}

export function CreditCard({
  nomeCartao,
  faturaAtual,
  limiteTotal,
  percent,
  closingDay,
  dueDay,
  status,
}: CreditCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Tranquilo":
        return "bg-[#4ADE80]/20 text-[#4ADE80] border-[#4ADE80]/30";
      case "Atenção":
        return "bg-[#FBBF24]/20 text-[#FBBF24] border-[#FBBF24]/30";
      case "Alerta":
        return "bg-[#FB7185]/20 text-[#FB7185] border-[#FB7185]/30";
      default:
        return "bg-white/10 text-white border-white/20";
    }
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[20px] p-6",
        "bg-gradient-to-br from-[#A78BFA] via-[#60A5FA] to-[#0E0E12]",
        "shadow-2xl border border-white/20",
        "hover:scale-[1.02] transition-transform duration-300"
      )}
    >
      {/* Metallic texture overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23fff' stop-opacity='1'/%3E%3Cstop offset='100%25' stop-color='%23fff' stop-opacity='0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M0 0h100v100H0z' fill='url(%23a)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      {/* Emboss effect on title */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <CreditCardIcon className="w-5 h-5 text-white/80" />
            <h4
              className="text-lg font-bold text-white"
              style={{
                textShadow: "0 1px 2px rgba(0,0,0,0.3), 0 -1px 1px rgba(255,255,255,0.2)",
              }}
            >
              {nomeCartao}
            </h4>
          </div>
          {status && (
            <Badge
              variant="outline"
              className={cn("text-xs border", getStatusColor(status))}
            >
              {status}
            </Badge>
          )}
        </div>

        <div className="mb-6">
          <p className="text-xs text-white/60 mb-1">Fatura atual</p>
          <p
            className="text-3xl font-bold text-white font-sora"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            {formatCurrency(faturaAtual)}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-white/80">
            <span>Limite disponível</span>
            <span>{formatCurrency(limiteTotal - faturaAtual)}</span>
          </div>

          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                percent < 30
                  ? "bg-[#4ADE80]"
                  : percent < 70
                  ? "bg-[#FBBF24]"
                  : "bg-[#FB7185]"
              )}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>

          {(closingDay || dueDay) && (
            <div className="flex items-center gap-4 text-xs text-white/60 pt-2">
              {closingDay && <span>Fecha dia {closingDay}</span>}
              {dueDay && <span>• Vence dia {dueDay}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}




