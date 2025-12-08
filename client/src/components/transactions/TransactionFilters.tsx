import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { usePeriod } from "@/contexts/PeriodContext";
import { categorias } from "@shared/schema";
import type { TransactionFilters as FilterType } from "@/types/financial";
import { useQuery } from "@tanstack/react-query";
import type { Cartao } from "@shared/schema";
import type { Goal } from "@/types/financial";

interface TransactionFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
}

export function TransactionFilters({
  filters,
  onFiltersChange,
}: TransactionFiltersProps) {
  const { period } = usePeriod();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Fetch cards for filter
  const { data: cards } = useQuery<Cartao[]>({
    queryKey: ["/api/cartoes"],
  });

  // Fetch goals for filter
  const { data: goals } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
    select: (data: any) =>
      (data || [])
        .filter((g: any) => g.status === "ativa")
        .map((g: any) => ({
          id: g.id,
          name: g.nome,
        })),
  });

  const activeFiltersCount = [
    filters.type,
    filters.category,
    filters.accountId,
    filters.goalId,
    filters.search,
    filters.minAmount,
    filters.maxAmount,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onFiltersChange({
      period,
      type: undefined,
      category: undefined,
      accountId: undefined,
      goalId: undefined,
      search: undefined,
      minAmount: undefined,
      maxAmount: undefined,
    });
  };

  return (
    <div className="space-y-4">
      {/* Mobile: Search bar + Filter button */}
      <div className="flex gap-2 lg:hidden">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar transações..."
            value={filters.search || ""}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value || undefined })
            }
            className="pl-9"
          />
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Filter className="h-4 w-4" />
              {activeFiltersCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
              <SheetDescription>
                Filtre suas transações por diferentes critérios
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <FilterContent
                filters={filters}
                onFiltersChange={onFiltersChange}
                cards={cards}
                goals={goals}
              />
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={clearFilters} className="flex-1">
                  Limpar filtros
                </Button>
                <Button onClick={() => setSheetOpen(false)} className="flex-1">
                  Aplicar
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: All filters visible */}
      <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={filters.search || ""}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value || undefined })
            }
            className="pl-9"
          />
        </div>

        <Select
          value={filters.type || "all"}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              type: value === "all" ? undefined : (value as any),
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="entrada">Entrada</SelectItem>
            <SelectItem value="saida">Despesa</SelectItem>
            <SelectItem value="economia">Economia</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.category || "all"}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              category: value === "all" ? undefined : value,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categorias.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Select
            value={filters.accountId || "all"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                accountId: value === "all" ? undefined : value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Conta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as contas</SelectItem>
              {cards?.map((card) => (
                <SelectItem key={card.id} value={card.id}>
                  {card.nomeCartao}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFilters}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Active filters badges */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.type && (
            <Badge variant="secondary" className="gap-1">
              Tipo: {filters.type}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  onFiltersChange({ ...filters, type: undefined })
                }
              />
            </Badge>
          )}
          {filters.category && (
            <Badge variant="secondary" className="gap-1">
              {filters.category}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  onFiltersChange({ ...filters, category: undefined })
                }
              />
            </Badge>
          )}
          {filters.accountId && (
            <Badge variant="secondary" className="gap-1">
              {cards?.find((c) => c.id === filters.accountId)?.nomeCartao}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  onFiltersChange({ ...filters, accountId: undefined })
                }
              />
            </Badge>
          )}
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Busca: {filters.search}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  onFiltersChange({ ...filters, search: undefined })
                }
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

function FilterContent({
  filters,
  onFiltersChange,
  cards,
  goals,
}: {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
  cards?: Cartao[];
  goals?: Goal[];
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Tipo</label>
        <Select
          value={filters.type || "all"}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              type: value === "all" ? undefined : (value as any),
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="entrada">Entrada</SelectItem>
            <SelectItem value="saida">Despesa</SelectItem>
            <SelectItem value="economia">Economia</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Categoria</label>
        <Select
          value={filters.category || "all"}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              category: value === "all" ? undefined : value,
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categorias.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {cards && cards.length > 0 && (
        <div>
          <label className="text-sm font-medium mb-2 block">Conta</label>
          <Select
            value={filters.accountId || "all"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                accountId: value === "all" ? undefined : value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {cards.map((card) => (
                <SelectItem key={card.id} value={card.id}>
                  {card.nomeCartao}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {goals && goals.length > 0 && (
        <div>
          <label className="text-sm font-medium mb-2 block">Meta</label>
          <Select
            value={filters.goalId || "all"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                goalId: value === "all" ? undefined : value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {goals.map((goal) => (
                <SelectItem key={goal.id} value={goal.id}>
                  {goal.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Valor mínimo</label>
          <Input
            type="number"
            step="0.01"
            placeholder="0,00"
            value={filters.minAmount || ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                minAmount: e.target.value
                  ? parseFloat(e.target.value)
                  : undefined,
              })
            }
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Valor máximo</label>
          <Input
            type="number"
            step="0.01"
            placeholder="0,00"
            value={filters.maxAmount || ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                maxAmount: e.target.value
                  ? parseFloat(e.target.value)
                  : undefined,
              })
            }
          />
        </div>
      </div>
    </div>
  );
}

