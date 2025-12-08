import { KpiCard } from "./KpiCard";
import { ArrowDownCircle, ArrowUpCircle, PiggyBank, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { usePeriod } from "@/contexts/PeriodContext";

interface DashboardKpisProps {
  entradas?: number;
  despesas?: number;
  economias?: number;
  saldo?: number;
  variacaoEntradas?: number;
  variacaoDespesas?: number;
  variacaoEconomias?: number;
  variacaoSaldo?: number;
  isLoading?: boolean;
}

export function DashboardKpis({
  entradas = 0,
  despesas = 0,
  economias = 0,
  saldo = 0,
  variacaoEntradas = 0,
  variacaoDespesas = 0,
  variacaoEconomias = 0,
  variacaoSaldo = 0,
  isLoading = false,
}: DashboardKpisProps) {
  const [, setLocation] = useLocation();
  const { period } = usePeriod();

  const handleKpiClick = (type: "income" | "expense" | "savings" | "balance") => {
    const params = new URLSearchParams();
    params.set("period", period);
    
    if (type === "income") {
      params.set("type", "entrada");
    } else if (type === "expense") {
      params.set("type", "saida");
    } else if (type === "savings") {
      params.set("type", "economia");
    }
    
    setLocation(`/transacoes?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <div onClick={() => handleKpiClick("income")} className="cursor-pointer">
        <KpiCard
          type="income"
          title="ENTRADAS"
          value={entradas}
          variation={variacaoEntradas}
          icon={<ArrowDownCircle className="w-full h-full" />}
        />
      </div>
      <div onClick={() => handleKpiClick("expense")} className="cursor-pointer">
        <KpiCard
          type="expense"
          title="DESPESAS"
          value={despesas}
          variation={variacaoDespesas}
          icon={<ArrowUpCircle className="w-full h-full" />}
        />
      </div>
      <div onClick={() => handleKpiClick("savings")} className="cursor-pointer">
        <KpiCard
          type="savings"
          title="ECONOMIAS"
          value={economias}
          variation={variacaoEconomias}
          icon={<PiggyBank className="w-full h-full" />}
        />
      </div>
      <div onClick={() => handleKpiClick("balance")} className="cursor-pointer">
        <KpiCard
          type="balance"
          title="SALDO DO MÊS"
          value={saldo}
          variation={variacaoSaldo}
          icon={<Wallet className="w-full h-full" />}
        />
      </div>
    </div>
  );
}
