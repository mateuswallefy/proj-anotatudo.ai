import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTransacaoSchema, type InsertTransacao, categorias } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus } from "lucide-react";

export default function Adicionar() {
  const { toast } = useToast();

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
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Adicionar Transação</h1>
        <p className="text-muted-foreground">
          Registre manualmente uma nova transação financeira
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card data-testid="card-add-transaction-form">
          <CardHeader>
            <CardTitle>Nova Transação</CardTitle>
            <CardDescription>
              Preencha os dados da transação que deseja registrar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Transação</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="entrada" id="entrada" data-testid="radio-entrada" />
                            <Label htmlFor="entrada" className="cursor-pointer">
                              Entrada (Receita)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="saida" id="saida" data-testid="radio-saida" />
                            <Label htmlFor="saida" className="cursor-pointer">
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
                      <FormLabel>Categoria</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categorias.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
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
                      <FormLabel>Valor (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
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
                      <FormLabel>Data</FormLabel>
                      <FormControl>
                        <Input
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
                      <FormLabel>Descrição (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: Almoço no restaurante..."
                          className="resize-none"
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

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={createTransacaoMutation.isPending}
                    data-testid="button-submit-transaction"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {createTransacaoMutation.isPending ? "Salvando..." : "Adicionar Transação"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
