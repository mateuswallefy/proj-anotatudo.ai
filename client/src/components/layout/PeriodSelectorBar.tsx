import { usePeriod } from "@/contexts/PeriodContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

export function PeriodSelectorBar() {
  const { period, setPeriod } = usePeriod();

  // Generate period options (last 12 months)
  const periodOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    const value = format(date, "yyyy-MM");
    const label = format(date, "MMMM yyyy", { locale: ptBR });
    return { value, label: label.charAt(0).toUpperCase() + label.slice(1) };
  });

  return (
    <div className="sticky top-[56px] z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3">
      <div className="flex items-center justify-center">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger 
            className="w-full max-w-[240px] h-10 rounded-full border-2 shadow-sm"
            data-testid="period-selector-bar"
          >
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

