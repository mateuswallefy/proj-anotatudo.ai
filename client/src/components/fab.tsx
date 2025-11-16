import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export function FAB() {
  const [, setLocation] = useLocation();

  return (
    <Button
      onClick={() => setLocation("/adicionar")}
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg md:hidden z-50"
      size="icon"
      data-testid="fab-add-transaction"
      aria-label="Adicionar transação"
    >
      <Plus className="w-6 h-6" />
    </Button>
  );
}
