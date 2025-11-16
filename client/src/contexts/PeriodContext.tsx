import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { format, addMonths, subMonths, startOfMonth } from 'date-fns';

interface PeriodContextType {
  period: string;
  setPeriod: (period: string) => void;
  goToNextMonth: () => void;
  goToPrevMonth: () => void;
  goToCurrentMonth: () => void;
  isCurrentMonth: boolean;
}

const PeriodContext = createContext<PeriodContextType | undefined>(undefined);

function getCurrentMonthISO(): string {
  return format(startOfMonth(new Date()), 'yyyy-MM');
}

function parseMonthFromISO(iso: string): Date | null {
  if (!/^\d{4}-\d{2}$/.test(iso)) {
    return null;
  }
  const [year, month] = iso.split('-').map(Number);
  if (month < 1 || month > 12) {
    return null;
  }
  return new Date(year, month - 1, 1);
}

export function PeriodProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const searchParams = useSearch();
  
  const urlPeriod = new URLSearchParams(searchParams).get('period');
  const currentMonthISO = getCurrentMonthISO();
  
  const [period, setPeriodState] = useState<string>(
    urlPeriod && /^\d{4}-\d{2}$/.test(urlPeriod) ? urlPeriod : currentMonthISO
  );

  useEffect(() => {
    const urlPeriodParam = new URLSearchParams(searchParams).get('period');
    if (urlPeriodParam && /^\d{4}-\d{2}$/.test(urlPeriodParam)) {
      const [, month] = urlPeriodParam.split('-').map(Number);
      if (month >= 1 && month <= 12) {
        setPeriodState(urlPeriodParam);
      } else {
        console.error('Invalid month in URL, resetting to current month');
        setPeriod(currentMonthISO);
      }
    } else if (urlPeriodParam) {
      console.error('Invalid period format in URL, resetting to current month');
      setPeriod(currentMonthISO);
    }
  }, [searchParams]);

  const setPeriod = (newPeriod: string) => {
    setPeriodState(newPeriod);
    const currentPath = location.split('?')[0];
    const params = new URLSearchParams(searchParams);
    
    if (newPeriod === currentMonthISO) {
      params.delete('period');
    } else {
      params.set('period', newPeriod);
    }
    
    const newSearch = params.toString();
    setLocation(`${currentPath}${newSearch ? `?${newSearch}` : ''}`);
  };

  const goToNextMonth = () => {
    const currentDate = parseMonthFromISO(period);
    if (!currentDate) {
      console.error('Invalid period, reverting to current month');
      goToCurrentMonth();
      return;
    }
    const nextMonth = addMonths(currentDate, 1);
    const newPeriod = format(nextMonth, 'yyyy-MM');
    setPeriod(newPeriod);
  };

  const goToPrevMonth = () => {
    const currentDate = parseMonthFromISO(period);
    if (!currentDate) {
      console.error('Invalid period, reverting to current month');
      goToCurrentMonth();
      return;
    }
    const prevMonth = subMonths(currentDate, 1);
    const newPeriod = format(prevMonth, 'yyyy-MM');
    setPeriod(newPeriod);
  };

  const goToCurrentMonth = () => {
    setPeriod(currentMonthISO);
  };

  const isCurrentMonth = period === currentMonthISO;

  return (
    <PeriodContext.Provider
      value={{
        period,
        setPeriod,
        goToNextMonth,
        goToPrevMonth,
        goToCurrentMonth,
        isCurrentMonth,
      }}
    >
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriod() {
  const context = useContext(PeriodContext);
  if (context === undefined) {
    throw new Error('usePeriod must be used within a PeriodProvider');
  }
  return context;
}
