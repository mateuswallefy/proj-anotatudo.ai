import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DashboardContainer } from "@/components/dashboard/DashboardContainer";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Search, Plus, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { categorias } from "@shared/schema";
import { insertCategoriaCustomizadaSchema } from "@shared/schema";
import { cn } from "@/lib/utils";

const categoriaSchema = insertCategoriaCustomizadaSchema.omit({
  userId: true,
});

type CategoriaFormData = z.infer<typeof categoriaSchema>;

export default function Categorias() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<
    "todas" | "despesas" | "receitas" | "investimentos"
  >("todas");

  const { data: customCategories, isLoading } = useQuery({
    queryKey: ["/api/categorias-customizadas"],
    queryFn: async () => {
      const response = await fetch("/api/categorias-customizadas", {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
  });

  const form = useForm<CategoriaFormData>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nome: "",
      emoji: "💰",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CategoriaFormData) => {
      return await apiRequest("POST", "/api/categorias-customizadas", data);
    },
    onSuccess: () => {
      toast({ title: "Categoria criada com sucesso!" });
      queryClient.invalidateQueries({
        queryKey: ["/api/categorias-customizadas"],
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar categoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/categorias-customizadas/${id}`, {});
    },
    onSuccess: () => {
      toast({ title: "Categoria excluída!" });
      queryClient.invalidateQueries({
        queryKey: ["/api/categorias-customizadas"],
      });
    },
  });

  const allCategories = [
    ...categorias.map((cat) => ({ nome: cat, emoji: "📁", id: cat, isDefault: true })),
    ...(customCategories || []).map((cat: any) => ({ ...cat, isDefault: false })),
  ];

  const filteredCategories = allCategories.filter((cat) => {
    const matchesSearch = cat.nome
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const categoryColors = [
    "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
    "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
    "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300",
    "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
    "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300",
  ];

  return (
    <DashboardContainer>
      <div className="space-y-6 pb-24">
        <div className="flex items-center justify-between">
          <DashboardHeader />
          <Button
            onClick={() => {
              form.reset();
              setDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Categoria
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filter === "todas" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("todas")}
            >
              Todas
            </Button>
            <Button
              variant={filter === "despesas" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("despesas")}
            >
              Despesas
            </Button>
            <Button
              variant={filter === "receitas" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("receitas")}
            >
              Receitas
            </Button>
            <Button
              variant={filter === "investimentos" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("investimentos")}
            >
              Investimentos
            </Button>
          </div>
        </div>

        {/* Categories Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : filteredCategories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredCategories.map((categoria, index) => {
              const colorClass =
                categoryColors[index % categoryColors.length];

              return (
                <Card
                  key={categoria.id}
                  className="rounded-xl hover:shadow-md transition-shadow cursor-pointer"
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center mb-3",
                          colorClass
                        )}
                      >
                        <span className="text-2xl">{categoria.emoji}</span>
                      </div>
                      <p className="font-medium text-sm">{categoria.nome}</p>
                      {!categoria.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-6 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMutation.mutate(categoria.id);
                          }}
                        >
                          Excluir
                        </Button>
                      )}
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
                <Tag className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Nenhuma categoria encontrada
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {searchTerm
                  ? "Tente buscar com outro termo"
                  : "Crie uma categoria personalizada"}
              </p>
              <Button
                onClick={() => {
                  form.reset();
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Categoria
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Nova Categoria</DialogTitle>
              <DialogDescription>
                Crie uma categoria personalizada
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) =>
                  createMutation.mutate(data)
                )}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Viagem" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emoji"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emoji</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="💰"
                          maxLength={2}
                          {...field}
                        />
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
                    disabled={createMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Criando..." : "Criar"}
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

