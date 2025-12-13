import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDashboardPeriod } from "@/hooks/useDashboardPeriod";
import { addMonths, subMonths, getMonth, getYear } from "date-fns";
import { cn } from "@/lib/utils";

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export function DashboardCalendar() {
  const { dateRange, setSelectedMonthYear } = useDashboardPeriod();
  const [isOpen, setIsOpen] = useState(false);
  const [tempSelectedMonth, setTempSelectedMonth] = useState(getMonth(dateRange.start));
  const [tempSelectedYear, setTempSelectedYear] = useState(getYear(dateRange.start));

  const currentMonth = getMonth(dateRange.start);
  const currentYear = getYear(dateRange.start);
  const displayText = `${monthNames[currentMonth]} | ${currentYear}`;

  const handlePrevMonth = () => {
    const newDate = subMonths(new Date(currentYear, currentMonth, 1), 1);
    setSelectedMonthYear(getMonth(newDate), getYear(newDate));
  };

  const handleNextMonth = () => {
    const newDate = addMonths(new Date(currentYear, currentMonth, 1), 1);
    setSelectedMonthYear(getMonth(newDate), getYear(newDate));
  };

  const handleMonthSelect = (month: number, year: number) => {
    setSelectedMonthYear(month, year);
    setIsOpen(false);
  };

  const handleOpenCalendar = () => {
    setTempSelectedMonth(currentMonth);
    setTempSelectedYear(currentYear);
    setIsOpen(true);
  };

  // Generate months for the calendar grid (last 12 months + current + next 3)
  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    const currentMonthIdx = now.getMonth();
    const currentYear = now.getFullYear();

    // Last 12 months
    for (let i = 12; i >= 1; i--) {
      const date = subMonths(now, i);
      options.push({
        month: getMonth(date),
        year: getYear(date),
        label: `${monthNames[getMonth(date)]} ${getYear(date)}`,
      });
    }

    // Current month
    options.push({
      month: currentMonthIdx,
      year: currentYear,
      label: `${monthNames[currentMonthIdx]} ${currentYear}`,
    });

    // Next 3 months
    for (let i = 1; i <= 3; i++) {
      const date = addMonths(now, i);
      options.push({
        month: getMonth(date),
        year: getYear(date),
        label: `${monthNames[getMonth(date)]} ${getYear(date)}`,
      });
    }

    return options;
  };

  return (
    <>
      <div className="inline-flex items-center gap-1 md:gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 md:h-8 md:w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 touch-manipulation flex-shrink-0"
          onClick={handlePrevMonth}
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-5 w-5 md:h-4 md:w-4 text-[#3B82F6]" />
        </Button>
        
        <Button
          variant="ghost"
          onClick={handleOpenCalendar}
          className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 touch-manipulation"
        >
          <CalendarIcon className="h-4 w-4 text-[#3B82F6] flex-shrink-0" />
          <span className="text-base md:text-sm font-semibold text-gray-800 dark:text-gray-100 whitespace-nowrap">{displayText}</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 md:h-8 md:w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 touch-manipulation flex-shrink-0"
          onClick={handleNextMonth}
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-5 w-5 md:h-4 md:w-4 text-[#3B82F6]" />
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Selecionar Período</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2 p-4">
            {generateMonthOptions().map((option) => {
              const isSelected = option.month === tempSelectedMonth && option.year === tempSelectedYear;
              const isCurrent = option.month === currentMonth && option.year === currentYear;
              
              return (
                <Button
                  key={`${option.year}-${option.month}`}
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "h-auto py-3 px-2 text-xs",
                    isSelected && "bg-[#F39200] hover:bg-[#D87E00]",
                    isCurrent && !isSelected && "border-[#F39200] border-2"
                  )}
                  onClick={() => handleMonthSelect(option.month, option.year)}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-semibold">{monthNames[option.month].slice(0, 3)}</span>
                    <span className="text-[10px] opacity-70">{option.year}</span>
                  </div>
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

