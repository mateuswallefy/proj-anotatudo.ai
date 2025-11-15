import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Cartao } from "@shared/schema";
import { CreditCard, Plus, Calendar, AlertCircle } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCartaoSchema, type InsertCartao } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Cartoes() {
  const { data: cartoes, isLoading } = useQuery<Cartao[]>({
    queryKey: ["/api/cartoes"],
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<InsertCartao>({
    resolver: zodResolver(insertCartaoSchema.extend({
      userId: insertCartaoSchema.shape.userId,
    })),
    defaultValues: {
      nomeCartao: "",
      limiteTotal: "0",
      diaFechamento: 1,
      diaVencimento: 10,
      bandeira: "visa",
      userId: "",
    },
  });

  const createCartaoMutation = useMutation({
    mutationFn: async (data: InsertCartao) => {
      await apiRequest("POST", "/api/cartoes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cartoes"] });
      toast({
        title: "Cartão adicionado!",
        description: "O cartão foi criado com sucesso.",
      });
      setDialogOpen(false);
      form.reset();
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
        description: "Não foi possível adicionar o cartão.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertCartao) => {
    createCartaoMutation.mutate(data);
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(parseFloat(value));
  };

  const calculatePercentage = (used: string, total: string) => {
    const usedNum = parseFloat(used);
    const totalNum = parseFloat(total);
    if (totalNum === 0) return 0;
    return (usedNum / totalNum) * 100;
  };

  const getLimitColor = (percentage: number) => {
    if (percentage >= 90) return "text-destructive";
    if (percentage >= 70) return "text-chart-4";
    return "text-chart-1";
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Cartões de Crédito</h1>
          <p className="text-muted-foreground">
            Gerencie seus cartões e acompanhe limites
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-card">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Cartão
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Cartão</DialogTitle>
              <DialogDescription>
                Cadastre um novo cartão de crédito
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nomeCartao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Cartão</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Nubank" {...field} data-testid="input-card-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bandeira"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bandeira</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-card-brand">
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

                <FormField
                  control={form.control}
                  name="limiteTotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limite Total (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00" 
                          {...field} 
                          data-testid="input-card-limit"
                        />
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
                        <FormLabel>Dia Fechamento</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            max="31" 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value))}
                            data-testid="input-card-closing-day"
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
                        <FormLabel>Dia Vencimento</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            max="31" 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value))}
                            data-testid="input-card-due-day"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createCartaoMutation.isPending}
                    data-testid="button-submit-card"
                  >
                    {createCartaoMutation.isPending ? "Salvando..." : "Salvar Cartão"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {cartoes && cartoes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cartoes.map((cartao) => {
            const percentage = calculatePercentage(cartao.limiteUsado, cartao.limiteTotal);
            const disponivel = parseFloat(cartao.limiteTotal) - parseFloat(cartao.limiteUsado);

            return (
              <Card key={cartao.id} className="hover-elevate" data-testid={`card-cartao-${cartao.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{cartao.nomeCartao}</CardTitle>
                        {cartao.bandeira && (
                          <Badge variant="outline" className="mt-1 capitalize">
                            {cartao.bandeira}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {percentage >= 80 && (
                      <AlertCircle className="w-5 h-5 text-chart-4" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Limite Usado</span>
                      <span className={`text-sm font-mono font-semibold ${getLimitColor(percentage)}`}>
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(cartao.limiteUsado)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(cartao.limiteTotal)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Disponível</span>
                      <span className="text-sm font-mono font-semibold text-chart-1">
                        {formatCurrency(disponivel.toString())}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Fecha: dia {cartao.diaFechamento}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Vence: dia {cartao.diaVencimento}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card data-testid="card-empty-state-cartoes">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <CreditCard className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum cartão cadastrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Adicione seus cartões para acompanhar limites e faturas
            </p>
            <Button onClick={() => setDialogOpen(true)} data-testid="button-add-first-card">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Cartão
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
