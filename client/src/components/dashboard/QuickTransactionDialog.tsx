import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { usePeriod } from "@/contexts/PeriodContext";
import { categorias } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import type { Cartao } from "@shared/schema";
import type { Goal } from "@/types/financial";

const transactionSchema = z.object({
  type: z.enum(["entrada", "saida", "economia"], {
    required_error: "Selecione o tipo",
  }),
  amount: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
  category: z.string().min(1, "Categoria obrigatória"),
  date: z.string().min(1, "Data obrigatória"),
  description: z.string().optional(),
  accountId: z.string().optional(),
  goalId: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface QuickTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: "entrada" | "saida" | "economia";
  defaultGoalId?: string;
}

export function QuickTransactionDialog({
  open,
  onOpenChange,
  defaultType,
  defaultGoalId,
}: QuickTransactionDialogProps) {
  const { toast } = useToast();
  const { period } = usePeriod();

  // Fetch cards for account selection
  const { data: cards } = useQuery<Cartao[]>({
    queryKey: ["/api/cartoes"],
  });

  // Fetch goals for savings selection
  const { data: goals } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
    select: (data: any) =>
      (data || [])
        .filter((g: any) => g.status === "ativa")
        .map((g: any) => ({
          id: g.id,
          name: g.nome,
          targetAmount: parseFloat(g.valorAlvo),
          currentAmount: parseFloat(g.valorAtual || "0"),
          status: g.status,
        })),
  });

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: defaultType || "saida",
      amount: 0,
      category: "",
      date: new Date().toISOString().split("T")[0],
      description: "",
      accountId: undefined,
      goalId: defaultGoalId || undefined,
    },
  });

  // Reset form when defaultType changes
  useEffect(() => {
    if (defaultType) {
      form.setValue("type", defaultType);
    }
  }, [defaultType, form]);

  const createMutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      const payload: any = {
        tipo: data.type,
        valor: data.amount.toString(),
        categoria: data.category,
        dataReal: data.date,
        origem: "manual",
      };

      if (data.description) {
        payload.descricao = data.description;
      }

      if (data.accountId && data.accountId !== "none") {
        payload.cartaoId = data.accountId;
      }

      if (data.goalId && data.goalId !== "none") {
        payload.goalId = data.goalId;
      }

      return await apiRequest("POST", "/api/transacoes", payload);
    },
    onSuccess: () => {
      toast({
        title: "Transação criada!",
        description: "Sua transação foi registrada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transacoes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credit-cards/overview"] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar transação",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TransactionFormData) => {
    createMutation.mutate(data);
  };

  const selectedType = form.watch("type");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Transação</DialogTitle>
          <DialogDescription>
            Adicione uma nova transação rapidamente
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Despesa</SelectItem>
                      <SelectItem value="economia">Economia</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categorias.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a transação..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedType === "saida" && cards && cards.length > 0 && (
              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cartão (opcional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cartão" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sem cartão</SelectItem>
                        {cards.map((card) => (
                          <SelectItem key={card.id} value={card.id}>
                            {card.nomeCartao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedType === "economia" && goals && goals.length > 0 && (
              <FormField
                control={form.control}
                name="goalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta (opcional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a meta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sem meta</SelectItem>
                        {goals.map((goal) => (
                          <SelectItem key={goal.id} value={goal.id}>
                            {goal.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createMutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

