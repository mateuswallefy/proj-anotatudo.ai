import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, ArrowDownCircle, ArrowUpCircle, X, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { categorias } from "@shared/schema";
import type { Cartao, CategoriaCustomizada } from "@shared/schema";
import { cn } from "@/lib/utils";
import { formatCurrencyInput, parseCurrencyBRL } from "@/lib/currency";

// Payment method enum
const paymentMethods = [
  { value: "cash", label: "Dinheiro" },
  { value: "pix", label: "Pix" },
  { value: "transfer", label: "Transferência" },
  { value: "credit_card", label: "Cartão de crédito" },
  { value: "debit_card", label: "Cartão de débito" },
  { value: "boleto", label: "Boleto" },
  { value: "other", label: "Outro" },
] as const;

// Base transaction schema (extended for income/expense)
const baseTransactionSchema = z.object({
  amount: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
  category: z.string().min(1, "Categoria obrigatória"),
  date: z.string().min(1, "Data obrigatória"),
  description: z.string().optional(),
  accountId: z.string().optional(),
  paymentMethod: z.enum(["cash", "pix", "transfer", "credit_card", "debit_card", "boleto", "other"]),
  status: z.enum(["paid", "pending"]),
  pendingKind: z.enum(["to_receive", "to_pay"]).optional(),
});

// Income transaction schema
const incomeTransactionSchema = baseTransactionSchema.extend({
  type: z.literal("entrada"),
  pendingKind: z.enum(["to_receive"]).optional(),
});

// Expense transaction schema
const expenseTransactionSchema = baseTransactionSchema.extend({
  type: z.literal("saida"),
  accountId: z.string().optional(),
  pendingKind: z.enum(["to_pay"]).optional(),
});

type IncomeFormData = z.infer<typeof incomeTransactionSchema>;
type ExpenseFormData = z.infer<typeof expenseTransactionSchema>;

interface QuickTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: "entrada" | "saida";
}

