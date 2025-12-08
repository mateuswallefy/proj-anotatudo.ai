import { useState } from "react";
import { Plus, ArrowDownCircle, ArrowUpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickTransactionDialog } from "./QuickTransactionDialog";
import { cn } from "@/lib/utils";

export function DashboardFabActions() {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<
    "entrada" | "saida" | undefined
  >();

  const handleOpenDialog = (type: "entrada" | "saida") => {
    setTransactionType(type);
    setDialogOpen(true);
    setIsOpen(false);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Action Buttons */}
        <div
          className={cn(
            "flex flex-col gap-2 transition-all duration-300",
            isOpen
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none"
          )}
        >
          <Button
            size="lg"
            className="rounded-full h-14 w-14 shadow-lg bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={() => handleOpenDialog("entrada")}
          >
            <ArrowDownCircle className="h-6 w-6" />
          </Button>
          <Button
            size="lg"
            className="rounded-full h-14 w-14 shadow-lg bg-pink-500 hover:bg-pink-600 text-white"
            onClick={() => handleOpenDialog("saida")}
          >
            <ArrowUpCircle className="h-6 w-6" />
          </Button>
        </div>

        {/* Main FAB */}
        <Button
          size="lg"
          className={cn(
            "rounded-full h-16 w-16 shadow-xl transition-all duration-300",
            isOpen
              ? "bg-red-500 hover:bg-red-600 rotate-45"
              : "bg-primary hover:bg-primary/90"
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <Plus className="h-6 w-6 text-white" />
          )}
        </Button>
      </div>

      {/* Transaction Dialog */}
      <QuickTransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultType={transactionType}
      />
    </>
  );
}

