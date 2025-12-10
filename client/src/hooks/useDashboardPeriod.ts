import { useState, useMemo } from "react";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from "date-fns";

export type DashboardPeriodType = "mensal" | "semanal" | "diario";

interface DateRange {
  start: Date;
  end: Date;
}

export function useDashboardPeriod() {
  const [periodType, setPeriodType] = useState<DashboardPeriodType>("mensal");

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
      
      case "mensal":
      default:
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
        };
    }
  }, [periodType]);

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

  return {
    periodType,
    setPeriodType,
    dateRange,
    previousDateRange,
  };
}

