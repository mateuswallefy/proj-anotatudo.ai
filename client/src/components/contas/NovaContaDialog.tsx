import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppDialog } from "@/components/ui/AppDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrencyInput, parseCurrencyBRL } from "@/lib/currency";

const contaSchema = z.object({
  nomeConta: z.string().min(1, "Nome da conta é obrigatório"),
  saldoInicial: z.string().min(1, "Saldo inicial é obrigatório"),
});

type ContaFormData = z.infer<typeof contaSchema>;

interface NovaContaDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function NovaContaDialog({ open, onOpenChange }: NovaContaDialogProps) {
  const { toast } = useToast();
  const [formattedSaldo, setFormattedSaldo] = useState("");

  const form = useForm<ContaFormData>({
    resolver: zodResolver(contaSchema),
    defaultValues: {
      nomeConta: "",
      saldoInicial: "0",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        nomeConta: "",
        saldoInicial: "0",
      });
      setFormattedSaldo("0,00");
    }
  }, [open, form]);

  const createMutation = useMutation({
    mutationFn: async (data: ContaFormData) => {
      const saldoNumerico = parseCurrencyBRL(formattedSaldo || "0,00");
      
      const payload = {
        nomeConta: data.nomeConta,
        tipoConta: "corrente" as const,
        saldoAtual: saldoNumerico.toString(),
        banco: "",
        corIdentificacao: "#10B981",
      };

      return await apiRequest("POST", "/api/contas", payload);
    },
    onSuccess: () => {
      toast({
        title: "Conta criada!",
        description: "Sua conta foi registrada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contas"] });
      onOpenChange(false);
      form.reset();
      setFormattedSaldo("0,00");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContaFormData) => {
    createMutation.mutate(data);
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nova conta bancária"
      subtitle="Cadastre uma conta para organizar seus saldos"
      icon={<Wallet className="w-5 h-5 text-primary" />}
      width="md"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="nomeConta"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium text-sm">Nome da conta</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Nubank, Caixa, Carteira"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="saldoInicial"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium text-sm">Saldo inicial</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      R$
                    </span>
                    <Input
                      placeholder="0,00"
                      value={formattedSaldo}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "");
                        const formatted = formatCurrencyInput(raw);
                        setFormattedSaldo(formatted);
                        field.onChange(formatted);
                      }}
                      className="pl-10"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-primary text-white hover:bg-primary/90"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Salvando..." : "Salvar conta"}
            </Button>
          </div>
        </form>
      </Form>
    </AppDialog>
  );
}

