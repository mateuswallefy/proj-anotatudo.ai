import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTransacaoSchema, type InsertTransacao, categorias } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Sparkles } from "lucide-react";
import { PageHeader, PremiumButton, AppCard, PremiumInput } from "@/components/design-system";

interface CategoriaCustomizada {
  id: string;
  userId: string;
  nome: string;
  emoji: string;
  createdAt: string;
}

export default function Adicionar() {
  const { toast } = useToast();

  // Fetch custom categories
  const { data: categoriasCustomizadas = [] } = useQuery<CategoriaCustomizada[]>({
    queryKey: ["/api/categorias-customizadas"],
  });

  const form = useForm<InsertTransacao>({
    resolver: zodResolver(insertTransacaoSchema.extend({
      userId: insertTransacaoSchema.shape.userId,
    })),
    defaultValues: {
      tipo: "saida",
      categoria: "Outros",
      valor: "0",
      dataReal: new Date().toISOString().split('T')[0],
      origem: "manual",
      descricao: "",
      userId: "",
    },
  });

  const createTransacaoMutation = useMutation({
    mutationFn: async (data: InsertTransacao) => {
      await apiRequest("POST", "/api/transacoes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transacoes"] });
      toast({
        title: "Transação adicionada!",
        description: "A transação foi registrada com sucesso.",
      });
      form.reset({
        tipo: "saida",
        categoria: "Outros",
        valor: "0",
        dataReal: new Date().toISOString().split('T')[0],
        origem: "manual",
        descricao: "",
        userId: "",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Por favor, faça login novamente.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a transação.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertTransacao) => {
    createTransacaoMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-8 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Premium Header */}
        <PageHeader
          title="Adicionar Transação"
          subtitle="Registre manualmente uma nova transação financeira"
        />

        <div className="max-w-2xl mx-auto">
          <AppCard className="p-5 md:p-6 rounded-2xl" borderAccent="blue" data-testid="card-add-transaction-form">
            <CardHeader className="space-y-2 pb-4">
              <CardTitle className="text-2xl font-bold tracking-tight">Nova Transação</CardTitle>
              <CardDescription className="text-base">
                Preencha os dados da transação que deseja registrar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">Tipo de Transação</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex gap-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="entrada" id="entrada" data-testid="radio-entrada" />
                              <Label htmlFor="entrada" className="cursor-pointer font-medium text-emerald-600 dark:text-emerald-400">
                                Entrada (Receita)
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="saida" id="saida" data-testid="radio-saida" />
                              <Label htmlFor="saida" className="cursor-pointer font-medium text-red-600 dark:text-red-400">
                                Saída (Despesa)
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="categoria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">Categoria</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-xl border-2" data-testid="select-category">
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categorias.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                            {categoriasCustomizadas && categoriasCustomizadas.length > 0 && (
                              <>
                                <SelectSeparator />
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1">
                                  <Sparkles className="h-3 w-3" />
                                  Minhas Categorias
                                </div>
                                {categoriasCustomizadas.map(cat => (
                                  <SelectItem key={cat.id} value={cat.nome}>
                                    <span className="flex items-center gap-2">
                                      <span>{cat.emoji}</span>
                                      <span>{cat.nome}</span>
                                    </span>
                                  </SelectItem>
                                ))}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="valor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">Valor (R$)</FormLabel>
                        <FormControl>
                          <PremiumInput
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="font-mono"
                            {...field}
                            data-testid="input-valor"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dataReal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">Data</FormLabel>
                        <FormControl>
                          <PremiumInput
                            type="date"
                            {...field}
                            data-testid="input-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="descricao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">Descrição (opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ex: Almoço no restaurante..."
                            className="resize-none rounded-xl border-2 min-h-[100px]"
                            rows={3}
                            {...field}
                            value={field.value || ""}
                            data-testid="textarea-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end pt-2">
                    <PremiumButton
                      type="submit"
                      disabled={createTransacaoMutation.isPending}
                      data-testid="button-submit-transaction"
                      className="h-11 px-6"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      {createTransacaoMutation.isPending ? "Salvando..." : "Adicionar Transação"}
                    </PremiumButton>
                  </div>
                </form>
              </Form>
            </CardContent>
          </AppCard>
        </div>
      </div>
    </div>
  );
}
