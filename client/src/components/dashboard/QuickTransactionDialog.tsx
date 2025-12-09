import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { categorias } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import type { Cartao } from "@shared/schema";
import type { Goal } from "@/types/financial";
import { cn } from "@/lib/utils";

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
  const isIncome = selectedType === "entrada";
  const isExpense = selectedType === "saida";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          w-[430px]
          rounded-2xl
          p-6
          bg-white
          dark:bg-slate-900
          shadow-xl
          border border-neutral-200
          dark:border-slate-800
          max-h-[90vh]
          overflow-y-auto
        "
      >
        {/* HEADER */}
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            {isIncome ? (
              <ArrowDownCircle className="h-6 w-6 text-emerald-500" />
            ) : (
              <ArrowUpCircle className="h-6 w-6 text-rose-500" />
            )}
            {isIncome ? "Nova receita" : isExpense ? "Nova despesa" : "Nova economia"}
          </DialogTitle>
          <p className="text-sm text-neutral-500 dark:text-slate-400">
            {isIncome
              ? "Registre um valor que entrou na sua conta"
              : isExpense
              ? "Registre um gasto ou saída de dinheiro"
              : "Registre uma economia para suas metas"}
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* TYPE SELECTOR – ESTILO "CÁPSULA" */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex items-center gap-3 justify-center mb-2">
                      <button
                        type="button"
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-full border transition-all",
                          field.value === "entrada"
                            ? "bg-emerald-100 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 shadow-sm"
                            : "bg-white dark:bg-slate-800 border-neutral-300 dark:border-slate-700 text-neutral-600 dark:text-slate-300"
                        )}
                        onClick={() => field.onChange("entrada")}
                      >
                        <ArrowDownCircle
                          className={cn(
                            "h-4 w-4",
                            field.value === "entrada"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-neutral-400"
                          )}
                        />
                        Receita
                      </button>

                      <button
                        type="button"
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-full border transition-all",
                          field.value === "saida"
                            ? "bg-rose-100 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 shadow-sm"
                            : "bg-white dark:bg-slate-800 border-neutral-300 dark:border-slate-700 text-neutral-600 dark:text-slate-300"
                        )}
                        onClick={() => field.onChange("saida")}
                      >
                        <ArrowUpCircle
                          className={cn(
                            "h-4 w-4",
                            field.value === "saida"
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-neutral-400"
                          )}
                        />
                        Despesa
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs text-red-600 dark:text-red-400" />
                </FormItem>
              )}
            />

            {/* VALOR */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Valor</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="R$ 0,00"
                      className="h-11 text-[15px]"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? 0 : parseFloat(value) || 0);
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-600 dark:text-red-400" />
                </FormItem>
              )}
            />

            {/* CATEGORIA */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
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
                  <FormMessage className="text-xs text-red-600 dark:text-red-400" />
                </FormItem>
              )}
            />

            {/* CONTA (somente para despesa) */}
            {isExpense && cards && cards.length > 0 && (
              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Conta</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Selecione a conta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sem conta</SelectItem>
                        {cards.map((card) => (
                          <SelectItem key={card.id} value={card.id}>
                            {card.nomeCartao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs text-red-600 dark:text-red-400" />
                  </FormItem>
                )}
              />
            )}

            {/* META (somente para economia) */}
            {selectedType === "economia" && goals && goals.length > 0 && (
              <FormField
                control={form.control}
                name="goalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Meta</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
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
                    <FormMessage className="text-xs text-red-600 dark:text-red-400" />
                  </FormItem>
                )}
              />
            )}

            {/* DATA */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Data</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="date"
                        className="h-11 text-[15px] pr-10"
                        {...field}
                      />
                      <CalendarIcon className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs text-red-600 dark:text-red-400" />
                </FormItem>
              )}
            />

            {/* DESCRIÇÃO */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Observações <span className="text-neutral-400 dark:text-slate-500 text-xs">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <textarea
                      className={cn(
                        "w-full h-24 rounded-xl border border-neutral-300 dark:border-slate-700",
                        "px-3 py-2 text-sm bg-white dark:bg-slate-800",
                        "focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-600",
                        "focus:border-emerald-400 dark:focus:border-emerald-500",
                        "resize-none outline-none transition-colors"
                      )}
                      placeholder="Adicione detalhes sobre esta transação..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-600 dark:text-red-400" />
                </FormItem>
              )}
            />

            {/* FOOTER */}
            <div className="mt-7 flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-slate-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={createMutation.isPending}
                className="text-neutral-600 dark:text-slate-300"
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={createMutation.isPending}
                className={cn(
                  "px-5",
                  isIncome
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : isExpense
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                )}
              >
                {createMutation.isPending ? "Salvando..." : "Salvar lançamento"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
