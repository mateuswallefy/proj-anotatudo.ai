import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export function FAB() {
  const [, setLocation] = useLocation();

  return (
    <Button
      onClick={() => setLocation("/adicionar")}
      className="h-14 w-14 rounded-full shadow-lg"
      style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 50, pointerEvents: 'auto' }}
      size="icon"
      data-testid="button-fab"
      aria-label="Adicionar transação"
    >
      <Plus className="w-6 h-6" />
    </Button>
  );
}
