import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PiggyBank, TrendingUp, Percent, Activity, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePeriod } from "@/contexts/PeriodContext";
import { MetricCard } from "@/components/cards/MetricCard";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type CategoryData = {
  categoria: string;
  total: number;
  percentual: number;
};

type PeriodSummary = {
  totalReceitas: number;
  totalDespesas: number;
  saldoPeriodo: number;
};

interface MonthlyData {
  mes: string;
  regular: number;
  emergencia: number;
  total: number;
}

export default function Economias() {
  const { period } = usePeriod();

  const { data: periodSummary, isLoading: loadingSummary } = useQuery<PeriodSummary>({
    queryKey: ["/api/analytics/period-summary", { period }],
  });

  const { data: receitas, isLoading: loadingReceitas } = useQuery<CategoryData[]>({
    queryKey: ["/api/analytics/income-by-category", { period }],
  });

  const { data: despesas, isLoading: loadingDespesas } = useQuery<CategoryData[]>({
    queryKey: ["/api/analytics/expenses-by-category", { period }],
  });

  const isLoading = loadingSummary || loadingReceitas || loadingDespesas;

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const totalReceitas = periodSummary?.totalReceitas || 0;
  const totalDespesas = periodSummary?.totalDespesas || 0;
  const economia = totalReceitas - totalDespesas;
  const taxaEconomia = totalReceitas > 0 ? (economia / totalReceitas) * 100 : 0;

  // Mock data for evolution chart - in a real scenario, this would come from an API
  const mockEvolutionData: MonthlyData[] = [
    { mes: "Jan", regular: 1200, emergencia: 300, total: 1500 },
    { mes: "Fev", regular: 1500, emergencia: 400, total: 1900 },
    { mes: "Mar", regular: 1300, emergencia: 500, total: 1800 },
    { mes: "Abr", regular: 1800, emergencia: 350, total: 2150 },
    { mes: "Mai", regular: 2000, emergencia: 600, total: 2600 },
    { mes: "Jun", regular: 1700, emergencia: 450, total: 2150 },
  ];

  // Calculate consistency (mock - would need historical data)
  const consistencyMonths = 6;

  // Calculate previous month comparison (mock - would need historical data)
  const previousMonthComparison = 8.5;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-card/95 backdrop-blur-md border border-border rounded-lg p-4 shadow-lg">
        <p className="font-semibold mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-mono font-semibold">
                R$ {entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </p>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="space-y-2" data-testid="header-economias">
        <h1 className="text-3xl font-bold tracking-tight">Economias</h1>
        <p className="text-muted-foreground">
          Acompanhe quanto você está guardando
        </p>
      </div>

      {/* CTA Button */}
      <Button
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 hover:from-blue-700 hover:to-purple-700"
        data-testid="button-registrar-economia"
      >
        <Plus className="h-4 w-4" />
        Registrar Economia
      </Button>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={PiggyBank}
          label="Total Economizado"
          value={`R$ ${economia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle="+10% da renda"
          iconColor="text-purple-600 dark:text-purple-400"
          iconBg="bg-purple-600/10"
          data-testid="card-total-economizado"
        />
        
        <MetricCard
          icon={TrendingUp}
          label="Este Mês"
          value={`R$ ${economia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle={`+${previousMonthComparison}% vs mês anterior`}
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-600/10"
          data-testid="card-este-mes"
        />
        
        <MetricCard
          icon={Percent}
          label="% da Renda"
          value={`${taxaEconomia.toFixed(1)}%`}
          subtitle="Meta: 15%"
          iconColor="text-purple-600 dark:text-purple-400"
          iconBg="bg-purple-600/10"
          data-testid="card-percentual-renda"
        />
        
        <MetricCard
          icon={Activity}
          label="Consistência"
          value={consistencyMonths}
          subtitle="Meses seguidos"
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-600/10"
          data-testid="card-consistencia"
        />
      </div>

      {/* Evolution Chart Section */}
      <Card className="p-6" data-testid="card-evolucao-economias">
        <div className="mb-6 space-y-4">
          <h3 className="text-lg font-semibold">Evolução das Economias</h3>
          
          {/* Custom Legend */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-600" />
              <span className="text-muted-foreground">Regular</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600" />
              <span className="text-muted-foreground">Emergência</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-400" />
              <span className="text-muted-foreground">Total</span>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <AreaChart
            data={mockEvolutionData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <defs>
              <linearGradient id="colorRegular" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9333EA" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#9333EA" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorEmergencia" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C084FC" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#C084FC" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              strokeOpacity={0.3}
              vertical={false}
            />

            <XAxis
              dataKey="mes"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))', strokeOpacity: 0.2 }}
            />

            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
            />

            <Area
              type="monotone"
              dataKey="regular"
              name="Regular"
              fill="url(#colorRegular)"
              stroke="#9333EA"
              strokeWidth={3}
              dot={{ r: 4, fill: '#9333EA', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#9333EA', strokeWidth: 2, stroke: '#fff' }}
              animationDuration={600}
              animationEasing="ease-out"
            />

            <Area
              type="monotone"
              dataKey="emergencia"
              name="Emergência"
              fill="url(#colorEmergencia)"
              stroke="#2563EB"
              strokeWidth={3}
              dot={{ r: 4, fill: '#2563EB', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }}
              animationDuration={600}
              animationEasing="ease-out"
            />

            <Area
              type="monotone"
              dataKey="total"
              name="Total"
              fill="url(#colorTotal)"
              stroke="#C084FC"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3, fill: '#C084FC', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#C084FC', strokeWidth: 2, stroke: '#fff' }}
              animationDuration={600}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
