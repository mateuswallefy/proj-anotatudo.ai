import { useState, useMemo } from "react";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths, getMonth, getYear } from "date-fns";

export type DashboardPeriodType = "mensal" | "semanal" | "diario" | "custom";

interface DateRange {
  start: Date;
  end: Date;
}

export function useDashboardPeriod() {
  const [periodType, setPeriodType] = useState<DashboardPeriodType>("mensal");
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);

  const dateRange = useMemo<DateRange>(() => {
    const now = new Date();
    
    switch (periodType) {
      case "diario":
        return {
          start: startOfDay(now),
          end: endOfDay(now),
        };
      
      case "semanal":
        // Últimos 7 dias (não semana corrente)
        return {
          start: startOfDay(subDays(now, 6)), // 7 dias atrás (incluindo hoje = 7 dias)
          end: endOfDay(now),
        };
      
      case "custom":
        if (customStartDate && customEndDate) {
          return {
            start: startOfDay(customStartDate),
            end: endOfDay(customEndDate),
          };
        }
        // Fallback to current month if custom dates not set
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
        };
      
      case "mensal":
      default:
        // If a specific month/year is selected, use it
        if (selectedMonth !== null && selectedYear !== null) {
          return {
            start: startOfMonth(new Date(selectedYear, selectedMonth, 1)),
            end: endOfMonth(new Date(selectedYear, selectedMonth, 1)),
          };
        }
        // Otherwise use current month
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
        };
    }
  }, [periodType, selectedMonth, selectedYear, customStartDate, customEndDate]);

  // Para comparação com período anterior
  const previousDateRange = useMemo<DateRange>(() => {
    switch (periodType) {
      case "diario":
        return {
          start: startOfDay(subDays(new Date(), 1)),
          end: endOfDay(subDays(new Date(), 1)),
        };
      
      case "semanal":
        // Últimos 7 dias anteriores (7 dias antes dos últimos 7 dias)
        const sevenDaysAgo = subDays(new Date(), 7);
        return {
          start: startOfDay(subDays(sevenDaysAgo, 6)), // 14 dias atrás
          end: endOfDay(sevenDaysAgo), // 7 dias atrás
        };
      
      case "mensal":
      default:
        const lastMonth = subMonths(new Date(), 1);
        return {
          start: startOfMonth(lastMonth),
          end: endOfMonth(lastMonth),
        };
    }
  }, [periodType]);

  const setSelectedMonthYear = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    setPeriodType("mensal");
  };

  const setCustomDateRange = (start: Date, end: Date) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
    setPeriodType("custom");
  };

  return {
    periodType,
    setPeriodType,
    dateRange,
    previousDateRange,
    selectedMonth,
    selectedYear,
    setSelectedMonthYear,
    setCustomDateRange,
  };
}

