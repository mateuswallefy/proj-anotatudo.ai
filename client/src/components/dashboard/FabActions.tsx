import { useState } from "react";
import { Plus, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickTransactionDialog } from "./QuickTransactionDialog";
import { motion, AnimatePresence } from "framer-motion";
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
      {/* Backdrop blur when open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-3">
        {/* Secondary Action Buttons - Horizontal */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex flex-row gap-2"
            >
              {/* Despesa Button */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
              >
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
              </motion.div>

              {/* Receita Button */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
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
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "rounded-full shadow-xl transition-all duration-300 text-white",
              "bg-[#005CA9] hover:bg-[#003f73]",
              "h-14 w-14 sm:h-16 sm:w-16"
            )}
            aria-label={isOpen ? "Fechar menu" : "Abrir menu de ações"}
          >
            <motion.div
              animate={{ rotate: isOpen ? 45 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <Plus className="h-6 w-6 sm:h-7 sm:w-7" />
            </motion.div>
          </Button>
        </motion.div>
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

