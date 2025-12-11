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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DashboardContainer } from "@/components/dashboard/DashboardContainer";
import { Calendar as CalendarIcon, Plus, Clock, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, parse } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const eventoSchema = z.object({
  titulo: z.string().min(1, "Título obrigatório"),
  descricao: z.string().optional(),
  data: z.date(),
  hora: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Formato inválido (HH:mm)").optional(),
  lembreteMinutos: z.enum(["30", "60", "1440"]).optional(),
});

type EventoFormData = z.infer<typeof eventoSchema>;

interface Evento {
  id: string;
  titulo: string;
  descricao?: string;
  data: string;
  hora?: string;
  lembreteMinutos?: number;
  origem: "manual" | "whatsapp";
  notificado: boolean;
}

export default function Agenda() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
  const [deletingEvento, setDeletingEvento] = useState<Evento | null>(null);
  const [timePickerOpen, setTimePickerOpen] = useState(false);

  // Fetch eventos
  const { data: eventos = [], isLoading } = useQuery<Evento[]>({
    queryKey: ["/api/eventos"],
    queryFn: async () => {
      const response = await fetch("/api/eventos", {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
  });

  const form = useForm<EventoFormData>({
    resolver: zodResolver(eventoSchema),
    defaultValues: {
      titulo: "",
      descricao: "",
      data: new Date(),
      hora: undefined,
      lembreteMinutos: undefined,
    },
  });

  const createEventoMutation = useMutation({
    mutationFn: async (data: EventoFormData) => {
      const payload = {
        ...data,
        data: format(data.data, "yyyy-MM-dd"),
      };
      return apiRequest("POST", "/api/eventos", payload);
    },
    onSuccess: () => {
      toast({
        title: "Evento criado com sucesso!",
        description: editingEvento
          ? "O evento foi atualizado."
          : `Evento criado para ${format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}${form.watch("hora") ? ` às ${form.watch("hora")}` : ""}${form.watch("lembreteMinutos") ? ` (com ${getLembreteLabel(form.watch("lembreteMinutos")!)} lembrete)` : ""}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/eventos"] });
      setDialogOpen(false);
      setEditingEvento(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar evento",
        description: error.message || "Não foi possível criar o evento.",
        variant: "destructive",
      });
    },
  });

  const deleteEventoMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/eventos/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Evento excluído!",
        description: "O evento foi removido com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/eventos"] });
      setDeletingEvento(null);
    },
    onError: () => {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o evento.",
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

  const getLembreteLabel = (minutos: string | number) => {
    const m = typeof minutos === "string" ? parseInt(minutos) : minutos;
    if (m === 30) return "30 minutos antes";
    if (m === 60) return "1 hora antes";
    if (m === 1440) return "1 dia antes";
    return "";
  };

  const handleEdit = (evento: Evento) => {
    setEditingEvento(evento);
    form.reset({
      titulo: evento.titulo,
      descricao: evento.descricao || "",
      data: new Date(evento.data),
      hora: evento.hora || undefined,
      lembreteMinutos: evento.lembreteMinutos?.toString() as "30" | "60" | "1440" | undefined,
    });
    setDialogOpen(true);
  };

  const handleDelete = (evento: Evento) => {
    setDeletingEvento(evento);
  };

  const onSubmit = (data: EventoFormData) => {
    if (editingEvento) {
      // Update mutation would go here
      createEventoMutation.mutate(data);
    } else {
      createEventoMutation.mutate(data);
    }
  };

  // Generate time picker options
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  return (
    <DashboardContainer>
      <div className="space-y-6 pb-24">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Minha Agenda
          </h1>
          <p className="text-sm text-muted-foreground">
            Organize seus compromissos e eventos
          </p>
        </div>

        {/* Calendar Card */}
        <Card className="rounded-[20px] border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const prevMonth = new Date(currentMonth);
                    prevMonth.setMonth(prevMonth.getMonth() - 1);
                    setCurrentMonth(prevMonth);
                  }}
                  className="h-8 w-8"
                >
                  ←
                </Button>
                <h2 className="text-lg font-bold text-[#005CA9]">
                  {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const nextMonth = new Date(currentMonth);
                    nextMonth.setMonth(nextMonth.getMonth() + 1);
                    setCurrentMonth(nextMonth);
                  }}
                  className="h-8 w-8"
                >
                  →
                </Button>
              </div>
            </div>

            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="rounded-lg"
              modifiers={{
                hasEvents: (date) => getEventsForDate(date).length > 0,
                today: (date) => isToday(date),
              }}
              modifiersClassNames={{
                hasEvents: "relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-[#005CA9]",
                today: "bg-[#005CA9] text-white font-bold rounded-full",
              }}
            />

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#005CA9]"></div>
                <span>Hoje</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                <span>Com eventos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#F39200]"></div>
                <span>Eventos</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events List Card */}
        <Card className="rounded-[20px] border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-[#005CA9]" />
                <h2 className="text-lg font-semibold">
                  {format(selectedDate, "dd/MM", { locale: ptBR })}
                </h2>
                {selectedDateEvents.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedDateEvents.length}
                  </Badge>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : selectedDateEvents.length > 0 ? (
              <div className="space-y-3">
                {selectedDateEvents.map((evento) => (
                  <div
                    key={evento.id}
                    className="p-4 bg-[#F39200]/10 rounded-xl border border-[#F39200]/20"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-2">
                          {evento.titulo}
                        </h3>
                        {evento.hora && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Clock className="h-4 w-4" />
                            <span>{evento.hora}</span>
                          </div>
                        )}
                        {evento.lembreteMinutos && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-[#F39200]/20 border-[#F39200]/40 text-[#F39200]"
                          >
                            {getLembreteLabel(evento.lembreteMinutos)}
                          </Badge>
                        )}
                        {evento.descricao && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {evento.descricao}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => {
                            // Mark as completed - implementar depois
                            toast({
                              title: "Evento concluído!",
                              description: "Funcionalidade em desenvolvimento.",
                            });
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          onClick={() => handleEdit(evento)}
                        >
                          <AlertCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(evento)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium mb-1">Nenhum evento</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Adicione um evento para esta data
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    form.reset();
                    form.setValue("data", selectedDate);
                    setEditingEvento(null);
                    setDialogOpen(true);
                  }}
                  className="bg-[#005CA9] hover:bg-[#003F73] text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Evento
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* FAB Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            onClick={() => {
              form.reset();
              form.setValue("data", selectedDate);
              setEditingEvento(null);
              setDialogOpen(true);
            }}
            className="rounded-full h-14 w-14 bg-[#005CA9] hover:bg-[#003F73] text-white shadow-lg"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>

        {/* Event Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingEvento ? "Editar Evento" : "Novo Evento"}
              </DialogTitle>
              <DialogDescription>
                {editingEvento
                  ? "Edite os detalhes do evento"
                  : "Adicione um evento à sua agenda"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Digite o título do evento"
                          {...field}
                          className="rounded-xl"
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
                          placeholder="Adicione detalhes sobre o evento"
                          {...field}
                          className="rounded-xl"
                        />
                      </FormControl>
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
                          className="rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hora"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora</FormLabel>
                      <FormControl>
                        <Popover open={timePickerOpen} onOpenChange={setTimePickerOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal rounded-xl",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              {field.value || "--:--"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <div className="flex">
                              <div className="max-h-[200px] overflow-y-auto p-2">
                                {hours.map((hour) => (
                                  <div
                                    key={hour}
                                    className={cn(
                                      "px-3 py-1 cursor-pointer hover:bg-muted rounded",
                                      field.value?.startsWith(hour) && "bg-primary text-primary-foreground"
                                    )}
                                    onClick={() => {
                                      const currentMin = field.value?.split(":")[1] || "00";
                                      field.onChange(`${hour}:${currentMin}`);
                                    }}
                                  >
                                    {hour}
                                  </div>
                                ))}
                              </div>
                              <div className="max-h-[200px] overflow-y-auto p-2 border-l">
                                {minutes.map((minute) => (
                                  <div
                                    key={minute}
                                    className={cn(
                                      "px-3 py-1 cursor-pointer hover:bg-muted rounded",
                                      field.value?.endsWith(`:${minute}`) && "bg-primary text-primary-foreground"
                                    )}
                                    onClick={() => {
                                      const currentHour = field.value?.split(":")[0] || "00";
                                      field.onChange(`${currentHour}:${minute}`);
                                      setTimePickerOpen(false);
                                    }}
                                  >
                                    {minute}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="p-2 border-t">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                  field.onChange(undefined);
                                  setTimePickerOpen(false);
                                }}
                              >
                                Limpar
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lembreteMinutos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lembretes</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { value: "30", label: "30 minutos antes" },
                            { value: "60", label: "1 hora antes" },
                            { value: "1440", label: "1 dia antes" },
                          ].map((option) => (
                            <Button
                              key={option.value}
                              type="button"
                              variant={
                                field.value === option.value
                                  ? "default"
                                  : "outline"
                              }
                              className={cn(
                                "rounded-xl",
                                field.value === option.value &&
                                  "bg-[#F39200] hover:bg-[#D87E00] text-white border-[#F39200]"
                              )}
                              onClick={() => {
                                if (field.value === option.value) {
                                  field.onChange(undefined);
                                } else {
                                  field.onChange(option.value as "30" | "60" | "1440");
                                }
                              }}
                            >
                              {option.label}
                            </Button>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      setEditingEvento(null);
                      form.reset();
                    }}
                    disabled={createEventoMutation.isPending}
                    className="w-full sm:w-auto rounded-xl"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createEventoMutation.isPending}
                    className="w-full sm:w-auto bg-[#005CA9] hover:bg-[#003F73] text-white rounded-xl"
                  >
                    {createEventoMutation.isPending
                      ? "Salvando..."
                      : editingEvento
                      ? "Salvar Alterações"
                      : "Salvar Evento"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!deletingEvento}
          onOpenChange={(open) => !open && setDeletingEvento(null)}
        >
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o evento "{deletingEvento?.titulo}"? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletingEvento && deleteEventoMutation.mutate(deletingEvento.id)}
                disabled={deleteEventoMutation.isPending}
                className="bg-red-600 hover:bg-red-700 rounded-xl"
              >
                {deleteEventoMutation.isPending ? "Excluindo..." : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardContainer>
  );
}
