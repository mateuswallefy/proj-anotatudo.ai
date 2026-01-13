import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardContainer } from "@/components/dashboard/DashboardContainer";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Target,
  Activity,
  DollarSign,
  PieChart,
  BarChart3,
  LineChart as LineChartIcon,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Zap,
  Shield,
} from "lucide-react";
import { usePeriod } from "@/contexts/PeriodContext";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useCategorySpending } from "@/hooks/useCategorySpending";
import { useMonthlyBalance } from "@/hooks/useMonthlyBalance";
import { useFinancialAI } from "@/hooks/useFinancialAI";
import { PeriodSelector } from "@/components/PeriodSelector";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const healthLevelColors = {
  excelente: "bg-emerald-500",
  bom: "bg-blue-500",
  regular: "bg-yellow-500",
  atenção: "bg-orange-500",
  crítico: "bg-red-500",
};

const healthLevelLabels = {
  excelente: "Excelente",
  bom: "Bom",
  regular: "Regular",
  atenção: "Atenção",
  crítico: "Crítico",
};

const insightCategoryIcons = {
  economia: TrendingDown,
  gastos: DollarSign,
  receitas: TrendingUp,
  padrões: Activity,
  alerta: AlertTriangle,
  oportunidade: Sparkles,
};

const priorityColors = {
  alta: "border-red-500 bg-red-50 dark:bg-red-950/20",
  média: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20",
  baixa: "border-blue-500 bg-blue-50 dark:bg-blue-950/20",
};

