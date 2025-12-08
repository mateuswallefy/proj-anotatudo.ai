import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardContainer } from "@/components/dashboard/DashboardContainer";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardMonthlyBalance } from "@/components/dashboard/DashboardMonthlyBalance";
import { DashboardCategoryChart } from "@/components/dashboard/DashboardCategoryChart";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, TrendingUp, TrendingDown, AlertTriangle, Lightbulb } from "lucide-react";
import { usePeriod } from "@/contexts/PeriodContext";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useCategorySpending } from "@/hooks/useCategorySpending";
import { useMonthlyBalance } from "@/hooks/useMonthlyBalance";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function Relatorios() {
  const { period } = usePeriod();
  const stats = useDashboardStats();
  const { data: categoryData } = useCategorySpending();
  const { data: balanceData } = useMonthlyBalance();

  // Calculate quarterly evolution (mock - would need API)
  const quarterlyData = [
    { month: "Jan", receitas: 5000, despesas: 3000 },
    { month: "Fev", receitas: 5500, despesas: 3200 },
    { month: "Mar", receitas: 6000, despesas: 3500 },
  ];

  // Calculate top categories
  const topCategories = categoryData
    .slice(0, 5)
    .map((cat) => ({
      categoria: cat.categoria,
      valor: cat.valor,
    }));

  return (
    <DashboardContainer>
      <div className="space-y-6 pb-24">
        <DashboardHeader />

        <Tabs defaultValue="fechamento" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-2 mb-6">
            <TabsTrigger value="fechamento">Fechamento do Mês</TabsTrigger>
            <TabsTrigger value="extrato">Extrato Detalhado</TabsTrigger>
          </TabsList>

          {/* Fechamento Tab */}
          <TabsContent value="fechamento" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Receitas</p>
                      <p className="text-lg font-bold">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(stats.receitas)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                      <TrendingDown className="h-5 w-5 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Despesas</p>
                      <p className="text-lg font-bold">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(stats.despesas)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Saldo</p>
                      <p className="text-lg font-bold">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(stats.saldo)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Economia</p>
                      <p className="text-lg font-bold">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(stats.receitas - stats.despesas)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DashboardMonthlyBalance />
              <DashboardCategoryChart />
            </div>

            {/* Evolution Charts */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Evolução Trimestral</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={quarterlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
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
                      formatter={(value: number) =>
                        new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(value)
                      }
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="receitas"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Receitas"
                    />
                    <Line
                      type="monotone"
                      dataKey="despesas"
                      stroke="#ec4899"
                      strokeWidth={2}
                      name="Despesas"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Categories */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Top Vilões</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topCategories}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="categoria" />
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
                      formatter={(value: number) =>
                        new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(value)
                      }
                    />
                    <Bar dataKey="valor" fill="#ec4899" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Extrato Tab */}
          <TabsContent value="extrato" className="space-y-6">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Extrato Detalhado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Extrato detalhado será implementado aqui
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardContainer>
  );
}

