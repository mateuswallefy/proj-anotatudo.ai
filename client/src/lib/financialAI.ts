/**
 * Motor de IA Financeira Interna
 * Análise inteligente e personalizada 100% local - zero tokens
 * 
 * Este sistema analisa padrões financeiros, detecta anomalias,
 * identifica oportunidades de economia e gera insights personalizados
 * baseado exclusivamente nos dados do usuário.
 */

import type { Transacao } from "@shared/schema";

export interface FinancialHealth {
  score: number; // 0-100
  level: "excelente" | "bom" | "regular" | "atenção" | "crítico";
  indicators: HealthIndicator[];
}

export interface HealthIndicator {
  id: string;
  type: "success" | "warning" | "danger" | "info";
  title: string;
  message: string;
  value: number;
  unit: string;
  trend?: "up" | "down" | "stable";
}

export interface FinancialInsight {
  id: string;
  category: "economia" | "gastos" | "receitas" | "padrões" | "alerta" | "oportunidade";
  priority: "alta" | "média" | "baixa";
  title: string;
  description: string;
  action?: string;
  impact?: {
    type: "economia" | "ganho" | "risco";
    amount: number;
    period: "mensal" | "anual";
  };
  confidence: number; // 0-100
}

export interface SpendingPattern {
  category: string;
  averageAmount: number;
  frequency: number; // transações por mês
  variance: number; // variabilidade (desvio padrão)
  trend: "increasing" | "decreasing" | "stable";
  peakDay?: string;
  peakHour?: number;
}

export interface ExpenseAnomaly {
  id: string;
  transactionId: string;
  type: "spike" | "unusual_category" | "timing" | "amount";
  severity: "high" | "medium" | "low";
  description: string;
  suggestion: string;
  expectedAmount?: number;
  actualAmount: number;
}

/**
 * Analisa a saúde financeira do usuário
 */
export function analyzeFinancialHealth(
  transactions: Transacao[],
  currentPeriod: { month: number; year: number }
): FinancialHealth {
  const monthTransactions = transactions.filter((t) => {
    const date = new Date(t.dataReal);
    return (
      date.getMonth() + 1 === currentPeriod.month &&
      date.getFullYear() === currentPeriod.year
    );
  });

  const receitas = monthTransactions
    .filter((t) => t.tipo === "entrada")
    .reduce((sum, t) => sum + parseFloat(t.valor), 0);

  const despesas = monthTransactions
    .filter((t) => t.tipo === "saida")
    .reduce((sum, t) => sum + parseFloat(t.valor), 0);

  const saldo = receitas - despesas;
  const savingsRate = receitas > 0 ? (saldo / receitas) * 100 : 0;

  const indicators: HealthIndicator[] = [];
  let score = 100;

  // Indicador 1: Taxa de Poupança
  if (savingsRate >= 20) {
    indicators.push({
      id: "savings-rate",
      type: "success",
      title: "Taxa de Poupança Excelente",
      message: `Você está poupando ${savingsRate.toFixed(1)}% da sua renda`,
      value: savingsRate,
      unit: "%",
      trend: "up",
    });
  } else if (savingsRate >= 10) {
    score -= 10;
    indicators.push({
      id: "savings-rate",
      type: "info",
      title: "Taxa de Poupança Boa",
      message: `Poupando ${savingsRate.toFixed(1)}%. Meta: 20%`,
      value: savingsRate,
      unit: "%",
      trend: "stable",
    });
  } else if (savingsRate >= 0) {
    score -= 25;
    indicators.push({
      id: "savings-rate",
      type: "warning",
      title: "Taxa de Poupança Baixa",
      message: `Apenas ${savingsRate.toFixed(1)}% sendo poupado`,
      value: savingsRate,
      unit: "%",
      trend: "down",
    });
  } else {
    score -= 50;
    indicators.push({
      id: "savings-rate",
      type: "danger",
      title: "Gastando Mais que a Renda",
      message: `Déficit de ${Math.abs(savingsRate).toFixed(1)}%`,
      value: savingsRate,
      unit: "%",
      trend: "down",
    });
  }

  // Indicador 2: Consistência de Receitas
  const previousMonth = getPreviousMonth(currentPeriod);
  const prevReceitas = transactions
    .filter((t) => {
      const date = new Date(t.dataReal);
      return (
        t.tipo === "entrada" &&
        date.getMonth() + 1 === previousMonth.month &&
        date.getFullYear() === previousMonth.year
      );
    })
    .reduce((sum, t) => sum + parseFloat(t.valor), 0);

  const incomeVariation =
    prevReceitas > 0 ? ((receitas - prevReceitas) / prevReceitas) * 100 : 0;

  if (Math.abs(incomeVariation) > 30) {
    score -= 15;
    indicators.push({
      id: "income-consistency",
      type: "warning",
      title: "Variação de Renda Alta",
      message: `Renda ${incomeVariation > 0 ? "aumentou" : "diminuiu"} ${Math.abs(incomeVariation).toFixed(1)}%`,
      value: Math.abs(incomeVariation),
      unit: "%",
      trend: incomeVariation > 0 ? "up" : "down",
    });
  } else {
    indicators.push({
      id: "income-consistency",
      type: "success",
      title: "Renda Consistente",
      message: "Suas receitas estão estáveis",
      value: Math.abs(incomeVariation),
      unit: "%",
      trend: "stable",
    });
  }

  // Indicador 3: Dispersão de Gastos
  const categorySpending: Record<string, number> = {};
  monthTransactions
    .filter((t) => t.tipo === "saida")
    .forEach((t) => {
      categorySpending[t.categoria] =
        (categorySpending[t.categoria] || 0) + parseFloat(t.valor);
    });

  const topCategoryPercent =
    despesas > 0
      ? (Math.max(...Object.values(categorySpending)) / despesas) * 100
      : 0;

  if (topCategoryPercent > 50) {
    score -= 20;
    indicators.push({
      id: "spending-diversity",
      type: "warning",
      title: "Concentração de Gastos",
      message: `${topCategoryPercent.toFixed(0)}% dos gastos em uma categoria`,
      value: topCategoryPercent,
      unit: "%",
      trend: "stable",
    });
  }

  // Indicador 4: Crescimento de Despesas
  const prevDespesas = transactions
    .filter((t) => {
      const date = new Date(t.dataReal);
      return (
        t.tipo === "saida" &&
        date.getMonth() + 1 === previousMonth.month &&
        date.getFullYear() === previousMonth.year
      );
    })
    .reduce((sum, t) => sum + parseFloat(t.valor), 0);

  const expenseGrowth =
    prevDespesas > 0 ? ((despesas - prevDespesas) / prevDespesas) * 100 : 0;

  if (expenseGrowth > 20) {
    score -= 25;
    indicators.push({
      id: "expense-growth",
      type: "danger",
      title: "Crescimento Acelerado de Gastos",
      message: `Gastos aumentaram ${expenseGrowth.toFixed(1)}%`,
      value: expenseGrowth,
      unit: "%",
      trend: "up",
    });
  }

  // Determinar nível
  let level: FinancialHealth["level"];
  if (score >= 80) level = "excelente";
  else if (score >= 60) level = "bom";
  else if (score >= 40) level = "regular";
  else if (score >= 20) level = "atenção";
  else level = "crítico";

  return {
    score: Math.max(0, Math.min(100, score)),
    level,
    indicators,
  };
}