// Component for creating new category inline
function CreateCategoryDialog({
  open,
  onOpenChange,
  onCategoryCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryCreated: (categoryName: string) => void;
}) {
  const { toast } = useToast();
  const [categoryName, setCategoryName] = useState("");
  const [emoji, setEmoji] = useState("💰");

  const createMutation = useMutation({
    mutationFn: async (data: { nome: string; emoji: string }) => {
      return await apiRequest("POST", "/api/categorias-customizadas", data);
    },
    onSuccess: (data) => {
      toast({
        title: "Categoria criada!",
        description: "A categoria foi adicionada com sucesso.",
      });
      onCategoryCreated(categoryName);
      setCategoryName("");
      setEmoji("💰");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["/api/categorias-customizadas"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar categoria",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    createMutation.mutate({ nome: categoryName.trim(), emoji });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar nova categoria</DialogTitle>
          <DialogDescription>
            Adicione uma categoria personalizada para suas transações.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Nome da categoria</label>
            <Input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Ex: Alimentação"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Emoji</label>
            <Input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="💰"
              maxLength={2}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Criando..." : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// New Income Dialog Component
function NewIncomeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [formattedValue, setFormattedValue] = useState("");
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);

  // Fetch custom categories
  const { data: customCategories } = useQuery<CategoriaCustomizada[]>({
    queryKey: ["/api/categorias-customizadas"],
  });

  // Combine default and custom categories
  const allCategories = [
    ...categorias,
    ...(customCategories || []).map((c) => `${c.emoji} ${c.nome}`),
  ];

  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeTransactionSchema),
    defaultValues: {
      type: "entrada",
      amount: 0,
      category: "",
      date: new Date().toISOString().split("T")[0],
      description: "",
      paymentMethod: "other",
      status: "paid",
      pendingKind: undefined,
    },
  });

  useEffect(() => {
    if (open) {
      setFormattedValue("");
      form.reset({
        type: "entrada",
        amount: 0,
        category: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
        paymentMethod: "other",
        status: "paid",
        pendingKind: undefined,
      });
    }
  }, [open, form]);

  const createMutation = useMutation({
    mutationFn: async (data: IncomeFormData) => {
      // Map status and pendingKind correctly based on form values
      // IMPORTANT: Use the exact values from the form, don't use || which can override "pending"
      const status = data.status === "pending" ? "pending" : "paid";
      const pendingKind = status === "pending" 
        ? (data.pendingKind || "to_receive") 
        : null; // Explicitly set to null when paid
      
      const payload: any = {
        tipo: "entrada",
        valor: data.amount.toString(),
        categoria: data.category,
        dataReal: data.date,
        origem: "manual",
        paymentMethod: data.paymentMethod || "other",
        status: status, // Use the actual status from form
        pendingKind: pendingKind, // Explicitly set pendingKind (null or "to_receive")
      };

      if (data.description) {
        payload.descricao = data.description;
      }

      // Debug log (remove after testing)
      console.log("[NewIncomeDialog] Payload transacao:", JSON.stringify(payload, null, 2));
      console.log("[NewIncomeDialog] Form data.status:", data.status);
      console.log("[NewIncomeDialog] Form data.pendingKind:", data.pendingKind);

      return await apiRequest("POST", "/api/transacoes", payload);
    },
    onSuccess: () => {
      toast({
        title: "Receita criada!",
        description: "Sua receita foi registrada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transacoes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/overview"] });
      onOpenChange(false);
      form.reset();
      setFormattedValue("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar receita",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: IncomeFormData) => {
    let numericValue = 0;
    if (formattedValue) {
      numericValue = parseCurrencyBRL(formattedValue);
    }
    const formData = { ...data, amount: numericValue };
    createMutation.mutate(formData);
  };

  const status = form.watch("status");
  const categoryValue = form.watch("category");

  // Handle category creation
  useEffect(() => {
    if (categoryValue === "__create__") {
      setCreateCategoryOpen(true);
      form.setValue("category", "");
    }
  }, [categoryValue, form]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl w-full rounded-2xl p-8 shadow-xl border border-neutral-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
          {/* HEADER */}
          <DialogHeader className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                  <ArrowDownCircle className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold">Nova receita</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    Registre um valor que entrou na sua conta
                  </DialogDescription>
                </div>
              </div>
              <DialogClose asChild>
                <button className="rounded-full p-1 hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </DialogClose>
            </div>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Two column layout for first row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Método de pagamento */}
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Método de pagamento</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Valor */}
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Valor</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-slate-400 text-sm font-medium">
                            R$
                          </span>
                          <Input
                            value={formattedValue}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, "");
                              const formatted = formatCurrencyInput(raw);
                              setFormattedValue(formatted);
                              const numericValue = formatted ? parseCurrencyBRL(formatted) : 0;
                              field.onChange(numericValue);
                            }}
                            placeholder="0,00"
                            inputMode="numeric"
                            className="h-11 pl-10 text-[15px] font-medium"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Two column layout for second row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Categoria */}
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
                          {allCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                          <SelectItem value="__create__" className="text-emerald-600 dark:text-emerald-400">
                            <div className="flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                              Criar categoria
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Data */}
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
                          <CalendarIcon className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-slate-500 pointer-events-none" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Status</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => {
                          field.onChange(value);
                          if (value === "paid") {
                            form.setValue("pendingKind", undefined);
                          } else {
                            form.setValue("pendingKind", "to_receive");
                          }
                        }}
                        value={field.value}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="paid" id="paid-income" />
                          <label htmlFor="paid-income" className="text-sm font-normal cursor-pointer">
                            Recebido
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="pending" id="pending-income" />
                          <label htmlFor="pending-income" className="text-sm font-normal cursor-pointer">
                            A receber
                          </label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Observações */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Observações{" "}
                      <span className="text-neutral-400 dark:text-slate-500 text-xs font-normal">
                        (opcional)
                      </span>
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
                    <FormMessage />
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 rounded-xl"
                >
                  {createMutation.isPending ? "Salvando..." : "Salvar lançamento"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <CreateCategoryDialog
        open={createCategoryOpen}
        onOpenChange={(open) => {
          setCreateCategoryOpen(open);
          if (!open && categoryValue === "__create__") {
            form.setValue("category", "");
          }
        }}
        onCategoryCreated={(categoryName) => {
          // Refetch custom categories to get the new one
          queryClient.invalidateQueries({ queryKey: ["/api/categorias-customizadas"] });
          // Wait a bit for the query to update, then set the category
          setTimeout(() => {
            // The category will be available in the next render
            // For now, just set the name and let the user select it
            form.setValue("category", categoryName);
          }, 100);
        }}
      />
    </>
  );
}

