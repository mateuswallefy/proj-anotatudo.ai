import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertTransacaoSchema, type Transacao, categorias } from "@shared/schema";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
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

interface EditTransactionDialogProps {
  transaction: Transacao;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTransactionDialog({
  transaction,
  open,
  onOpenChange,
}: EditTransactionDialogProps) {
  const { toast } = useToast();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const form = useForm({
    resolver: zodResolver(insertTransacaoSchema.partial()),
    defaultValues: {
      tipo: transaction.tipo,
      categoria: transaction.categoria,
      valor: transaction.valor,
      dataReal: transaction.dataReal.split('T')[0],
      descricao: transaction.descricao || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Transacao>) => {
      await apiRequest("PATCH", `/api/transacoes/${transaction.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transacoes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/insights"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/period-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/monthly-comparison"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/expenses-by-category"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/income-by-category"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/yearly-evolution"] });
      toast({
        title: "Transação atualizada!",
        description: "As alterações foram salvas com sucesso.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/transacoes/${transaction.id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transacoes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/insights"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/period-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/monthly-comparison"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/expenses-by-category"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/income-by-category"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/yearly-evolution"] });
      toast({
        title: "Transação excluída!",
        description: "A transação foi removida com sucesso.",
      });
      onOpenChange(false);
      setShowDeleteAlert(false);
    },
    onError: () => {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a transação.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
            <DialogDescription>
              Faça as alterações necessárias e clique em salvar
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="entrada" id="edit-entrada" />
                          <Label htmlFor="edit-entrada">Entrada</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="saida" id="edit-saida" />
                          <Label htmlFor="edit-saida">Saída</Label>
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
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categorias.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
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
                        data-testid="input-edit-valor"
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
                      <Input type="date" {...field} data-testid="input-edit-date" />
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
                        placeholder="Adicione detalhes..."
                        {...field}
                        data-testid="input-edit-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteAlert(true)}
                  disabled={updateMutation.isPending || deleteMutation.isPending}
                  data-testid="button-delete-transaction"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
                <div className="flex-1" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={updateMutation.isPending || deleteMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending || deleteMutation.isPending}
                  data-testid="button-save-transaction"
                >
                  {updateMutation.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