/**
 * Gera insights personalizados baseados em padrões e anomalias
 */
export function generateFinancialInsights(
  transactions: Transacao[],
  currentPeriod: { month: number; year: number }
): FinancialInsight[] {
  const insights: FinancialInsight[] = [];
  const patterns = detectSpendingPatterns(transactions, currentPeriod);
  const anomalies = detectAnomalies(transactions, currentPeriod);

  // Análise de padrões de gastos
  patterns.forEach((pattern) => {
    if (pattern.variance > pattern.averageAmount * 0.5) {
      insights.push({
        id: `pattern-${pattern.category}`,
        category: "gastos",
        priority: "média",
        title: `Gastos Irregulares em ${pattern.category}`,
        description: `Seus gastos com ${pattern.category} variam muito (média: R$ ${pattern.averageAmount.toFixed(2)}, mas com alta variabilidade). Considere criar um orçamento fixo para esta categoria.`,
        action: "Criar teto de gastos para esta categoria",
        impact: {
          type: "economia",
          amount: pattern.averageAmount * 0.15, // Estimativa de economia
          period: "mensal",
        },
        confidence: 75,
      });
    }

    if (pattern.trend === "increasing" && pattern.frequency > 4) {
      insights.push({
        id: `trend-${pattern.category}`,
        category: "gastos",
        priority: "alta",
        title: `Tendência de Aumento: ${pattern.category}`,
        description: `Seus gastos com ${pattern.category} estão aumentando consistentemente. Já são ${pattern.frequency} transações neste mês.`,
        action: "Revisar necessidade desses gastos",
        impact: {
          type: "risco",
          amount: pattern.averageAmount * pattern.frequency * 0.3,
          period: "mensal",
        },
        confidence: 85,
      });
    }
  });

  // Análise de anomalias
  anomalies.forEach((anomaly) => {
    if (anomaly.severity === "high") {
      insights.push({
        id: `anomaly-${anomaly.id}`,
        category: "alerta",
        priority: "alta",
        title: "Gasto Atípico Detectado",
        description: anomaly.description,
        action: anomaly.suggestion,
        impact:
          anomaly.expectedAmount && anomaly.actualAmount > anomaly.expectedAmount
            ? {
                type: "risco",
                amount: anomaly.actualAmount - anomaly.expectedAmount,
                period: "mensal",
              }
            : undefined,
        confidence: 90,
      });
    }
  });

  // Oportunidades de economia
  const categoryAverages = calculateCategoryAverages(transactions);
  const currentSpending = calculateCurrentSpending(
    transactions,
    currentPeriod
  );

  Object.entries(currentSpending).forEach(([category, current]) => {
    const average = categoryAverages[category];
    if (average && current > average * 1.3) {
      const potentialSavings = current - average;
      insights.push({
        id: `opportunity-${category}`,
        category: "oportunidade",
        priority: "média",
        title: `Oportunidade de Economia: ${category}`,
        description: `Você está gastando R$ ${current.toFixed(2)} com ${category}, acima da sua média de R$ ${average.toFixed(2)}. Reduzir para a média economizaria R$ ${potentialSavings.toFixed(2)} por mês.`,
        action: `Revisar gastos em ${category}`,
        impact: {
          type: "economia",
          amount: potentialSavings,
          period: "mensal",
        },
        confidence: 70,
      });
    }
  });

  // Insights sobre receitas
  const receitas = transactions.filter(
    (t) =>
      t.tipo === "entrada" &&
      isInPeriod(t.dataReal, currentPeriod.month, currentPeriod.year)
  );

  if (receitas.length === 0) {
    insights.push({
      id: "no-income",
      category: "receitas",
      priority: "alta",
      title: "Nenhuma Receita Registrada",
      description:
        "Não foram encontradas receitas para este período. Certifique-se de registrar todas as suas entradas.",
      action: "Registrar receitas do período",
      confidence: 100,
    });
  }

  // Ordenar por prioridade e confiança
  return insights.sort((a, b) => {
    const priorityWeight = { alta: 3, média: 2, baixa: 1 };
    if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    }
    return b.confidence - a.confidence;
  });
}

