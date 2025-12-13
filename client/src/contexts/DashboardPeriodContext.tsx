import { createContext, useContext, useState, useMemo } from "react";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from "date-fns";

export type DashboardPeriodType = "mensal" | "semanal" | "diario" | "custom";

interface DateRange {
  start: Date;
  end: Date;
}

interface DashboardPeriodContextType {
  periodType: DashboardPeriodType;
  setPeriodType: (type: DashboardPeriodType) => void;
  dateRange: DateRange;
  previousDateRange: DateRange;
  selectedMonth: number | null;
  selectedYear: number | null;
  setSelectedMonthYear: (month: number, year: number) => void;
}

const DashboardPeriodContext = createContext<DashboardPeriodContextType | undefined>(undefined);

export function DashboardPeriodProvider({ children }: { children: React.ReactNode }) {
  const [periodType, setPeriodType] = useState<DashboardPeriodType>("mensal");
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const dateRange = useMemo<DateRange>(() => {
    const now = new Date();
    
    switch (periodType) {
      case "diario":
        return {
          start: startOfDay(now),
          end: endOfDay(now),
        };
      
      case "semanal":
        return {
          start: startOfDay(subDays(now, 6)),
          end: endOfDay(now),
        };
      
      case "mensal":
      default:
        if (selectedMonth !== null && selectedYear !== null) {
          return {
            start: startOfMonth(new Date(selectedYear, selectedMonth, 1)),
            end: endOfMonth(new Date(selectedYear, selectedMonth, 1)),
          };
        }
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
        };
    }
  }, [periodType, selectedMonth, selectedYear]);

  const previousDateRange = useMemo<DateRange>(() => {
    switch (periodType) {
      case "diario":
        return {
          start: startOfDay(subDays(new Date(), 1)),
          end: endOfDay(subDays(new Date(), 1)),
        };
      
      case "semanal":
        const sevenDaysAgo = subDays(new Date(), 7);
        return {
          start: startOfDay(subDays(sevenDaysAgo, 6)),
          end: endOfDay(sevenDaysAgo),
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

  return (
    <DashboardPeriodContext.Provider
      value={{
        periodType,
        setPeriodType,
        dateRange,
        previousDateRange,
        selectedMonth,
        selectedYear,
        setSelectedMonthYear,
      }}
    >
      {children}
    </DashboardPeriodContext.Provider>
  );
}

export function useDashboardPeriod() {
  const context = useContext(DashboardPeriodContext);
  if (context === undefined) {
    throw new Error("useDashboardPeriod must be used within DashboardPeriodProvider");
  }
  return context;
}

