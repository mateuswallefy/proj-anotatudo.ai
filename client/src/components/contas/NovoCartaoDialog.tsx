import { useState } from "react";
import { AppDialog } from "@/components/ui/AppDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard } from "lucide-react";

interface NovoCartaoDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function NovoCartaoDialog({ open, onOpenChange }: NovoCartaoDialogProps) {
  const [nome, setNome] = useState("");
  const [limite, setLimite] = useState("0");

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Novo cartão"
      subtitle="Cadastre um cartão de crédito ou débito"
      icon={<CreditCard className="w-5 h-5 text-primary" />}
      width="md"
    >
      <div className="space-y-2">
        <label className="font-medium text-sm">Nome do cartão</label>
        <Input
          placeholder="Ex: Nubank Visa, Santander"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="font-medium text-sm">Limite (se houver)</label>
        <Input
          placeholder="R$ 0,00"
          value={limite}
          onChange={(e) => setLimite(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t mt-4">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button className="bg-primary text-white hover:bg-primary/90">
          Salvar cartão
        </Button>
      </div>
    </AppDialog>
  );
}

