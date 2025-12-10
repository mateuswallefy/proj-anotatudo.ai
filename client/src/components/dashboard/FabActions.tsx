import { useState } from "react";
import { Plus, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickTransactionDialog } from "./QuickTransactionDialog";
import { cn } from "@/lib/utils";

export function FabActions() {
  const [isOpen, setIsOpen] = useState(false);
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);

  const handleIncomeClick = () => {
    setIncomeDialogOpen(true);
    setIsOpen(false);
  };

  const handleExpenseClick = () => {
    setExpenseDialogOpen(true);
    setIsOpen(false);
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-3">
        {/* Secondary Action Buttons */}
        <div
          className={cn(
            "flex flex-col gap-2 transition-all duration-300 ease-out",
            isOpen
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-4 pointer-events-none"
          )}
        >
          {/* Receita Button */}
          <Button
            onClick={handleIncomeClick}
            className={cn(
              "rounded-full shadow-lg text-white font-medium transition-all duration-200 hover:scale-105",
              "bg-[#22C55E] hover:bg-[#16A34A]",
              "h-12 sm:h-14 px-4 sm:px-5 gap-2"
            )}
          >
            <ArrowDownCircle className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-sm sm:text-base">Receita</span>
          </Button>

          {/* Despesa Button */}
          <Button
            onClick={handleExpenseClick}
            className={cn(
              "rounded-full shadow-lg text-white font-medium transition-all duration-200 hover:scale-105",
              "bg-[#EF4444] hover:bg-[#DC2626]",
              "h-12 sm:h-14 px-4 sm:px-5 gap-2"
            )}
          >
            <ArrowUpCircle className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-sm sm:text-base">Despesa</span>
          </Button>
        </div>

        {/* Main FAB */}
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "rounded-full shadow-xl transition-all duration-300 text-white",
            "bg-[#6C47FF] hover:bg-[#5B36E6]",
            "h-14 w-14 sm:h-16 sm:w-16",
            "hover:scale-110 active:scale-95"
          )}
          aria-label={isOpen ? "Fechar menu" : "Abrir menu de ações"}
        >
          <Plus
            className={cn(
              "h-6 w-6 sm:h-7 sm:w-7 transition-transform duration-300",
              isOpen && "rotate-45"
            )}
          />
        </Button>
      </div>

      {/* Income Dialog */}
      <QuickTransactionDialog
        open={incomeDialogOpen}
        onOpenChange={setIncomeDialogOpen}
        defaultType="entrada"
      />

      {/* Expense Dialog */}
      <QuickTransactionDialog
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        defaultType="saida"
      />
    </>
  );
}

