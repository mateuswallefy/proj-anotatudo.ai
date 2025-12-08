import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
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
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DashboardContainer } from "@/components/dashboard/DashboardContainer";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Calendar as CalendarIcon, Plus, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { cn } from "@/lib/utils";
import type { Cartao } from "@shared/schema";

const eventoSchema = z.object({
  titulo: z.string().min(1, "Título obrigatório"),
  descricao: z.string().optional(),
  data: z.date(),
  tipo: z.enum(["vencimento", "fechamento", "lembrete"]),
  cartaoId: z.string().optional(),
  valor: z.coerce.number().optional(),
});

type EventoFormData = z.infer<typeof eventoSchema>;

interface Evento {
  id: string;
  titulo: string;
  descricao?: string;
  data: string;
  tipo: "vencimento" | "fechamento" | "lembrete";
  cartaoId?: string;
  valor?: number;
}

export default function Agenda() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Fetch cards for events
  const { data: cartoes } = useQuery<Cartao[]>({
    queryKey: ["/api/cartoes"],
  });

  // Mock eventos - in real app, this would come from API
  const eventos: Evento[] = [];
  
  // Calculate events from cards
  if (cartoes) {
    cartoes.forEach((cartao) => {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();

      // Vencimento
      const vencimento = new Date(year, month, cartao.diaVencimento);
      if (vencimento >= today) {
        eventos.push({
          id: `venc-${cartao.id}`,
          titulo: `Vencimento - ${cartao.nomeCartao}`,
          data: vencimento.toISOString(),
          tipo: "vencimento",
          cartaoId: cartao.id,
        });
      }

      // Fechamento
      const fechamento = new Date(year, month, cartao.diaFechamento);
      if (fechamento >= today) {
        eventos.push({
          id: `fech-${cartao.id}`,
          titulo: `Fechamento - ${cartao.nomeCartao}`,
          data: fechamento.toISOString(),
          tipo: "fechamento",
          cartaoId: cartao.id,
        });
      }
    });
  }

  const form = useForm<EventoFormData>({
    resolver: zodResolver(eventoSchema),
    defaultValues: {
      titulo: "",
      descricao: "",
      data: new Date(),
      tipo: "lembrete",
      cartaoId: undefined,
      valor: undefined,
    },
  });

  const createEventoMutation = useMutation({
    mutationFn: async (data: EventoFormData) => {
      // In a real app, this would save to backend
      // For now, we'll just show success
      return Promise.resolve({ id: Date.now().toString(), ...data });
    },
    onSuccess: () => {
      toast({ title: "Evento criado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/agenda"] });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar evento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getEventsForDate = (date: Date) => {
    return eventos.filter((evento) =>
      isSameDay(new Date(evento.data), date)
    );
  };

  const selectedDateEvents = getEventsForDate(selectedDate);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <DashboardContainer>
      <div className="space-y-6 pb-24">
        <DashboardHeader />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Calendário</h2>
                  <Button
                    size="sm"
                    onClick={() => {
                      form.reset();
                      form.setValue("data", selectedDate);
                      setDialogOpen(true);
                    }}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Novo Evento
                  </Button>
                </div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  className="rounded-lg border-0"
                  modifiers={{
                    hasEvents: (date) => getEventsForDate(date).length > 0,
                  }}
                  modifiersClassNames={{
                    hasEvents: "bg-primary/10 font-bold",
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Events List */}
          <div>
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">
                    {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
                  </h2>
                </div>

                {selectedDateEvents.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDateEvents.map((evento) => (
                      <div
                        key={evento.id}
                        className="p-4 bg-muted/50 rounded-xl border"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm mb-1">
                              {evento.titulo}
                            </h3>
                            {evento.descricao && (
                              <p className="text-xs text-muted-foreground">
                                {evento.descricao}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant={
                              evento.tipo === "vencimento"
                                ? "destructive"
                                : evento.tipo === "fechamento"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {evento.tipo === "vencimento"
                              ? "Vencimento"
                              : evento.tipo === "fechamento"
                              ? "Fechamento"
                              : "Lembrete"}
                          </Badge>
                        </div>
                        {evento.cartaoId && (
                          <div className="flex items-center gap-2 mt-2">
                            <CreditCard className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              {
                                cartoes?.find((c) => c.id === evento.cartaoId)
                                  ?.nomeCartao
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium mb-1">
                      Nenhum evento neste dia
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Clique em "Novo Evento" para adicionar
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        form.reset();
                        form.setValue("data", selectedDate);
                        setDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Evento
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Event Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Novo Evento</DialogTitle>
              <DialogDescription>
                Adicione um evento à sua agenda financeira
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) =>
                  createEventoMutation.mutate(data)
                )}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Vencimento da fatura" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo"
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
                          <SelectItem value="vencimento">Vencimento</SelectItem>
                          <SelectItem value="fechamento">Fechamento</SelectItem>
                          <SelectItem value="lembrete">Lembrete</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={
                            field.value
                              ? format(field.value, "yyyy-MM-dd")
                              : ""
                          }
                          onChange={(e) =>
                            field.onChange(new Date(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {cartoes && cartoes.length > 0 && (
                  <FormField
                    control={form.control}
                    name="cartaoId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cartão (opcional)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Sem cartão</SelectItem>
                            {cartoes.map((card) => (
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

                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição (opcional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Adicione uma descrição..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={createEventoMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createEventoMutation.isPending}
                  >
                    {createEventoMutation.isPending
                      ? "Salvando..."
                      : "Criar Evento"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardContainer>
  );
}

