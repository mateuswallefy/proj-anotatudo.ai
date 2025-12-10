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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrencyInput, parseCurrencyBRL } from "@/lib/currency";

const cartaoSchema = z.object({
  nomeCartao: z.string().min(1, "Nome do cartão é obrigatório"),
  limiteTotal: z.string().min(1, "Limite é obrigatório"),
  diaFechamento: z.coerce.number().min(1).max(31),
  diaVencimento: z.coerce.number().min(1).max(31),
  bandeira: z.enum(["visa", "mastercard", "elo", "american-express", "outro"]),
});

type CartaoFormData = z.infer<typeof cartaoSchema>;

interface NovoCartaoDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function NovoCartaoDialog({ open, onOpenChange }: NovoCartaoDialogProps) {
  const { toast } = useToast();
  const [formattedLimite, setFormattedLimite] = useState("");

  const form = useForm<CartaoFormData>({
    resolver: zodResolver(cartaoSchema),
    defaultValues: {
      nomeCartao: "",
      limiteTotal: "0",
      diaFechamento: 1,
      diaVencimento: 10,
      bandeira: "visa",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        nomeCartao: "",
        limiteTotal: "0",
        diaFechamento: 1,
        diaVencimento: 10,
        bandeira: "visa",
      });
      setFormattedLimite("0,00");
    }
  }, [open, form]);

  const createMutation = useMutation({
    mutationFn: async (data: CartaoFormData) => {
      const limiteNumerico = parseCurrencyBRL(formattedLimite || "0,00");
      
      const payload = {
        nomeCartao: data.nomeCartao,
        limiteTotal: limiteNumerico.toString(),
        diaFechamento: data.diaFechamento,
        diaVencimento: data.diaVencimento,
        bandeira: data.bandeira,
      };

      return await apiRequest("POST", "/api/cartoes", payload);
    },
    onSuccess: () => {
      toast({
        title: "Cartão criado!",
        description: "Seu cartão foi registrado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cartoes"] });
      onOpenChange(false);
      form.reset();
      setFormattedLimite("0,00");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar cartão",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CartaoFormData) => {
    createMutation.mutate(data);
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Novo cartão"
      subtitle="Cadastre um cartão de crédito ou débito"
      icon={<CreditCard className="w-5 h-5 text-primary" />}
      width="md"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="nomeCartao"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium text-sm">Nome do cartão</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Nubank Visa, Santander"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="limiteTotal"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium text-sm">Limite</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      R$
                    </span>
                    <Input
                      placeholder="0,00"
                      value={formattedLimite}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "");
                        const formatted = formatCurrencyInput(raw);
                        setFormattedLimite(formatted);
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

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="diaFechamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium text-sm">Dia de fechamento</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="diaVencimento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium text-sm">Dia de vencimento</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="bandeira"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium text-sm">Bandeira</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a bandeira" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="visa">Visa</SelectItem>
                    <SelectItem value="mastercard">Mastercard</SelectItem>
                    <SelectItem value="elo">Elo</SelectItem>
                    <SelectItem value="american-express">American Express</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
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
              {createMutation.isPending ? "Salvando..." : "Salvar cartão"}
            </Button>
          </div>
        </form>
      </Form>
    </AppDialog>
  );
}

