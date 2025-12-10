import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DashboardContainer } from "@/components/dashboard/DashboardContainer";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Wallet, CreditCard, Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Conta, Cartao } from "@shared/schema";
import { insertContaSchema, insertCartaoSchema } from "@shared/schema";
import { NovaContaDialog } from "@/components/contas/NovaContaDialog";
import { NovoCartaoDialog } from "@/components/contas/NovoCartaoDialog";

const contaSchema = insertContaSchema.extend({
  saldoInicial: z.coerce.number().optional().default(0),
});

const cartaoSchema = insertCartaoSchema;

type ContaFormData = z.infer<typeof contaSchema>;
type CartaoFormData = z.infer<typeof cartaoSchema>;

export default function ContasCartoes() {
  const { toast } = useToast();
  const [contaDialogOpen, setContaDialogOpen] = useState(false);
  const [cartaoDialogOpen, setCartaoDialogOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<Conta | null>(null);
  const [editingCartao, setEditingCartao] = useState<Cartao | null>(null);
  const [openConta, setOpenConta] = useState(false);
  const [openCartao, setOpenCartao] = useState(false);

  const { data: contas, isLoading: loadingContas } = useQuery<Conta[]>({
    queryKey: ["/api/contas"],
    queryFn: async () => {
      const response = await fetch("/api/contas", { credentials: "include" });
      if (!response.ok) return [];
      return response.json();
    },
  });

  const { data: cartoes, isLoading: loadingCartoes } = useQuery<Cartao[]>({
    queryKey: ["/api/cartoes"],
    queryFn: async () => {
      const response = await fetch("/api/cartoes", { credentials: "include" });
      if (!response.ok) return [];
      return response.json();
    },
  });

  const contaForm = useForm<ContaFormData>({
    resolver: zodResolver(contaSchema),
    defaultValues: {
      nomeConta: "",
      tipoConta: "corrente",
      saldoAtual: "0",
      banco: "",
      corIdentificacao: "#10B981",
    },
  });

  const cartaoForm = useForm<CartaoFormData>({
    resolver: zodResolver(cartaoSchema),
    defaultValues: {
      nomeCartao: "",
      limiteTotal: "0",
      diaFechamento: 1,
      diaVencimento: 10,
      bandeira: "visa",
      userId: "",
    },
  });

  const createContaMutation = useMutation({
    mutationFn: async (data: ContaFormData) => {
      const payload = {
        ...data,
        saldoAtual: (data.saldoInicial || 0).toString(),
      };
      delete (payload as any).saldoInicial;
      return await apiRequest("POST", "/api/contas", payload);
    },
    onSuccess: () => {
      toast({ title: "Conta criada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/contas"] });
      setContaDialogOpen(false);
      contaForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createCartaoMutation = useMutation({
    mutationFn: async (data: CartaoFormData) => {
      return await apiRequest("POST", "/api/cartoes", data);
    },
    onSuccess: () => {
      toast({ title: "Cartão criado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/cartoes"] });
      setCartaoDialogOpen(false);
      cartaoForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar cartão",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteContaMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/contas/${id}`, {});
    },
    onSuccess: () => {
      toast({ title: "Conta excluída!" });
      queryClient.invalidateQueries({ queryKey: ["/api/contas"] });
    },
  });

  const deleteCartaoMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/cartoes/${id}`, {});
    },
    onSuccess: () => {
      toast({ title: "Cartão excluído!" });
      queryClient.invalidateQueries({ queryKey: ["/api/cartoes"] });
    },
  });

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(typeof value === "string" ? parseFloat(value) : value);
  };

  const getTipoContaLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      corrente: "Conta Corrente",
      poupanca: "Poupança",
      investimento: "Investimento",
    };
    return labels[tipo] || tipo;
  };

  return (
    <DashboardContainer>
      <div className="space-y-6 pb-24">
        <DashboardHeader />

        <Tabs defaultValue="contas" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="contas">Contas</TabsTrigger>
              <TabsTrigger value="cartoes">Cartões</TabsTrigger>
            </TabsList>
          </div>

          {/* Contas Tab */}
          <TabsContent value="contas" className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => setOpenConta(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Nova Conta
              </Button>
            </div>

            {loadingContas ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 rounded-2xl" />
                ))}
              </div>
            ) : contas && contas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contas.map((conta) => (
                  <Card
                    key={conta.id}
                    className="rounded-2xl border-2 hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: conta.corIdentificacao || "#10B981" }}
                        >
                          <Wallet className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingConta(conta);
                              contaForm.reset({
                                nomeConta: conta.nomeConta,
                                tipoConta: conta.tipoConta as any,
                                saldoAtual: conta.saldoAtual,
                                banco: conta.banco || "",
                                corIdentificacao: conta.corIdentificacao || "#10B981",
                                saldoInicial: parseFloat(conta.saldoAtual),
                              });
                              setContaDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteContaMutation.mutate(conta.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <h3 className="font-semibold text-lg mb-1">
                        {conta.nomeConta}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {getTipoContaLabel(conta.tipoConta || "corrente")}
                        {conta.banco && ` • ${conta.banco}`}
                      </p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(conta.saldoAtual)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="rounded-2xl">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Wallet className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Nenhuma conta cadastrada
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Adicione uma conta para começar
                  </p>
                  <Button
                    onClick={() => setOpenConta(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Conta
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Cartões Tab */}
          <TabsContent value="cartoes" className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => setOpenCartao(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Novo Cartão
              </Button>
            </div>

            {loadingCartoes ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-40 rounded-2xl" />
                ))}
              </div>
            ) : cartoes && cartoes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cartoes.map((cartao) => {
                  const percent = parseFloat(cartao.limiteUsado || "0") / parseFloat(cartao.limiteTotal) * 100;
                  const statusColor = percent >= 70 ? "text-red-600" : percent >= 50 ? "text-orange-600" : "text-emerald-600";

                  return (
                    <Card
                      key={cartao.id}
                      className="rounded-2xl border-2 hover:shadow-lg transition-shadow"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                            <CreditCard className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingCartao(cartao);
                                cartaoForm.reset({
                                  nomeCartao: cartao.nomeCartao,
                                  limiteTotal: cartao.limiteTotal,
                                  diaFechamento: cartao.diaFechamento,
                                  diaVencimento: cartao.diaVencimento,
                                  bandeira: cartao.bandeira || "visa",
                                  userId: "",
                                });
                                setCartaoDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteCartaoMutation.mutate(cartao.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <h3 className="font-semibold text-lg mb-1">
                          {cartao.nomeCartao}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Fecha dia {cartao.diaFechamento} • Vence dia {cartao.diaVencimento}
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Usado</span>
                            <span className={statusColor}>{percent.toFixed(0)}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                percent >= 70
                                  ? "bg-red-500"
                                  : percent >= 50
                                  ? "bg-orange-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(percent, 100)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {formatCurrency(cartao.limiteUsado || "0")}
                            </span>
                            <span className="font-semibold">
                              {formatCurrency(cartao.limiteTotal)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="rounded-2xl">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Nenhum cartão cadastrado
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Adicione um cartão para começar
                  </p>
                  <Button
                    onClick={() => setOpenCartao(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Cartão
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Conta Dialog */}
        <Dialog open={contaDialogOpen} onOpenChange={setContaDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingConta ? "Editar Conta" : "Nova Conta"}
              </DialogTitle>
              <DialogDescription>
                {editingConta
                  ? "Atualize os dados da conta"
                  : "Adicione uma nova conta bancária"}
              </DialogDescription>
            </DialogHeader>
            <Form {...contaForm}>
              <form
                onSubmit={contaForm.handleSubmit((data) =>
                  createContaMutation.mutate(data)
                )}
                className="space-y-4"
              >
                <FormField
                  control={contaForm.control}
                  name="nomeConta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Conta</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Nubank" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={contaForm.control}
                    name="tipoConta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="corrente">Corrente</SelectItem>
                            <SelectItem value="poupanca">Poupança</SelectItem>
                            <SelectItem value="investimento">
                              Investimento
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={contaForm.control}
                    name="saldoInicial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Saldo Inicial</FormLabel>
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
                </div>

                <FormField
                  control={contaForm.control}
                  name="banco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Banco (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Nubank" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={contaForm.control}
                  name="corIdentificacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor</FormLabel>
                      <FormControl>
                        <Input type="color" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setContaDialogOpen(false)}
                    disabled={createContaMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createContaMutation.isPending}>
                    {createContaMutation.isPending
                      ? "Salvando..."
                      : editingConta
                      ? "Atualizar"
                      : "Criar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Cartão Dialog */}
        <Dialog open={cartaoDialogOpen} onOpenChange={setCartaoDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingCartao ? "Editar Cartão" : "Novo Cartão"}
              </DialogTitle>
              <DialogDescription>
                {editingCartao
                  ? "Atualize os dados do cartão"
                  : "Adicione um novo cartão de crédito"}
              </DialogDescription>
            </DialogHeader>
            <Form {...cartaoForm}>
              <form
                onSubmit={cartaoForm.handleSubmit((data) =>
                  createCartaoMutation.mutate(data)
                )}
                className="space-y-4"
              >
                <FormField
                  control={cartaoForm.control}
                  name="nomeCartao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Cartão</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Nubank Visa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={cartaoForm.control}
                  name="limiteTotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limite Total</FormLabel>
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={cartaoForm.control}
                    name="diaFechamento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dia de Fechamento</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="31"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={cartaoForm.control}
                    name="diaVencimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dia de Vencimento</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="31"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={cartaoForm.control}
                  name="bandeira"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bandeira</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="visa">Visa</SelectItem>
                          <SelectItem value="mastercard">Mastercard</SelectItem>
                          <SelectItem value="elo">Elo</SelectItem>
                          <SelectItem value="american-express">
                            American Express
                          </SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCartaoDialogOpen(false)}
                    disabled={createCartaoMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createCartaoMutation.isPending}
                  >
                    {createCartaoMutation.isPending
                      ? "Salvando..."
                      : editingCartao
                      ? "Atualizar"
                      : "Criar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Novos diálogos usando AppDialog */}
        <NovaContaDialog open={openConta} onOpenChange={setOpenConta} />
        <NovoCartaoDialog open={openCartao} onOpenChange={setOpenCartao} />
      </div>
    </DashboardContainer>
  );
}

