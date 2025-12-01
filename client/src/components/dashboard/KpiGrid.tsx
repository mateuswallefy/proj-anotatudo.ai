import { KpiCard } from "@/components/design-system/KpiCard";
import { ArrowDownCircle, ArrowUpCircle, PiggyBank, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface KpiGridProps {
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

export function KpiGrid({
  entradas = 0,
  despesas = 0,
  economias = 0,
  saldo = 0,
  variacaoEntradas = 0,
  variacaoDespesas = 0,
  variacaoEconomias = 0,
  variacaoSaldo = 0,
  isLoading = false,
}: KpiGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
      <KpiCard
        type="income"
        title="ENTRADAS"
        value={entradas}
        variation={variacaoEntradas}
        icon={<ArrowDownCircle className="w-full h-full" />}
      />
      <KpiCard
        type="expense"
        title="DESPESAS"
        value={despesas}
        variation={variacaoDespesas}
        icon={<ArrowUpCircle className="w-full h-full" />}
      />
      <KpiCard
        type="savings"
        title="ECONOMIAS"
        value={economias}
        variation={variacaoEconomias}
        icon={<PiggyBank className="w-full h-full" />}
      />
      <KpiCard
        type="balance"
        title="SALDO DO MÊS"
        value={saldo}
        variation={variacaoSaldo}
        icon={<Wallet className="w-full h-full" />}
      />
    </div>
  );
}



