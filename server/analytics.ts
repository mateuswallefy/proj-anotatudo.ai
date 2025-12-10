import { Transacao } from "@shared/schema";
import { storage } from "./storage.js";

export interface FinancialInsights {
  mediaDiariaGastos: number;
  mediaDiariaReceitas: number;
  totalGastosMes: number;
  totalReceitasMes: number;
  categoriaQueMaisGasta: {
    categoria: string;
    total: number;
    percentual: number;
  } | null;
  diaSemanaQueMaisGasta: {
    dia: string;
    total: number;
  } | null;
  topCategorias: Array<{
    categoria: string;
    total: number;
    percentual: number;
    transacoes: number;
  }>;
  dicasEconomia: string[];
  gastosPorDia: Array<{
    data: string;
    total: number;
  }>;
  receitasPorDia: Array<{
    data: string;
    total: number;
  }>;
  gastosPorDiaSemana: Record<string, number>;
  progressoMensal: {
    percentualGasto: number;
    diasDecorridos: number;
    diasRestantes: number;
    mediaDiariaAtual: number;
    mediaDiariaIdeal: number;
  };
}

const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export async function calculateFinancialInsights(
  userId: string,
  mes?: number,
  ano?: number
): Promise<FinancialInsights> {
  const now = new Date();
  const targetMes = mes ?? now.getMonth() + 1;
  const targetAno = ano ?? now.getFullYear();

  // Get all transactions for the user
  const allTransactions = await storage.getTransacoes(userId);

  // Filter transactions for the target month
  const monthTransactions = allTransactions.filter(t => {
    const date = new Date(t.dataReal);
    return date.getMonth() + 1 === targetMes && date.getFullYear() === targetAno;
  });

  const gastos = monthTransactions.filter(t => t.tipo === 'saida');
  const receitas = monthTransactions.filter(t => t.tipo === 'entrada');

  // Calculate days in month
  const daysInMonth = new Date(targetAno, targetMes, 0).getDate();
  const currentDay = now.getMonth() + 1 === targetMes && now.getFullYear() === targetAno 
    ? now.getDate() 
    : daysInMonth;

  // Total gastos e receitas
  const totalGastos = gastos.reduce((sum, t) => sum + parseFloat(t.valor), 0);
  const totalReceitas = receitas.reduce((sum, t) => sum + parseFloat(t.valor), 0);

  // Médias diárias
  const mediaDiariaGastos = currentDay > 0 ? totalGastos / currentDay : 0;
  const mediaDiariaReceitas = currentDay > 0 ? totalReceitas / currentDay : 0;

  // Categoria que mais gasta
  const gastosPorCategoria: Record<string, number> = {};
  gastos.forEach(t => {
    if (!gastosPorCategoria[t.categoria]) {
      gastosPorCategoria[t.categoria] = 0;
    }
    gastosPorCategoria[t.categoria] += parseFloat(t.valor);
  });

  const categoriasRanked = Object.entries(gastosPorCategoria)
    .map(([categoria, total]) => ({
      categoria,
      total,
      percentual: totalGastos > 0 ? (total / totalGastos) * 100 : 0,
      transacoes: gastos.filter(t => t.categoria === categoria).length,
    }))
    .sort((a, b) => b.total - a.total);

  const categoriaQueMaisGasta = categoriasRanked.length > 0 ? categoriasRanked[0] : null;

  // Dia da semana que mais gasta
  const gastosPorDiaSemana: Record<string, number> = {};
  diasSemana.forEach(dia => {
    gastosPorDiaSemana[dia] = 0;
  });

  gastos.forEach(t => {
    const date = new Date(t.dataReal);
    const diaSemana = diasSemana[date.getDay()];
    gastosPorDiaSemana[diaSemana] += parseFloat(t.valor);
  });

  const diaSemanaRanked = Object.entries(gastosPorDiaSemana)
    .sort((a, b) => b[1] - a[1]);

  const diaSemanaQueMaisGasta = diaSemanaRanked.length > 0 && diaSemanaRanked[0][1] > 0
    ? { dia: diaSemanaRanked[0][0], total: diaSemanaRanked[0][1] }
    : null;

  // Gastos por dia do mês
  const gastosPorDia: Record<string, number> = {};
  const receitasPorDia: Record<string, number> = {};

  for (let dia = 1; dia <= daysInMonth; dia++) {
    const dataStr = `${targetAno}-${String(targetMes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    gastosPorDia[dataStr] = 0;
    receitasPorDia[dataStr] = 0;
  }

  gastos.forEach(t => {
    const dataStr = t.dataReal;
    if (gastosPorDia[dataStr] !== undefined) {
      gastosPorDia[dataStr] += parseFloat(t.valor);
    }
  });

  receitas.forEach(t => {
    const dataStr = t.dataReal;
    if (receitasPorDia[dataStr] !== undefined) {
      receitasPorDia[dataStr] += parseFloat(t.valor);
    }
  });

  const gastosPorDiaArray = Object.entries(gastosPorDia).map(([data, total]) => ({
    data,
    total,
  }));

  const receitasPorDiaArray = Object.entries(receitasPorDia).map(([data, total]) => ({
    data,
    total,
  }));

  // Progresso mensal
  const diasDecorridos = currentDay;
  const diasRestantes = daysInMonth - currentDay;
  const mediaDiariaIdeal = totalReceitas > 0 ? totalReceitas / daysInMonth : 0;
  const percentualGasto = totalReceitas > 0 ? (totalGastos / totalReceitas) * 100 : 0;

  // Dicas de economia
  const dicasEconomia: string[] = [];

  if (categoriaQueMaisGasta && categoriaQueMaisGasta.percentual > 30) {
    dicasEconomia.push(
      `Você está gastando ${categoriaQueMaisGasta.percentual.toFixed(1)}% do seu orçamento em ${categoriaQueMaisGasta.categoria}. Considere reduzir esses gastos.`
    );
  }

  if (mediaDiariaGastos > mediaDiariaIdeal * 1.2) {
    dicasEconomia.push(
      `Sua média de gastos diários (R$ ${mediaDiariaGastos.toFixed(2)}) está ${((mediaDiariaGastos / mediaDiariaIdeal - 1) * 100).toFixed(1)}% acima do ideal. Tente reduzir gastos supérfluos.`
    );
  }

  if (diaSemanaQueMaisGasta && diaSemanaQueMaisGasta.total > totalGastos * 0.25) {
    dicasEconomia.push(
      `Você gasta mais nas ${diaSemanaQueMaisGasta.dia}s (R$ ${diaSemanaQueMaisGasta.total.toFixed(2)}). Planeje melhor suas compras nesse dia.`
    );
  }

  const topCategorias = categoriasRanked.slice(0, 5);

  // Check for categories with high variation
  topCategorias.forEach(cat => {
    if (cat.percentual > 20) {
      const transacoesCat = gastos.filter(t => t.categoria === cat.categoria);
      const mediaTransacao = cat.total / transacoesCat.length;
      
      if (mediaTransacao > mediaDiariaGastos * 2) {
        dicasEconomia.push(
          `Gastos com ${cat.categoria} têm valor médio alto (R$ ${mediaTransacao.toFixed(2)} por transação). Busque alternativas mais econômicas.`
        );
      }
    }
  });

  if (dicasEconomia.length === 0) {
    dicasEconomia.push('Parabéns! Seus gastos estão equilibrados este mês. Continue assim!');
  }

  return {
    mediaDiariaGastos,
    mediaDiariaReceitas,
    totalGastosMes: totalGastos,
    totalReceitasMes: totalReceitas,
    categoriaQueMaisGasta,
    diaSemanaQueMaisGasta,
    topCategorias,
    dicasEconomia,
    gastosPorDia: gastosPorDiaArray,
    receitasPorDia: receitasPorDiaArray,
    gastosPorDiaSemana,
    progressoMensal: {
      percentualGasto,
      diasDecorridos,
      diasRestantes,
      mediaDiariaAtual: mediaDiariaGastos,
      mediaDiariaIdeal,
    },
  };
}

export async function calculateSpendingProgress(
  userId: string,
  mes?: number,
  ano?: number
): Promise<{
  gastoAtual: number;
  limiteTotal: number;
  percentualUsado: number;
  status: 'seguro' | 'alerta' | 'perigo';
}> {
  const now = new Date();
  const targetMes = mes ?? now.getMonth() + 1;
  const targetAno = ano ?? now.getFullYear();

  // Get spending limits
  const limits = await storage.getSpendingLimits(userId);
  const activeLimits = limits.filter(l => l.ativo === 'sim');

  // Get monthly total limit
  const monthlyLimit = activeLimits.find(
    l => l.tipo === 'mensal_total' && 
    (l.mes === null || l.mes === targetMes) &&
    (l.ano === null || l.ano === targetAno)
  );

  if (!monthlyLimit) {
    return {
      gastoAtual: 0,
      limiteTotal: 0,
      percentualUsado: 0,
      status: 'seguro',
    };
  }

  // Calculate current spending
  const allTransactions = await storage.getTransacoes(userId);
  const monthTransactions = allTransactions.filter(t => {
    const date = new Date(t.dataReal);
    return (
      t.tipo === 'saida' &&
      date.getMonth() + 1 === targetMes &&
      date.getFullYear() === targetAno
    );
  });

  const gastoAtual = monthTransactions.reduce((sum, t) => sum + parseFloat(t.valor), 0);
  const limiteTotal = parseFloat(monthlyLimit.valorLimite);
  const percentualUsado = limiteTotal > 0 ? (gastoAtual / limiteTotal) * 100 : 0;

  let status: 'seguro' | 'alerta' | 'perigo' = 'seguro';
  if (percentualUsado >= 90) {
    status = 'perigo';
  } else if (percentualUsado >= 70) {
    status = 'alerta';
  }

  return {
    gastoAtual,
    limiteTotal,
    percentualUsado,
    status,
  };
}

// New premium analytics functions

export interface MonthlyComparison {
  mes: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

export interface CategoryBreakdown {
  categoria: string;
  total: number;
  percentual: number;
  transacoes: number;
  cor: string;
}

export interface PeriodSummary {
  totalReceitas: number;
  totalDespesas: number;
  totalEconomias: number;
  saldo: number;
  variacaoReceitas: number; // % vs período anterior
  variacaoDespesas: number; // % vs período anterior
  variacaoEconomias: number; // % vs período anterior
  variacaoSaldo: number; // % vs período anterior
  transacoesTotal: number;
}

export interface YearlyEvolution {
  ano: number;
  mes: number;
  mesNome: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

// Receitas x Despesas por Mês (últimos 12 meses)
export async function getMonthlyComparison(
  userId: string,
  months: number = 12
): Promise<MonthlyComparison[]> {
  const allTransactions = await storage.getTransacoes(userId);
  const now = new Date();
  const results: MonthlyComparison[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const targetMes = targetDate.getMonth() + 1;
    const targetAno = targetDate.getFullYear();

    const monthTransactions = allTransactions.filter(t => {
      const date = new Date(t.dataReal);
      return date.getMonth() + 1 === targetMes && date.getFullYear() === targetAno;
    });

    const receitas = monthTransactions
      .filter(t => t.tipo === 'entrada')
      .reduce((sum, t) => sum + parseFloat(t.valor), 0);

    const despesas = monthTransactions
      .filter(t => t.tipo === 'saida')
      .reduce((sum, t) => sum + parseFloat(t.valor), 0);

    const mesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    results.push({
      mes: `${mesNomes[targetMes - 1]}/${targetAno.toString().slice(2)}`,
      receitas,
      despesas,
      saldo: receitas - despesas,
    });
  }

  return results;
}

// Despesas por Categoria
export async function getExpensesByCategory(
  userId: string,
  mes?: number,
  ano?: number,
  startDate?: string,
  endDate?: string
): Promise<CategoryBreakdown[]> {
  let transactions: Transacao[];
  
  if (startDate && endDate) {
    // Use date range filter
    transactions = await storage.getTransacoesWithFilters(userId, {
      startDate,
      endDate,
      tipo: 'saida',
    });
  } else {
    // Fallback to month/year filter (backward compatibility)
    const now = new Date();
    const targetMes = mes ?? now.getMonth() + 1;
    const targetAno = ano ?? now.getFullYear();

    const allTransactions = await storage.getTransacoes(userId);
    transactions = allTransactions.filter(t => {
      const date = new Date(t.dataReal);
      return (
        t.tipo === 'saida' &&
        date.getMonth() + 1 === targetMes &&
        date.getFullYear() === targetAno
      );
    });
  }

  const categorias: Record<string, number> = {};
  const transacoesPorCategoria: Record<string, number> = {};

  transactions.forEach(t => {
    if (!categorias[t.categoria]) {
      categorias[t.categoria] = 0;
      transacoesPorCategoria[t.categoria] = 0;
    }
    categorias[t.categoria] += parseFloat(t.valor);
    transacoesPorCategoria[t.categoria]++;
  });

  const total = Object.values(categorias).reduce((sum, val) => sum + val, 0);

  // Cores da paleta de charts
  const coresPaleta = [
    '#F2994A', // Laranja (despesas)
    '#8B5CF6', // Roxo
    '#EC4899', // Rosa
    '#3B82F6', // Azul
    '#0AA298', // Teal
    '#F59E0B', // Amber
  ];

  return Object.entries(categorias)
    .map(([categoria, valor], index) => ({
      categoria,
      total: valor,
      percentual: total > 0 ? (valor / total) * 100 : 0,
      transacoes: transacoesPorCategoria[categoria],
      cor: coresPaleta[index % coresPaleta.length],
    }))
    .sort((a, b) => b.total - a.total);
}

// Receitas por Categoria
export async function getIncomeByCategory(
  userId: string,
  mes?: number,
  ano?: number
): Promise<CategoryBreakdown[]> {
  const now = new Date();
  const targetMes = mes ?? now.getMonth() + 1;
  const targetAno = ano ?? now.getFullYear();

  const allTransactions = await storage.getTransacoes(userId);
  const monthTransactions = allTransactions.filter(t => {
    const date = new Date(t.dataReal);
    return (
      t.tipo === 'entrada' &&
      date.getMonth() + 1 === targetMes &&
      date.getFullYear() === targetAno
    );
  });

  const categorias: Record<string, number> = {};
  const transacoesPorCategoria: Record<string, number> = {};

  monthTransactions.forEach(t => {
    if (!categorias[t.categoria]) {
      categorias[t.categoria] = 0;
      transacoesPorCategoria[t.categoria] = 0;
    }
    categorias[t.categoria] += parseFloat(t.valor);
    transacoesPorCategoria[t.categoria]++;
  });

  const total = Object.values(categorias).reduce((sum, val) => sum + val, 0);

  const coresPaleta = [
    '#0F9D58', // Esmeralda (receitas)
    '#0AA298', // Teal
    '#3B82F6', // Azul
    '#8B5CF6', // Roxo
    '#10B981', // Green
    '#06B6D4', // Cyan
  ];

  return Object.entries(categorias)
    .map(([categoria, valor], index) => ({
      categoria,
      total: valor,
      percentual: total > 0 ? (valor / total) * 100 : 0,
      transacoes: transacoesPorCategoria[categoria],
      cor: coresPaleta[index % coresPaleta.length],
    }))
    .sort((a, b) => b.total - a.total);
}

// Evolução Anual
export async function getYearlyEvolution(
  userId: string,
  ano?: number
): Promise<YearlyEvolution[]> {
  const targetAno = ano ?? new Date().getFullYear();
  const allTransactions = await storage.getTransacoes(userId);
  const mesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  
  const results: YearlyEvolution[] = [];

  for (let mes = 1; mes <= 12; mes++) {
    const monthTransactions = allTransactions.filter(t => {
      const date = new Date(t.dataReal);
      return date.getMonth() + 1 === mes && date.getFullYear() === targetAno;
    });

    const receitas = monthTransactions
      .filter(t => t.tipo === 'entrada')
      .reduce((sum, t) => sum + parseFloat(t.valor), 0);

    const despesas = monthTransactions
      .filter(t => t.tipo === 'saida')
      .reduce((sum, t) => sum + parseFloat(t.valor), 0);

    results.push({
      ano: targetAno,
      mes,
      mesNome: mesNomes[mes - 1],
      receitas,
      despesas,
      saldo: receitas - despesas,
    });
  }

  return results;
}

// Resumo do Período
export async function getPeriodSummary(
  userId: string,
  mes?: number,
  ano?: number
): Promise<PeriodSummary> {
  const now = new Date();
  const targetMes = mes ?? now.getMonth() + 1;
  const targetAno = ano ?? now.getFullYear();

  const allTransactions = await storage.getTransacoes(userId);

  // Current period
  const currentPeriod = allTransactions.filter(t => {
    const date = new Date(t.dataReal);
    return date.getMonth() + 1 === targetMes && date.getFullYear() === targetAno;
  });

  // Previous period (month before)
  const prevMes = targetMes === 1 ? 12 : targetMes - 1;
  const prevAno = targetMes === 1 ? targetAno - 1 : targetAno;
  const previousPeriod = allTransactions.filter(t => {
    const date = new Date(t.dataReal);
    return date.getMonth() + 1 === prevMes && date.getFullYear() === prevAno;
  });

  const totalReceitas = currentPeriod
    .filter(t => t.tipo === 'entrada')
    .reduce((sum, t) => sum + parseFloat(t.valor), 0);

  const totalDespesas = currentPeriod
    .filter(t => t.tipo === 'saida')
    .reduce((sum, t) => sum + parseFloat(t.valor), 0);

  const totalEconomias = currentPeriod
    .filter(t => t.tipo === 'economia')
    .reduce((sum, t) => sum + parseFloat(t.valor), 0);

  const prevReceitas = previousPeriod
    .filter(t => t.tipo === 'entrada')
    .reduce((sum, t) => sum + parseFloat(t.valor), 0);

  const prevDespesas = previousPeriod
    .filter(t => t.tipo === 'saida')
    .reduce((sum, t) => sum + parseFloat(t.valor), 0);

  const prevEconomias = previousPeriod
    .filter(t => t.tipo === 'economia')
    .reduce((sum, t) => sum + parseFloat(t.valor), 0);

  const saldoAtual = totalReceitas - totalDespesas - totalEconomias;
  const saldoAnterior = prevReceitas - prevDespesas - prevEconomias;

  const variacaoReceitas = prevReceitas > 0 
    ? ((totalReceitas - prevReceitas) / prevReceitas) * 100 
    : 0;

  const variacaoDespesas = prevDespesas > 0 
    ? ((totalDespesas - prevDespesas) / prevDespesas) * 100 
    : 0;

  const variacaoEconomias = prevEconomias > 0 
    ? ((totalEconomias - prevEconomias) / prevEconomias) * 100 
    : 0;

  // Calcular variação de saldo com tratamento especial para saldo anterior = 0
  let variacaoSaldo = 0;
  if (saldoAnterior !== 0) {
    variacaoSaldo = ((saldoAtual - saldoAnterior) / Math.abs(saldoAnterior)) * 100;
  } else if (saldoAtual > 0) {
    // Saldo anterior era 0 e agora é positivo: crescimento total
    variacaoSaldo = 100;
  } else if (saldoAtual < 0) {
    // Saldo anterior era 0 e agora é negativo: queda total
    variacaoSaldo = -100;
  }
  // Se ambos são 0, mantém variacaoSaldo = 0

  return {
    totalReceitas,
    totalDespesas,
    totalEconomias,
    saldo: saldoAtual,
    variacaoReceitas,
    variacaoDespesas,
    variacaoEconomias,
    variacaoSaldo,
    transacoesTotal: currentPeriod.length,
  };
}
