import { useState } from "react";
import { AppDialog } from "@/components/ui/AppDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet } from "lucide-react";

interface NovaContaDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function NovaContaDialog({ open, onOpenChange }: NovaContaDialogProps) {
  const [nome, setNome] = useState("");
  const [saldoInicial, setSaldoInicial] = useState("0");

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nova conta bancária"
      subtitle="Cadastre uma conta para organizar seus saldos"
      icon={<Wallet className="w-5 h-5 text-primary" />}
      width="md"
    >
      <div className="space-y-2">
        <label className="font-medium text-sm">Nome da conta</label>
        <Input
          placeholder="Ex: Nubank, Caixa, Carteira"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="font-medium text-sm">Saldo inicial</label>
        <Input
          placeholder="R$ 0,00"
          value={saldoInicial}
          onChange={(e) => setSaldoInicial(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t mt-4">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button className="bg-primary text-white hover:bg-primary/90">
          Salvar conta
        </Button>
      </div>
    </AppDialog>
  );
}