/**
 * Detecta padrões de gastos
 */
function detectSpendingPatterns(
  transactions: Transacao[],
  period: { month: number; year: number }
): SpendingPattern[] {
  const monthTransactions = transactions.filter((t) =>
    isInPeriod(t.dataReal, period.month, period.year)
  );

  const categoryData: Record<
    string,
    { amounts: number[]; dates: string[] }
  > = {};

  monthTransactions
    .filter((t) => t.tipo === "saida")
    .forEach((t) => {
      if (!categoryData[t.categoria]) {
        categoryData[t.categoria] = { amounts: [], dates: [] };
      }
      categoryData[t.categoria].amounts.push(parseFloat(t.valor));
      categoryData[t.categoria].dates.push(t.dataReal);
    });

  const patterns: SpendingPattern[] = [];

  Object.entries(categoryData).forEach(([category, data]) => {
    if (data.amounts.length < 2) return;

    const averageAmount =
      data.amounts.reduce((a, b) => a + b, 0) / data.amounts.length;

    const variance = calculateVariance(data.amounts, averageAmount);

    // Detectar dia da semana mais comum
    const dayCounts: Record<number, number> = {};
    data.dates.forEach((dateStr) => {
      const day = new Date(dateStr).getDay();
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    const peakDayNum =
      Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const diasSemana = [
      "Domingo",
      "Segunda",
      "Terça",
      "Quarta",
      "Quinta",
      "Sexta",
      "Sábado",
    ];
    const peakDay = peakDayNum ? diasSemana[parseInt(peakDayNum)] : undefined;

    // Detectar tendência (comparar primeira metade vs segunda metade do mês)
    const midPoint = Math.floor(data.amounts.length / 2);
    const firstHalf = data.amounts.slice(0, midPoint);
    const secondHalf = data.amounts.slice(midPoint);
    const firstAvg =
      firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length || 0;
    const secondAvg =
      secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length || 0;

    let trend: "increasing" | "decreasing" | "stable" = "stable";
    if (secondAvg > firstAvg * 1.2) trend = "increasing";
    else if (secondAvg < firstAvg * 0.8) trend = "decreasing";

    patterns.push({
      category,
      averageAmount,
      frequency: data.amounts.length,
      variance: Math.sqrt(variance),
      trend,
      peakDay,
    });
  });

  return patterns;
}

/**
 * Detecta anomalias nas transações
 */
function detectAnomalies(
  transactions: Transacao[],
  period: { month: number; year: number }
): ExpenseAnomaly[] {
  const anomalies: ExpenseAnomaly[] = [];
  const monthTransactions = transactions.filter((t) =>
    isInPeriod(t.dataReal, period.month, period.year)
  );

  // Calcular estatísticas históricas (últimos 3 meses)
  const historicalStats = calculateHistoricalStats(transactions, period);

  monthTransactions
    .filter((t) => t.tipo === "saida")
    .forEach((transaction) => {
      const amount = parseFloat(transaction.valor);
      const category = transaction.categoria;
      const stats = historicalStats[category];

      if (!stats) return;

      // Detectar spikes (valores muito acima da média)
      const zScore = (amount - stats.mean) / stats.stdDev;
      if (zScore > 2.5) {
        anomalies.push({
          id: `spike-${transaction.id}`,
          transactionId: transaction.id,
          type: "spike",
          severity: zScore > 4 ? "high" : "medium",
          description: `Gasto de R$ ${amount.toFixed(2)} em ${category} está ${((amount / stats.mean - 1) * 100).toFixed(0)}% acima da sua média histórica.`,
          suggestion:
            "Verifique se este gasto foi necessário ou se houve algum erro.",
          expectedAmount: stats.mean,
          actualAmount: amount,
        });
      }
    });

  return anomalies;
}

/**
 * Funções auxiliares
 */
function isInPeriod(
  dateString: string,
  month: number,
  year: number
): boolean {
  const date = new Date(dateString);
  return date.getMonth() + 1 === month && date.getFullYear() === year;
}

function getPreviousMonth(period: {
  month: number;
  year: number;
}): { month: number; year: number } {
  if (period.month === 1) {
    return { month: 12, year: period.year - 1 };
  }
  return { month: period.month - 1, year: period.year };
}

function calculateVariance(numbers: number[], mean: number): number {
  const squaredDiffs = numbers.map((n) => Math.pow(n - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
}

function calculateCategoryAverages(
  transactions: Transacao[]
): Record<string, number> {
  const categoryTotals: Record<string, { total: number; months: Set<string> }> =
    {};

  transactions
    .filter((t) => t.tipo === "saida")
    .forEach((t) => {
      const date = new Date(t.dataReal);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

      if (!categoryTotals[t.categoria]) {
        categoryTotals[t.categoria] = { total: 0, months: new Set() };
      }
      categoryTotals[t.categoria].total += parseFloat(t.valor);
      categoryTotals[t.categoria].months.add(monthKey);
    });

  const averages: Record<string, number> = {};
  Object.entries(categoryTotals).forEach(([category, data]) => {
    if (data.months.size > 0) {
      averages[category] = data.total / data.months.size;
    }
  });

  return averages;
}

function calculateCurrentSpending(
  transactions: Transacao[],
  period: { month: number; year: number }
): Record<string, number> {
  const spending: Record<string, number> = {};

  transactions
    .filter(
      (t) =>
        t.tipo === "saida" &&
        isInPeriod(t.dataReal, period.month, period.year)
    )
    .forEach((t) => {
      spending[t.categoria] =
        (spending[t.categoria] || 0) + parseFloat(t.valor);
    });

  return spending;
}

function calculateHistoricalStats(
  transactions: Transacao[],
  currentPeriod: { month: number; year: number }
): Record<
  string,
  { mean: number; stdDev: number; count: number }
> {
  // Pegar últimos 3 meses
  const stats: Record<
    string,
    { amounts: number[] }
  > = {};

  for (let i = 1; i <= 3; i++) {
    const targetMonth = getPreviousMonth(currentPeriod);
    let period = currentPeriod;
    for (let j = 1; j < i; j++) {
      period = getPreviousMonth(period);
    }

    transactions
      .filter(
        (t) =>
          t.tipo === "saida" &&
          isInPeriod(t.dataReal, period.month, period.year)
      )
      .forEach((t) => {
        if (!stats[t.categoria]) {
          stats[t.categoria] = { amounts: [] };
        }
        stats[t.categoria].amounts.push(parseFloat(t.valor));
      });
  }

  const result: Record<
    string,
    { mean: number; stdDev: number; count: number }
  > = {};

  Object.entries(stats).forEach(([category, data]) => {
    if (data.amounts.length === 0) return;

    const mean =
      data.amounts.reduce((a, b) => a + b, 0) / data.amounts.length;
    const variance = calculateVariance(data.amounts, mean);
    const stdDev = Math.sqrt(variance);

    result[category] = {
      mean,
      stdDev: stdDev || 1, // Evitar divisão por zero
      count: data.amounts.length,
    };
  });

  return result;
}
