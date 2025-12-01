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
    <div className="sticky top-[56px] z-40 w-full border-b border-[var(--border)] bg-[var(--card)] px-4 py-3 transition-colors duration-200">
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2 max-w-md w-full">
          <Calendar className="h-5 w-5 text-[var(--text-secondary)]" />
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger 
              className="flex-1 h-10 border-[var(--border)] focus:ring-[var(--accent-green)] focus:ring-2 rounded-lg bg-[var(--card)] text-[var(--text-primary)]"
              data-testid="period-selector-bar"
            >
              <SelectValue placeholder="Selecione o período" />
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
    </div>
  );
}

