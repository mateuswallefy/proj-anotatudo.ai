import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, Plus, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import type { Goal } from "@/types/financial";
import { AddContributionDialog } from "./AddContributionDialog";

interface DashboardGoalsProps {
  goals?: Goal[];
  isLoading?: boolean;
  onCreateGoal?: () => void;
}

export function DashboardGoals({
  goals,
  isLoading = false,
  onCreateGoal,
}: DashboardGoalsProps) {
  const [, setLocation] = useLocation();
  const [contributionDialogOpen, setContributionDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num || 0);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr + "T00:00:00");
      return date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
    } catch {
      return null;
    }
  };

  const getStatusBadge = (percent: number) => {
    if (percent >= 100) {
      return <Badge className="bg-[#4ADE80] text-white">Concluída</Badge>;
    }
    if (percent >= 75) {
      return <Badge className="bg-[#60A5FA] text-white">Quase lá</Badge>;
    }
    if (percent >= 50) {
      return <Badge className="bg-[#A78BFA] text-white">Em andamento</Badge>;
    }
    return <Badge variant="outline">Iniciando</Badge>;
  };

  if (isLoading) {
    return (
      <div className="bg-white/5 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-lg">
        <Skeleton className="h-6 w-40 mb-6" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const displayGoals = goals || [];

  return (
    <div className="bg-white/5 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Target className="w-5 h-5 text-[#4ADE80]" />
          Metas & Economias
        </h3>
        {displayGoals.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/metas")}
            className="text-xs"
          >
            Ver todas
          </Button>
        )}
      </div>

      {displayGoals.length === 0 ? (
        <div className="text-center py-8">
          <Target className="h-12 w-12 mx-auto mb-3 text-[var(--text-secondary)] opacity-50" />
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Nenhuma meta ativa no momento
          </p>
          <Button
            onClick={onCreateGoal || (() => setLocation("/metas/nova"))}
            className="bg-[#4ADE80] hover:bg-[#4ADE80]/90 text-white"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar primeira meta
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayGoals.slice(0, 3).map((goal) => {
            const valorAtual = goal.currentAmount;
            const valorAlvo = goal.targetAmount;
            const percent = valorAlvo > 0 ? (valorAtual / valorAlvo) * 100 : 0;
            const dataFim = goal.deadline ? formatDate(goal.deadline) : null;

            return (
              <div
                key={goal.id}
                className="bg-white/5 dark:bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-all duration-300"
                style={{ 
                  animation: `fadeIn 0.5s ease-out ${displayGoals.indexOf(goal) * 0.1}s both`
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-base font-semibold text-[var(--text-primary)] flex-1">
                    {goal.name}
                  </h4>
                  {getStatusBadge(percent)}
                </div>

                <div className="space-y-3">
                  {/* 3D Progress Bar */}
                  <div className="relative">
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 relative"
                        style={{
                          width: `${Math.min(percent, 100)}%`,
                          background: `linear-gradient(90deg, #4ADE80 0%, #60A5FA 100%)`,
                          boxShadow: `0 0 20px rgba(74, 222, 128, 0.3)`,
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-[var(--text-primary)]">
                      {formatCurrency(valorAtual)} de {formatCurrency(valorAlvo)}
                    </span>
                    <span className="text-[var(--text-secondary)] font-sora">
                      {percent.toFixed(0)}%
                    </span>
                  </div>

                  {dataFim && (
                    <p className="text-xs text-[var(--text-secondary)]">
                      Meta até {dataFim}
                    </p>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={() => {
                      setSelectedGoal(goal);
                      setContributionDialogOpen(true);
                    }}
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Adicionar aporte
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedGoal && (
        <AddContributionDialog
          open={contributionDialogOpen}
          onOpenChange={setContributionDialogOpen}
          goalId={selectedGoal.id}
          goalName={selectedGoal.name}
        />
      )}
    </div>
  );
}


