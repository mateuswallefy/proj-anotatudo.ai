import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Cartao } from "@shared/schema";
import { CreditCard, Plus, Calendar } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCartaoSchema, type InsertCartao } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Progress } from "@/components/ui/progress";
import { PageHeader, PremiumButton, AppCard, SectionTitle, PremiumInput } from "@/components/design-system";

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

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-orange-500";
    return "bg-emerald-500";
  };

  const formatDueDate = (diaVencimento: number) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const dueDate = new Date(currentYear, currentMonth, diaVencimento);
    
    if (dueDate < currentDate) {
      dueDate.setMonth(currentMonth + 1);
    }
    
    return dueDate.toISOString().split('T')[0];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" data-testid="loading-state">
        <div className="space-y-8 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-8 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Premium Header */}
        <PageHeader
          title="Cartões de Crédito"
          subtitle="Gerencie seus cartões e limites"
          action={
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <PremiumButton size="lg" data-testid="button-add-card">
                  <Plus className="w-5 h-5 mr-2" />
                  Adicionar Cartão
                </PremiumButton>
              </DialogTrigger>
              <DialogContent>
                <div className="space-y-4 md:space-y-6">
                  <DialogHeader>
                    <DialogTitle className="text-xl md:text-2xl font-bold tracking-tight">Adicionar Cartão</DialogTitle>
                    <DialogDescription className="text-sm md:text-base">
                      Cadastre um novo cartão de crédito
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
                    <FormField
                      control={form.control}
                      name="nomeCartao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">Nome do Cartão</FormLabel>
                          <FormControl>
                            <PremiumInput placeholder="Ex: Nubank" {...field} data-testid="input-card-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="bandeira"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Bandeira</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || "visa"}>
                              <FormControl>
                                <SelectTrigger className="h-11 md:h-12 rounded-xl border-2" data-testid="select-card-brand">
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
                            <FormLabel className="text-sm font-semibold">Limite Total (R$)</FormLabel>
                            <FormControl>
                              <PremiumInput 
                                type="number" 
                                step="0.01"
                                placeholder="0,00" 
                                className="font-mono"
                                {...field} 
                                data-testid="input-card-limit"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="diaFechamento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Dia Fechamento</FormLabel>
                            <FormControl>
                              <PremiumInput 
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
                            <FormLabel className="text-sm font-semibold">Dia Vencimento</FormLabel>
                            <FormControl>
                              <PremiumInput 
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
                      <PremiumButton 
                        type="button"
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                        className="w-full md:w-auto h-11 md:h-12 px-6"
                      >
                        Cancelar
                      </PremiumButton>
                      <PremiumButton 
                        type="submit" 
                        disabled={createCartaoMutation.isPending}
                        className="w-full md:w-auto h-11 md:h-12 px-6"
                        data-testid="button-submit-card"
                      >
                        {createCartaoMutation.isPending ? "Salvando..." : "Salvar Cartão"}
                      </PremiumButton>
                    </DialogFooter>
                    </form>
                  </Form>
                </div>
              </DialogContent>
            </Dialog>
          }
        />

        {/* Cards List */}
        {cartoes && cartoes.length > 0 ? (
          <div className="space-y-6">
            <SectionTitle
              title="Meus Cartões"
              subtitle={`${cartoes.length} ${cartoes.length === 1 ? 'cartão' : 'cartões'}`}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="list-cartoes">
              {cartoes.map((cartao) => {
                const percentage = calculatePercentage(cartao.limiteUsado, cartao.limiteTotal);
                const used = parseFloat(cartao.limiteUsado);
                const limit = parseFloat(cartao.limiteTotal);
                const dueDate = formatDueDate(cartao.diaVencimento);
                const borderAccent = percentage >= 90 ? "red" : percentage >= 75 ? "red" : "blue";

                return (
                  <AppCard key={cartao.id} className="p-5 md:p-6" borderAccent={borderAccent} hover data-testid={`card-cartao-${cartao.id}`}>
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <CreditCard className="h-7 w-7 text-primary" data-testid={`icon-card-${cartao.id}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base md:text-lg mb-1">{cartao.nomeCartao}</h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Vencimento: {new Date(dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Limite usado</span>
                          <span className="font-semibold">{percentage.toFixed(1)}%</span>
                        </div>
                        <Progress 
                          value={Math.min(percentage, 100)} 
                          className="h-3 rounded-full"
                          indicatorClassName={getProgressColor(percentage)}
                          data-testid={`progress-bar-${cartao.id}`}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">Usado</p>
                          <p className="font-semibold font-mono tabular-nums text-sm">
                            {formatCurrency(cartao.limiteUsado)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground text-xs mb-1">Limite</p>
                          <p className="font-semibold font-mono tabular-nums text-sm">
                            {formatCurrency(cartao.limiteTotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </AppCard>
                );
              })}
            </div>
          </div>
        ) : (
          <AppCard className="p-12 md:p-16">
            <div className="flex flex-col items-center justify-center text-center" data-testid="empty-state-cartoes">
              <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mb-6">
                <CreditCard className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2" data-testid="text-empty-title">
                Nenhum cartão cadastrado
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md" data-testid="text-empty-description">
                Adicione seus cartões para acompanhar limites e faturas
              </p>
              <PremiumButton onClick={() => setDialogOpen(true)} data-testid="button-add-first-card">
                <Plus className="w-5 h-5 mr-2" />
                Adicionar Primeiro Cartão
              </PremiumButton>
            </div>
          </AppCard>
        )}
      </div>
    </div>
  );
}
