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
import { Calendar as CalendarIcon, Plus, Clock, CheckCircle2, AlertCircle, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, isSameDay, isToday } from "date-fns";
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
      if (editingEvento) {
        return apiRequest("PATCH", `/api/eventos/${editingEvento.id}`, payload);
      }
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
    createEventoMutation.mutate(data);
  };

  // Generate time picker options
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  return (
    <div className="min-h-screen bg-background">
      <main className="p-4 sm:p-4 md:p-6 lg:p-8 xl:p-10 max-w-[1600px] mx-auto">
        <div className="space-y-4 sm:space-y-6 lg:space-y-8 pb-24">
          {/* Header - Centralizado */}
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
              Minha Agenda
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Organize seus compromissos e eventos
            </p>
          </div>

          {/* Layout: Mobile vertical, Desktop 2 colunas com mais espaço */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8 xl:gap-10">
            {/* Calendar Card - Mobile full width, Desktop 3 colunas */}
            <div className="lg:col-span-3">
              <Card className="rounded-[20px] border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                <CardContent className="p-6 sm:p-8 lg:p-10 xl:p-12">
                  {/* Month Navigation */}
                  <div className="flex items-center justify-center gap-4 mb-6 sm:mb-8">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const prevMonth = new Date(currentMonth);
                        prevMonth.setMonth(prevMonth.getMonth() - 1);
                        setCurrentMonth(prevMonth);
                      }}
                      className="h-10 w-10 lg:h-12 lg:w-12"
                    >
                      <ChevronLeft className="h-5 w-5 lg:h-6 lg:w-6" />
                    </Button>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#005CA9] min-w-[220px] lg:min-w-[280px] text-center">
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
                      className="h-10 w-10 lg:h-12 lg:w-12"
                    >
                      <ChevronRight className="h-5 w-5 lg:h-6 lg:w-6" />
                    </Button>
                  </div>

                  {/* Calendar - Centralizado */}
                  <div className="flex justify-center items-center w-full [&_.rdp-day_today:not(.rdp-day_selected)]:bg-transparent [&_.rdp-day_today:not(.rdp-day_selected)]:text-foreground [&_.rdp-cell]:[&:has([aria-selected])]:!bg-transparent [&_.rdp-cell]:[&:has([aria-selected])]:!shadow-none">
                    <style>{`
                      /* Remove completamente qualquer fundo accent do cell quando há seleção */
                      .rdp-cell:has([aria-selected]),
                      .rdp-cell:has(.rdp-day_selected),
                      .rdp-cell[class*="has-selected"] {
                        background-color: transparent !important;
                        background: transparent !important;
                        box-shadow: none !important;
                      }
                      /* Garante que apenas o day em si tenha o fundo azul */
                      .rdp-day_selected {
                        background-color: #005CA9 !important;
                        color: white !important;
                        border-radius: 9999px !important;
                      }
                    `}</style>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      month={currentMonth}
                      onMonthChange={setCurrentMonth}
                      className="rounded-lg mx-auto"
                      classNames={{
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 justify-center",
                        month: "space-y-4 lg:space-y-6",
                        caption: "flex justify-center pt-1 relative items-center",
                        caption_label: "text-sm sm:text-base lg:text-lg font-medium",
                        nav: "space-x-1 flex items-center",
                        nav_button: "h-7 w-7 lg:h-10 lg:w-10 bg-transparent p-0 opacity-50 hover:opacity-100",
                        nav_button_previous: "absolute left-1",
                        nav_button_next: "absolute right-1",
                        table: "w-full border-collapse space-y-1 mx-auto",
                        head_row: "flex justify-center",
                        head_cell: "text-muted-foreground rounded-md w-9 lg:w-12 xl:w-14 font-normal text-[0.8rem] lg:text-sm",
                        row: "flex w-full mt-2 justify-center",
                        cell: "h-9 w-9 lg:h-12 lg:w-12 xl:h-14 xl:w-14 text-center text-sm lg:text-base p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:!bg-transparent [&:has([aria-selected])]:!bg-transparent [&:has([aria-selected])]:!shadow-none first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: "h-9 w-9 lg:h-12 lg:w-12 xl:h-14 xl:w-14 p-0 font-normal aria-selected:opacity-100 text-sm lg:text-base",
                        day_range_end: "day-range-end",
                        day_selected: "!bg-[#005CA9] !text-white hover:!bg-[#003F73] focus:!bg-[#005CA9] rounded-full", // Azul circular como no concorrente
                        day_today: "", // Removido completamente - será sobrescrito pelo modificador
                        day_outside: "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
                        day_disabled: "text-muted-foreground opacity-50",
                        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                        day_hidden: "invisible",
                      }}
                      modifiers={{
                        hasEvents: (date) => getEventsForDate(date).length > 0,
                        today: (date) => isToday(date),
                        selectedWithEvents: (date) => {
                          // Verifica se o dia está selecionado E tem eventos
                          const isSelected = selectedDate && 
                            format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
                          return isSelected && getEventsForDate(date).length > 0;
                        },
                      }}
                      modifiersClassNames={{
                        hasEvents: "relative after:content-[''] after:absolute after:bottom-1 lg:after:bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-2 after:h-2 lg:after:w-2.5 lg:after:h-2.5 after:rounded-full after:bg-[#F39200]",
                        selectedWithEvents: "relative after:content-[''] after:absolute after:bottom-1 lg:after:bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-2 after:h-2 lg:after:w-2.5 lg:after:h-2.5 after:rounded-full after:!bg-white", // Branco quando selecionado e tem eventos
                        today: "!bg-[#005CA9] !text-white !font-bold rounded-full", // Força o azul com !important
                      }}
                    />
                  </div>

                  {/* Legend - Centralizada */}
                  <div className="flex items-center justify-center gap-6 sm:gap-8 mt-6 sm:mt-8 text-sm sm:text-base text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#005CA9]"></div>
                      <span>Hoje</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                      <span>Com eventos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#F39200]"></div>
                      <span>Eventos</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Events List Card - Mobile full width, Desktop 2 colunas */}
            <div className="lg:col-span-2">
              <Card className="rounded-[20px] border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.05)] h-full">
                <CardContent className="p-6 sm:p-8 lg:p-10 xl:p-12">
                  <div className="flex items-center gap-3 mb-6 sm:mb-8">
                    <CalendarIcon className="h-6 w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 text-[#005CA9]" />
                    <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold">
                      {format(selectedDate, "dd/MM", { locale: ptBR })}
                    </h2>
                    {selectedDateEvents.length > 0 && (
                      <Badge variant="secondary" className="ml-2 text-sm lg:text-base xl:text-lg px-3 py-1.5">
                        {selectedDateEvents.length}
                      </Badge>
                    )}
                  </div>

                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-xl" />
                      ))}
                    </div>
                  ) : selectedDateEvents.length > 0 ? (
                    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
                      {selectedDateEvents.map((evento) => (
                        <div
                          key={evento.id}
                          className="p-5 sm:p-6 lg:p-7 xl:p-8 bg-[#F39200]/10 rounded-xl border border-[#F39200]/20 hover:bg-[#F39200]/15 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4 sm:gap-5">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base sm:text-lg lg:text-xl xl:text-2xl mb-3 lg:mb-4 truncate">
                                {evento.titulo}
                              </h3>
                              {evento.hora && (
                                <div className="flex items-center gap-2.5 text-sm sm:text-base lg:text-lg text-muted-foreground mb-3 lg:mb-4">
                                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 flex-shrink-0" />
                                  <span className="font-medium">{evento.hora}</span>
                                </div>
                              )}
                              {evento.lembreteMinutos && (
                                <Badge
                                  variant="outline"
                                  className="text-xs sm:text-sm lg:text-base bg-[#F39200]/20 border-[#F39200]/40 text-[#F39200] mb-3 lg:mb-4 px-3 py-1.5"
                                >
                                  Lembretes: {getLembreteLabel(evento.lembreteMinutos)}
                                </Badge>
                              )}
                              {evento.descricao && (
                                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-3 lg:mt-4 line-clamp-3">
                                  {evento.descricao}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-center gap-2 sm:gap-3 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12 xl:h-14 xl:w-14 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => {
                                  toast({
                                    title: "Evento concluído!",
                                    description: "Funcionalidade em desenvolvimento.",
                                  });
                                }}
                              >
                                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12 xl:h-14 xl:w-14 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                onClick={() => handleEdit(evento)}
                              >
                                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12 xl:h-14 xl:w-14 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDelete(evento)}
                              >
                                <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 sm:py-16 lg:py-20">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <CalendarIcon className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-muted-foreground" />
                      </div>
                      <p className="text-base sm:text-lg lg:text-xl font-medium mb-2">Nenhum evento</p>
                      <p className="text-sm sm:text-base text-muted-foreground mb-6">
                        Adicione um evento para esta data
                      </p>
                      <Button
                        size="default"
                        onClick={() => {
                          form.reset();
                          form.setValue("data", selectedDate);
                          setEditingEvento(null);
                          setDialogOpen(true);
                        }}
                        className="bg-[#005CA9] hover:bg-[#003F73] text-white h-11 px-6"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Criar Evento
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* FAB Button - Mobile only */}
          <div className="fixed bottom-6 right-6 z-50 lg:hidden">
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
            <DialogContent className="sm:max-w-[500px] rounded-2xl max-h-[90vh] overflow-y-auto">
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
                                  "rounded-xl text-xs sm:text-sm",
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
      </main>
    </div>
  );
}