export default function Relatorios() {
  const { period } = usePeriod();
  const stats = useDashboardStats();
  const { data: categoryData = [] } = useCategorySpending();
  const { data: balanceData = [] } = useMonthlyBalance();
  const { health, insights, isLoading: aiLoading } = useFinancialAI();

  const [activeTab, setActiveTab] = useState("overview");

  // Prepare chart data
  const monthlyEvolutionData = useMemo(() => {
    if (!balanceData || balanceData.length === 0) return [];
    return balanceData.map((item: any) => ({
      date: format(new Date(item.date), "dd/MM"),
      receitas: parseFloat(item.receitas || 0),
      despesas: parseFloat(item.despesas || 0),
      saldo: parseFloat(item.saldo || 0),
    }));
  }, [balanceData]);

  const categoryChartData = useMemo(() => {
    return categoryData.slice(0, 8).map((cat) => ({
      name: cat.categoria.length > 12 ? cat.categoria.substring(0, 10) + "..." : cat.categoria,
      fullName: cat.categoria,
      value: cat.valor,
      percentual: cat.percentual,
    }));
  }, [categoryData]);

  const COLORS = [
    "#F2994A",
    "#8B5CF6",
    "#EC4899",
    "#3B82F6",
    "#0AA298",
    "#F59E0B",
    "#10B981",
    "#06B6D4",
  ];

  return (
    <DashboardContainer>
      <div className="space-y-6 pb-24">
        {/* Header Premium */}
        <div className="relative overflow-hidden rounded-3xl border-2 bg-gradient-to-br from-slate-50 via-blue-50/50 to-purple-50/50 dark:from-slate-900 dark:via-blue-950/20 dark:to-purple-950/20 p-8 shadow-2xl">
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
                backgroundSize: "40px 40px",
              }}
            />
          </div>

          <div className="relative space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg flex items-center justify-center">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    Relatórios Inteligentes
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Análise profunda da sua saúde financeira com IA
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl px-4 py-3 shadow-sm border border-slate-200 dark:border-slate-700">
                <PeriodSelector />
              </div>
            </div>

            {/* Health Score Card */}
            {health && (
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="relative w-32 h-32">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          className="text-slate-200 dark:text-slate-700"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 56}`}
                          strokeDashoffset={`${2 * Math.PI * 56 * (1 - health.score / 100)}`}
                          className={cn(
                            "transition-all duration-1000",
                            healthLevelColors[health.level]
                          )}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                            {health.score}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">Score</div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Badge
                          className={cn(
                            "text-sm px-3 py-1",
                            health.level === "excelente" && "bg-emerald-500 text-white",
                            health.level === "bom" && "bg-blue-500 text-white",
                            health.level === "regular" && "bg-yellow-500 text-white",
                            health.level === "atenção" && "bg-orange-500 text-white",
                            health.level === "crítico" && "bg-red-500 text-white"
                          )}
                        >
                          {healthLevelLabels[health.level]}
                        </Badge>
                        <Shield className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                        Saúde Financeira
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Análise inteligente baseada em seus padrões de gasto e receita
                      </p>
                    </div>
                  </div>

                  {/* Health Indicators */}
                  <div className="grid grid-cols-2 gap-3 min-w-[300px]">
                    {health.indicators.slice(0, 4).map((indicator) => (
                      <div
                        key={indicator.id}
                        className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {indicator.type === "success" && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          )}
                          {indicator.type === "warning" && (
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                          )}
                          {indicator.type === "danger" && (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          {indicator.type === "info" && (
                            <Info className="h-4 w-4 text-blue-600" />
                          )}
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            {indicator.title}
                          </span>
                        </div>
                        <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                          {indicator.value.toFixed(1)}
                          <span className="text-xs text-slate-500 ml-1">{indicator.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-4xl grid-cols-4 mb-6 h-12 bg-slate-100 dark:bg-slate-800">
            <TabsTrigger value="overview" className="gap-2">
              <Activity className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Insights IA
              {insights.length > 0 && (
                <Badge className="ml-1 h-5 px-1.5 text-xs">{insights.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Análises
            </TabsTrigger>
            <TabsTrigger value="patterns" className="gap-2">
              <Target className="h-4 w-4" />
              Padrões
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPIs Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="rounded-2xl border-2 overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    {stats.variacaoReceitas !== 0 && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1",
                          stats.variacaoReceitas > 0
                            ? "border-emerald-500 text-emerald-700 dark:text-emerald-400"
                            : "border-red-500 text-red-700 dark:text-red-400"
                        )}
                      >
                        {stats.variacaoReceitas > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(stats.variacaoReceitas).toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Receitas do Mês
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {stats.isLoading ? (
                      <Skeleton className="h-8 w-32" />
                    ) : (
                      formatCurrency(stats.receitas)
                    )}
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-2 overflow-hidden bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950/30 dark:to-pink-900/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-pink-500 flex items-center justify-center shadow-lg">
                      <TrendingDown className="h-6 w-6 text-white" />
                    </div>
                    {stats.variacaoDespesas !== 0 && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1",
                          stats.variacaoDespesas < 0
                            ? "border-emerald-500 text-emerald-700 dark:text-emerald-400"
                            : "border-red-500 text-red-700 dark:text-red-400"
                        )}
                      >
                        {stats.variacaoDespesas < 0 ? (
                          <TrendingUpIcon className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(stats.variacaoDespesas).toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Despesas do Mês
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {stats.isLoading ? (
                      <Skeleton className="h-8 w-32" />
                    ) : (
                      formatCurrency(stats.despesas)
                    )}
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-2 overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    {stats.variacaoSaldo !== 0 && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1",
                          stats.variacaoSaldo > 0
                            ? "border-emerald-500 text-emerald-700 dark:text-emerald-400"
                            : "border-red-500 text-red-700 dark:text-red-400"
                        )}
                      >
                        {stats.variacaoSaldo > 0 ? (
                          <TrendingUpIcon className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(stats.variacaoSaldo).toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Saldo Mensal
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {stats.isLoading ? (
                      <Skeleton className="h-8 w-32" />
                    ) : (
                      formatCurrency(stats.saldo)
                    )}
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-2 overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center shadow-lg">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Taxa de Poupança
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {stats.isLoading ? (
                      <Skeleton className="h-8 w-32" />
                    ) : stats.receitas > 0 ? (
                      `${((stats.saldo / stats.receitas) * 100).toFixed(1)}%`
                    ) : (
                      "0%"
                    )}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Evolution */}
              <Card className="rounded-2xl border-2">
                <CardHeader className="border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <LineChartIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle>Evolução Mensal</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {monthlyEvolutionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={monthlyEvolutionData}>
                        <defs>
                          <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" />
                        <YAxis
                          tickFormatter={(value) =>
                            new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                              notation: "compact",
                            }).format(value)
                          }
                        />
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="receitas"
                          stroke="#10b981"
                          fillOpacity={1}
                          fill="url(#colorReceitas)"
                          name="Receitas"
                        />
                        <Area
                          type="monotone"
                          dataKey="despesas"
                          stroke="#ec4899"
                          fillOpacity={1}
                          fill="url(#colorDespesas)"
                          name="Despesas"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-slate-500">
                      Sem dados para exibir
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Category Distribution */}
              <Card className="rounded-2xl border-2">
                <CardHeader className="border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <PieChart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <CardTitle>Gastos por Categoria</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {categoryChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={categoryChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-slate-500">
                      Sem dados para exibir
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top Categories Bar Chart */}
            <Card className="rounded-2xl border-2">
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <CardTitle>Top Categorias de Gastos</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {categoryChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={categoryChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                      <YAxis dataKey="name" type="category" width={120} />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[350px] flex items-center justify-center text-slate-500">
                    Sem dados para exibir
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="h-6 w-6" />
                <h2 className="text-2xl font-bold">Insights Inteligentes</h2>
              </div>
              <p className="text-blue-100">
                Análise personalizada gerada por nossa IA baseada nos seus padrões financeiros
              </p>
            </div>

            {aiLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="rounded-2xl">
                    <CardContent className="p-6">
                      <Skeleton className="h-32 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : insights.length === 0 ? (
              <Card className="rounded-2xl border-2">
                <CardContent className="p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Lightbulb className="h-8 w-8 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                        Nenhum insight disponível
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Continue registrando transações para receber insights personalizados
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.map((insight) => {
                  const Icon = insightCategoryIcons[insight.category] || Lightbulb;
                  return (
                    <Card
                      key={insight.id}
                      className={cn(
                        "rounded-2xl border-2 transition-all hover:shadow-lg",
                        priorityColors[insight.priority]
                      )}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center",
                                insight.category === "economia" && "bg-emerald-100 dark:bg-emerald-900/30",
                                insight.category === "gastos" && "bg-pink-100 dark:bg-pink-900/30",
                                insight.category === "receitas" && "bg-blue-100 dark:bg-blue-900/30",
                                insight.category === "padrões" && "bg-purple-100 dark:bg-purple-900/30",
                                insight.category === "alerta" && "bg-red-100 dark:bg-red-900/30",
                                insight.category === "oportunidade" && "bg-yellow-100 dark:bg-yellow-900/30"
                              )}
                            >
                              <Icon className="h-6 w-6 text-slate-700 dark:text-slate-300" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{insight.title}</CardTitle>
                              <Badge className="mt-2" variant="outline">
                                {insight.category}
                              </Badge>
                            </div>
                          </div>
                          <Badge
                            className={cn(
                              insight.priority === "alta" && "bg-red-500 text-white",
                              insight.priority === "média" && "bg-yellow-500 text-white",
                              insight.priority === "baixa" && "bg-blue-500 text-white"
                            )}
                          >
                            {insight.priority}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {insight.description}
                        </p>

                        {insight.action && (
                          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                            <Zap className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {insight.action}
                            </span>
                          </div>
                        )}

                        {insight.impact && (
                          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                Impacto {insight.impact.period === "mensal" ? "Mensal" : "Anual"}
                              </p>
                              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                {insight.impact.type === "economia" ? "Economia: " : ""}
                                {insight.impact.type === "ganho" ? "Ganho: " : ""}
                                {insight.impact.type === "risco" ? "Risco: " : ""}
                                {formatCurrency(insight.impact.amount)}
                              </p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-blue-600" />
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                          <span className="text-xs text-slate-500">
                            Confiança: {insight.confidence}%
                          </span>
                          <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all"
                              style={{ width: `${insight.confidence}%` }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="rounded-2xl border-2">
              <CardHeader>
                <CardTitle>Análises Detalhadas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Análises detalhadas serão implementadas aqui
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Patterns Tab */}
          <TabsContent value="patterns" className="space-y-6">
            <Card className="rounded-2xl border-2">
              <CardHeader>
                <CardTitle>Padrões de Comportamento</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Análise de padrões será implementada aqui
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardContainer>
  );
}
