import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowDownCircle, ArrowUpCircle, Tag, Wallet, Calendar as CalendarIcon } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { usePeriod } from "@/contexts/PeriodContext";
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
  const selectedDate = form.watch("date");

  // Filter categories by type
  const filteredCategories = categorias.filter((cat) => {
    // This is a simple filter - you may need to adjust based on your category structure
    return true; // For now, show all categories
  });

  // Determine if it's entrada or saida (not economia)
  const isEntrada = selectedType === "entrada";
  const isSaida = selectedType === "saida";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl rounded-2xl shadow-xl border-0 p-0 gap-0">
        {/* Header with Icon */}
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-4 mb-2">
            <div
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0",
                isEntrada
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                  : isSaida
                  ? "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400"
                  : "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400"
              )}
            >
              {isEntrada ? (
                <ArrowDownCircle className="h-7 w-7" />
              ) : isSaida ? (
                <ArrowUpCircle className="h-7 w-7" />
              ) : (
                <Wallet className="h-7 w-7" />
              )}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold">
                {isEntrada
                  ? "Nova receita"
                  : isSaida
                  ? "Nova despesa"
                  : "Nova economia"}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                {isEntrada
                  ? "Registre um valor que entrou na sua conta"
                  : isSaida
                  ? "Registre um gasto que você teve"
                  : "Registre uma economia para suas metas"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 pb-6 space-y-6">
            {/* Line 1: Type Toggle + Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Type Toggle (Segmented Control) */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium mb-2 block">
                      Tipo de transação
                    </FormLabel>
                    <FormControl>
                      <div className="flex rounded-xl bg-slate-50 dark:bg-slate-900 p-1 gap-1">
                        <button
                          type="button"
                          onClick={() => field.onChange("entrada")}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
                            field.value === "entrada"
                              ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm border border-emerald-200 dark:border-emerald-800"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                          )}
                        >
                          <ArrowDownCircle className="h-4 w-4" />
                          Receita
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange("saida")}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
                            field.value === "saida"
                              ? "bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-400 shadow-sm border border-rose-200 dark:border-rose-800"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                          )}
                        >
                          <ArrowUpCircle className="h-4 w-4" />
                          Despesa
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-red-600 dark:text-red-400" />
                  </FormItem>
                )}
              />

              {/* Amount Field */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium mb-2 block">
                      Valor
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
                          R$
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          className={cn(
                            "pl-10 pr-4 h-14 text-lg font-semibold rounded-xl border-2",
                            isEntrada
                              ? "focus:border-emerald-500 focus:ring-emerald-500/20"
                              : isSaida
                              ? "focus:border-rose-500 focus:ring-rose-500/20"
                              : "focus:border-blue-500 focus:ring-blue-500/20"
                          )}
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === "" ? 0 : parseFloat(value) || 0);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-red-600 dark:text-red-400" />
                  </FormItem>
                )}
              />
            </div>

            {/* Line 2: Category + Account */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium mb-2 block">
                      Categoria
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-xl">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Selecione a categoria" />
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredCategories.map((cat) => (
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

              {/* Account */}
              {isSaida && cards && cards.length > 0 && (
                <FormField
                  control={form.control}
                  name="accountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium mb-2 block">
                        Conta
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl">
                            <div className="flex items-center gap-2">
                              <Wallet className="h-4 w-4 text-muted-foreground" />
                              <SelectValue placeholder="Selecione a conta" />
                            </div>
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

              {/* Goal for economia */}
              {selectedType === "economia" && goals && goals.length > 0 && (
                <FormField
                  control={form.control}
                  name="goalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium mb-2 block">
                        Meta
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl">
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

              {/* Spacer if no account/goal */}
              {!isSaida && selectedType !== "economia" && <div />}
            </div>

            {/* Line 3: Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-medium mb-2">
                    Data
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "h-12 w-full justify-start text-left font-normal rounded-xl",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(new Date(field.value), "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            field.onChange(date.toISOString().split("T")[0]);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="text-xs text-red-600 dark:text-red-400" />
                </FormItem>
              )}
            />

            {/* Line 4: Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium mb-2 block">
                    Observações <span className="text-muted-foreground font-normal">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Adicione uma observação sobre esta transação..."
                      className="min-h-[100px] rounded-xl resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-600 dark:text-red-400" />
                </FormItem>
              )}
            />

            {/* Footer */}
            <DialogFooter className="flex-row justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={createMutation.isPending}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className={cn(
                  "rounded-xl font-semibold min-w-[160px]",
                  isEntrada
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : isSaida
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                )}
              >
                {createMutation.isPending ? (
                  <>
                    <span className="mr-2">⏳</span>
                    Salvando...
                  </>
                ) : (
                  "Salvar lançamento"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