// New Expense Dialog Component
function NewExpenseDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [formattedValue, setFormattedValue] = useState("");
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);

  // Fetch cards for account selection
  const { data: cards } = useQuery<Cartao[]>({
    queryKey: ["/api/cartoes"],
  });

  // Fetch custom categories
  const { data: customCategories } = useQuery<CategoriaCustomizada[]>({
    queryKey: ["/api/categorias-customizadas"],
  });

  // Combine default and custom categories
  const allCategories = [
    ...categorias,
    ...(customCategories || []).map((c) => `${c.emoji} ${c.nome}`),
  ];

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseTransactionSchema),
    defaultValues: {
      type: "saida",
      amount: 0,
      category: "",
      date: new Date().toISOString().split("T")[0],
      description: "",
      accountId: undefined,
      paymentMethod: "other",
      status: "paid",
      pendingKind: undefined,
    },
  });

  useEffect(() => {
    if (open) {
      setFormattedValue("");
      form.reset({
        type: "saida",
        amount: 0,
        category: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
        accountId: undefined,
        paymentMethod: "other",
        status: "paid",
        pendingKind: undefined,
      });
    }
  }, [open, form]);

  const createMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      // Map status and pendingKind correctly based on form values
      // IMPORTANT: Use the exact values from the form, don't use || which can override "pending"
      const status = data.status === "pending" ? "pending" : "paid";
      const pendingKind = status === "pending" 
        ? (data.pendingKind || "to_pay") 
        : null; // Explicitly set to null when paid
      
      const payload: any = {
        tipo: "saida",
        valor: data.amount.toString(),
        categoria: data.category,
        dataReal: data.date,
        origem: "manual",
        paymentMethod: data.paymentMethod || "other",
        status: status, // Use the actual status from form
        pendingKind: pendingKind, // Explicitly set pendingKind (null or "to_pay")
      };

      if (data.description) {
        payload.descricao = data.description;
      }

      if (data.accountId && data.accountId !== "none") {
        payload.cartaoId = data.accountId;
      }

      // Debug log (remove after testing)
      console.log("[NewExpenseDialog] Payload transacao:", JSON.stringify(payload, null, 2));
      console.log("[NewExpenseDialog] Form data.status:", data.status);
      console.log("[NewExpenseDialog] Form data.pendingKind:", data.pendingKind);

      return await apiRequest("POST", "/api/transacoes", payload);
    },
    onSuccess: () => {
      toast({
        title: "Despesa criada!",
        description: "Sua despesa foi registrada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transacoes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/overview"] });
      onOpenChange(false);
      form.reset();
      setFormattedValue("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar despesa",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ExpenseFormData) => {
    let numericValue = 0;
    if (formattedValue) {
      numericValue = parseCurrencyBRL(formattedValue);
    }
    const formData = { ...data, amount: numericValue };
    createMutation.mutate(formData);
  };

  const status = form.watch("status");
  const categoryValue = form.watch("category");

  // Handle category creation
  useEffect(() => {
    if (categoryValue === "__create__") {
      setCreateCategoryOpen(true);
      form.setValue("category", "");
    }
  }, [categoryValue, form]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl w-full rounded-2xl p-8 shadow-xl border border-neutral-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
          {/* HEADER */}
          <DialogHeader className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400">
                  <ArrowUpCircle className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold">Nova despesa</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    Registre um gasto ou saída de dinheiro
                  </DialogDescription>
                </div>
              </div>
              <DialogClose asChild>
                <button className="rounded-full p-1 hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </DialogClose>
            </div>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Two column layout for first row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Método de pagamento */}
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Método de pagamento</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Valor */}
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Valor</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-slate-400 text-sm font-medium">
                            R$
                          </span>
                          <Input
                            value={formattedValue}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, "");
                              const formatted = formatCurrencyInput(raw);
                              setFormattedValue(formatted);
                              const numericValue = formatted ? parseCurrencyBRL(formatted) : 0;
                              field.onChange(numericValue);
                            }}
                            placeholder="0,00"
                            inputMode="numeric"
                            className="h-11 pl-10 text-[15px] font-medium"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Two column layout for second row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Categoria */}
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
                          {allCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                          <SelectItem value="__create__" className="text-rose-600 dark:text-rose-400">
                            <div className="flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                              Criar categoria
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Conta */}
                {cards && cards.length > 0 && (
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Two column layout for third row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Data */}
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
                          <CalendarIcon className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-slate-500 pointer-events-none" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Status</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => {
                            field.onChange(value);
                            if (value === "paid") {
                              form.setValue("pendingKind", undefined);
                            } else {
                              form.setValue("pendingKind", "to_pay");
                            }
                          }}
                          value={field.value}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="paid" id="paid-expense" />
                            <label htmlFor="paid-expense" className="text-sm font-normal cursor-pointer">
                              Pago
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="pending" id="pending-expense" />
                            <label htmlFor="pending-expense" className="text-sm font-normal cursor-pointer">
                              A pagar
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Observações */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Observações{" "}
                      <span className="text-neutral-400 dark:text-slate-500 text-xs font-normal">
                        (opcional)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <textarea
                        className={cn(
                          "w-full h-24 rounded-xl border border-neutral-300 dark:border-slate-700",
                          "px-3 py-2 text-sm bg-white dark:bg-slate-800",
                          "focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-600",
                          "focus:border-rose-400 dark:focus:border-rose-500",
                          "resize-none outline-none transition-colors"
                        )}
                        placeholder="Adicione detalhes sobre esta transação..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
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
                  className="bg-rose-600 hover:bg-rose-700 text-white px-5 rounded-xl"
                >
                  {createMutation.isPending ? "Salvando..." : "Salvar lançamento"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <CreateCategoryDialog
        open={createCategoryOpen}
        onOpenChange={(open) => {
          setCreateCategoryOpen(open);
          if (!open && categoryValue === "__create__") {
            form.setValue("category", "");
          }
        }}
        onCategoryCreated={(categoryName) => {
          // Refetch custom categories to get the new one
          queryClient.invalidateQueries({ queryKey: ["/api/categorias-customizadas"] });
          // Wait a bit for the query to update, then set the category
          setTimeout(() => {
            // The category will be available in the next render
            // For now, just set the name and let the user select it
            form.setValue("category", categoryName);
          }, 100);
        }}
      />
    </>
  );
}

// Main wrapper component (maintains backward compatibility)
export function QuickTransactionDialog({
  open,
  onOpenChange,
  defaultType,
}: QuickTransactionDialogProps) {
  // Map "entrada" to income, "saida" to expense
  const isIncome = defaultType === "entrada";
  const isExpense = defaultType === "saida";

  if (isIncome) {
    return <NewIncomeDialog open={open} onOpenChange={onOpenChange} />;
  }

  if (isExpense) {
    return <NewExpenseDialog open={open} onOpenChange={onOpenChange} />;
  }

  // Fallback to expense if no type specified
  return <NewExpenseDialog open={open} onOpenChange={onOpenChange} />;
}
