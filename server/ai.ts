import OpenAI from "openai";
import fs from "fs";
import { storage } from "./storage.js";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 segundos timeout global
  maxRetries: 2, // Retry automático
});

export interface TransacaoExtractedData {
  tipo: 'entrada' | 'saida';
  categoria: string;
  valor: number | null;
  dataReal: string;
  descricao: string;
  confianca: number;
}

export interface EventoExtractedData {
  isEvento: boolean;
  titulo?: string;
  descricao?: string;
  data?: string; // YYYY-MM-DD
  hora?: string; // HH:mm
  confianca: number;
}

/**
 * Classifica mensagem de texto e extrai dados financeiros
 */
export async function classifyTextMessage(text: string, userId: string): Promise<TransacaoExtractedData> {
  const today = new Date().toISOString().split('T')[0];

  // Primeiro, tentar extração rápida via regex para mensagens simples
  // Isso é muito mais rápido que chamar a IA para casos óbvios
  const quickResult = extractSimpleTransaction(text);
  if (quickResult.valor !== null && quickResult.confianca >= 0.8) {
    console.log("[AI] Extração rápida bem-sucedida, pulando chamada à IA");
    return quickResult;
  }

  // Buscar categorias customizadas do usuário
  const categoriasCustomizadas = await storage.getCategoriasCustomizadas(userId);
  const customCategoryNames = categoriasCustomizadas.map(c => `${c.emoji} ${c.nome}`).join(', ');

  const categoriasDisponiveis = customCategoryNames
    ? `Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Compras, Contas, Salário, Investimentos, Outros, ${customCategoryNames}`
    : 'Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Compras, Contas, Salário, Investimentos, Outros';

  const prompt = `Você é um assistente financeiro especializado em interpretar mensagens sobre transações financeiras no Brasil.

IMPORTANTE: Você DEVE extrair dados de QUALQUER mensagem que mencione dinheiro, valores ou transações financeiras. Seja flexível na interpretação.

Mensagem do usuário: "${text}"

Data de hoje: ${today}

REGRAS DE INTERPRETAÇÃO:
1. Se a mensagem menciona "recebi", "ganhei", "entrou", "pagou" (alguém pagou para o usuário), "cliente", "venda" → tipo = "entrada"
2. Se a mensagem menciona "gastei", "paguei", "comprei", "saiu", "despesa" → tipo = "saida"
3. QUALQUER número na mensagem deve ser considerado como valor potencial
4. Se não houver data específica, use a data de hoje
5. Se a mensagem menciona "cliente" → categoria provavelmente é "Salário" ou trabalho/serviço
6. Seja GENEROSO na interpretação - é melhor registrar do que ignorar

EXEMPLOS:
- "hoje recebi 100 de um cliente" → entrada, 100, Salário, "Recebimento de cliente"
- "recebi 50 reais" → entrada, 50, Salário
- "gastei 30 no almoço" → saida, 30, Alimentação
- "paguei 150 de luz" → saida, 150, Contas
- "vendi por 200" → entrada, 200, Salário

Retorne um JSON com:
- tipo: "entrada" ou "saida"
- categoria: ${categoriasDisponiveis}
- valor: número (SEMPRE tente extrair um número, mesmo que aproximado)
- dataReal: "${today}" (ou outra data se especificada)
- descricao: descrição clara da transação
- confianca: 0 a 1

IMPORTANTE: Retorne APENAS o nome da categoria (sem emoji). SEMPRE tente extrair um valor numérico.

Responda APENAS com JSON válido:
{
  "tipo": "entrada" | "saida",
  "categoria": "string",
  "valor": number,
  "dataReal": "YYYY-MM-DD",
  "descricao": "string",
  "confianca": number
}`;

  try {
    // Usar gpt-4o-mini para respostas mais rápidas com timeout reduzido
    const response = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-4o-mini", // Modelo mais rápido
        messages: [
          {
            role: "system",
            content: "Você é um especialista em análise financeira brasileira. Responda APENAS com JSON válido. SEMPRE extraia valores numéricos."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 300, // Reduzido para resposta mais rápida
        temperature: 0.2, // Mais determinístico
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 12000) // 12 segundos
      )
    ]) as any;

    const content = response.choices[0].message.content || "{}";
    const result = JSON.parse(content);
    
    // Validação robusta dos dados extraídos
    // Se validação falhar, tentar fallback imediatamente
    if (!result.tipo || (result.tipo !== 'entrada' && result.tipo !== 'saida')) {
      console.error("[AI] Tipo inválido:", result.tipo);
      console.log("[AI] Tentando fallback devido a tipo inválido...");
      return extractSimpleTransaction(text);
    }

    if (!result.valor || typeof result.valor !== 'number' || result.valor <= 0) {
      console.error("[AI] Valor inválido:", result.valor);
      console.log("[AI] Tentando fallback devido a valor inválido...");
      return extractSimpleTransaction(text);
    }

    if (!result.categoria || typeof result.categoria !== 'string') {
      result.categoria = 'Outros';
    }

    if (!result.descricao || typeof result.descricao !== 'string') {
      result.descricao = text.substring(0, 100); // Usar texto original como fallback
    }

    // Validar e corrigir data
    if (!result.dataReal || typeof result.dataReal !== 'string') {
      result.dataReal = new Date().toISOString().split('T')[0];
    } else {
      // Validar formato de data
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(result.dataReal)) {
        result.dataReal = new Date().toISOString().split('T')[0];
      }
    }

    return result as TransacaoExtractedData;
  } catch (error: any) {
    console.error("Erro ao classificar texto:", error);
    
    // SEMPRE tentar fallback quando houver erro
    console.log("[AI] Erro na classificação, tentando fallback...");
    try {
      return extractSimpleTransaction(text);
    } catch (fallbackError) {
      console.error("[AI] Fallback também falhou:", fallbackError);
      throw new Error("Falha ao processar mensagem de texto");
    }
  }
}

/**
 * Transcreve áudio e extrai dados financeiros
 */
export async function transcribeAndClassifyAudio(audioFilePath: string, userId: string): Promise<TransacaoExtractedData> {
  try {
    // Transcrever áudio usando Whisper
    const audioReadStream = fs.createReadStream(audioFilePath);
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: "whisper-1",
    });

    const text = transcription.text;
    console.log("Áudio transcrito:", text);

    // Classificar o texto transcrito
    return await classifyTextMessage(text, userId);
  } catch (error) {
    console.error("Erro ao transcrever áudio:", error);
    throw new Error("Falha ao processar áudio");
  }
}

/**
 * Analisa imagem (boleto, nota fiscal, fatura) e extrai dados financeiros
 */
export async function analyzeImageForFinancialData(imageBase64: string): Promise<TransacaoExtractedData> {
  const today = new Date().toISOString().split('T')[0];

  try {
    // Timeout wrapper
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout ao processar imagem")), 30000)
    );

    const apiPromise = openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é um especialista em OCR e análise de documentos financeiros. Extraia informações de boletos, notas fiscais, faturas e comprovantes."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analise esta imagem de documento financeiro (boleto, nota fiscal, fatura ou comprovante) e extraia:

Data de hoje: ${today}

Retorne um JSON com:
- tipo: "entrada" (se for um recebimento/crédito) ou "saida" (se for um pagamento/débito)
- categoria: uma das opções: Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Compras, Contas, Salário, Investimentos, Outros
- valor: valor total identificado (número com 2 casas decimais, ou null se não encontrado)
- dataReal: data de vencimento ou emissão (formato YYYY-MM-DD, use hoje se não encontrada)
- descricao: descrição do que foi identificado (estabelecimento, serviço, produto, etc)
- confianca: número de 0 a 1 indicando sua confiança na leitura

Responda APENAS com JSON válido.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1000,
      temperature: 0.3,
    });

    const response = await Promise.race([apiPromise, timeoutPromise]) as any;
    const content = response.choices[0].message.content || "{}";
    const result = JSON.parse(content);
    
    // Validação
    if (!result.tipo || (result.tipo !== 'entrada' && result.tipo !== 'saida')) {
      result.tipo = 'saida'; // Default para despesa
    }
    if (!result.valor || typeof result.valor !== 'number' || result.valor <= 0) {
      throw new Error("Valor não identificado na imagem");
    }
    if (!result.categoria) result.categoria = 'Outros';
    if (!result.descricao) result.descricao = 'Documento financeiro';
    if (!result.dataReal) result.dataReal = today;
    
    return result as TransacaoExtractedData;
  } catch (error: any) {
    console.error("Erro ao analisar imagem:", error);
    throw new Error("Falha ao processar imagem");
  }
}

/**
 * Analisa vídeo (extrai frames e sumariza informações financeiras)
 */
export async function analyzeVideoForFinancialData(videoFrameBase64: string): Promise<TransacaoExtractedData> {
  // Para vídeos, vamos analisar um frame extraído como se fosse uma imagem
  // Em produção, você poderia extrair múltiplos frames e consolidar os dados
  return await analyzeImageForFinancialData(videoFrameBase64);
}

/**
 * Detecta rapidamente se uma mensagem pode ser um evento (pré-filtro local)
 */
function quickEventDetection(text: string): { isLikelyEvent: boolean; keywords: string[] } {
  const lowerText = text.toLowerCase();

  const eventKeywords = [
    'reunião', 'reuniao', 'meeting', 'consulta', 'compromisso',
    'lembrete', 'lembrar', 'não esquecer', 'nao esquecer', 'não esquece', 'nao esquece',
    'agendar', 'agendamento', 'agenda', 'marcar', 'marcado',
    'evento', 'encontro', 'entrevista', 'apresentação', 'apresentacao',
    'dentista', 'médico', 'medico', 'exame', 'prova',
    'aniversário', 'aniversario', 'festa', 'casamento',
    'voo', 'viagem', 'hotel', 'reserva',
    'prazo', 'deadline', 'vencimento', 'pagar dia', 'vence dia'
  ];

  const timeKeywords = [
    'às', 'as', 'hora', 'h', 'manhã', 'manha', 'tarde', 'noite',
    'amanhã', 'amanha', 'depois de amanhã', 'semana que vem',
    'segunda', 'terça', 'terca', 'quarta', 'quinta', 'sexta', 'sábado', 'sabado', 'domingo',
    'dia', 'próximo', 'proximo', 'próxima', 'proxima'
  ];

  const foundEventKw = eventKeywords.filter(kw => lowerText.includes(kw));
  const foundTimeKw = timeKeywords.filter(kw => lowerText.includes(kw));

  // É provável ser evento se tem palavra-chave de evento OU combinação de tempo + contexto
  const isLikelyEvent = foundEventKw.length > 0 || (foundTimeKw.length >= 2);

  return { isLikelyEvent, keywords: [...foundEventKw, ...foundTimeKw] };
}

/**
 * Extrai data de texto em português
 */
function extractDateFromText(text: string): string | null {
  const today = new Date();
  const lowerText = text.toLowerCase();

  // Hoje
  if (lowerText.includes('hoje')) {
    return today.toISOString().split('T')[0];
  }

  // Amanhã
  if (lowerText.includes('amanhã') || lowerText.includes('amanha')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  // Depois de amanhã
  if (lowerText.includes('depois de amanhã') || lowerText.includes('depois de amanha')) {
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    return dayAfter.toISOString().split('T')[0];
  }

  // Dia específico do mês: "dia 15", "no dia 20"
  const diaMatch = lowerText.match(/(?:dia|no dia)\s*(\d{1,2})/);
  if (diaMatch) {
    const dia = parseInt(diaMatch[1]);
    const result = new Date(today.getFullYear(), today.getMonth(), dia);
    // Se o dia já passou, assume próximo mês
    if (result < today) {
      result.setMonth(result.getMonth() + 1);
    }
    return result.toISOString().split('T')[0];
  }

  // Dias da semana
  const diasSemana = ['domingo', 'segunda', 'terça', 'terca', 'quarta', 'quinta', 'sexta', 'sábado', 'sabado'];
  for (let i = 0; i < diasSemana.length; i++) {
    if (lowerText.includes(diasSemana[i])) {
      const targetDay = i < 2 ? i : Math.floor(i / 2) + (i % 2); // Ajustar para índice correto
      const currentDay = today.getDay();
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7; // Próxima semana
      const result = new Date(today);
      result.setDate(result.getDate() + daysToAdd);
      return result.toISOString().split('T')[0];
    }
  }

  return null;
}

/**
 * Extrai hora de texto
 */
function extractTimeFromText(text: string): string | null {
  const lowerText = text.toLowerCase();

  // Padrão: "às 15h", "as 15:30", "15h30", "às 15 horas"
  const timeMatch = lowerText.match(/(?:às|as|,)?\s*(\d{1,2})(?::|\s*h\s*|h)(\d{2})?\s*(?:horas?|h)?/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  }

  // Períodos do dia
  if (lowerText.includes('manhã') || lowerText.includes('manha')) return '09:00';
  if (lowerText.includes('meio-dia') || lowerText.includes('meio dia')) return '12:00';
  if (lowerText.includes('tarde')) return '14:00';
  if (lowerText.includes('noite')) return '19:00';

  return null;
}

/**
 * Detecta se uma mensagem é sobre um evento/compromisso e extrai dados
 * OTIMIZADO: Primeiro tenta detecção local, só chama IA se necessário
 */
export async function detectEventoInMessage(text: string): Promise<EventoExtractedData> {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // ========================================
  // ETAPA 1: PRÉ-FILTRO RÁPIDO LOCAL
  // ========================================
  const quickCheck = quickEventDetection(text);

  // Se não parece ser evento, retornar imediatamente
  if (!quickCheck.isLikelyEvent) {
    return { isEvento: false, confianca: 0 };
  }

  // ========================================
  // ETAPA 2: TENTAR EXTRAÇÃO LOCAL
  // ========================================
  const extractedDate = extractDateFromText(text);
  const extractedTime = extractTimeFromText(text);

  // Se conseguiu extrair data/hora localmente, usar isso
  if (extractedDate && quickCheck.keywords.length > 0) {
    // Gerar título baseado nas keywords encontradas
    let titulo = text.substring(0, 50).trim();
    if (titulo.length > 40) titulo = titulo.substring(0, 40) + '...';

    return {
      isEvento: true,
      titulo,
      descricao: text,
      data: extractedDate,
      hora: extractedTime || undefined,
      confianca: 0.8,
    };
  }

  // ========================================
  // ETAPA 3: CHAMAR IA APENAS SE NECESSÁRIO
  // ========================================
  const prompt = `Analise se esta mensagem é um EVENTO/COMPROMISSO/LEMBRETE que precisa ser agendado:

"${text}"

Data de hoje: ${todayStr}

IMPORTANTE:
- Se for sobre DINHEIRO/TRANSAÇÃO FINANCEIRA, retorne isEvento: false
- Só retorne isEvento: true se for um compromisso, reunião, consulta, lembrete de algo a fazer

JSON esperado:
{
  "isEvento": boolean,
  "titulo": "string curto",
  "data": "YYYY-MM-DD",
  "hora": "HH:mm ou null",
  "confianca": 0-1
}`;

  try {
    const response = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-4o-mini", // Usar modelo mais rápido
        messages: [
          { role: "system", content: "Detecte eventos/compromissos. Responda apenas JSON." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 200,
        temperature: 0.3,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 8000)
      )
    ]) as any;

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      isEvento: result.isEvento || false,
      titulo: result.titulo,
      descricao: result.descricao,
      data: result.data,
      hora: result.hora,
      confianca: result.confianca || 0,
    } as EventoExtractedData;
  } catch (error) {
    console.error("Erro ao detectar evento:", error);
    // Se IA falhou mas temos dados locais, usar eles
    if (extractedDate) {
      return {
        isEvento: true,
        titulo: text.substring(0, 50),
        data: extractedDate,
        hora: extractedTime || undefined,
        confianca: 0.6,
      };
    }
    return { isEvento: false, confianca: 0 };
  }
}

/**
 * Extração simples via regex (fallback quando IA falha)
 * OTIMIZADO para máxima performance e detecção
 */
export function extractSimpleTransaction(text: string): TransacaoExtractedData {
  const today = new Date().toISOString().split('T')[0];
  const lowerText = text.toLowerCase().trim();
  const originalText = text.trim();

  // ========================================
  // EXTRAIR VALOR - MÚLTIPLOS PADRÕES
  // ========================================
  let valor: number | null = null;

  // Padrão 1: "R$ 100", "R$100", "R$ 100,00", "R$100.00"
  const valorMatch1 = text.match(/r\$\s*(\d+(?:[.,]\d{1,2})?)/i);
  if (valorMatch1) {
    valor = parseFloat(valorMatch1[1].replace(',', '.'));
  }

  // Padrão 2: "100 reais", "100reais", "100 real"
  if (!valor) {
    const valorMatch2 = text.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:reais?|real)/i);
    if (valorMatch2) {
      valor = parseFloat(valorMatch2[1].replace(',', '.'));
    }
  }

  // Padrão 3: Número após palavras-chave de valor
  if (!valor) {
    const valorMatch3 = lowerText.match(/(?:recebi|ganhei|gastei|paguei|comprei|vendi|entrou|saiu|de|por)\s+(\d+(?:[.,]\d{1,2})?)/);
    if (valorMatch3) {
      valor = parseFloat(valorMatch3[1].replace(',', '.'));
    }
  }

  // Padrão 4: Qualquer número no texto (último recurso, mas confiável para números isolados)
  if (!valor) {
    // Pegar o primeiro número que pareça um valor monetário (>= 1)
    const allNumbers = text.match(/\d+(?:[.,]\d{1,2})?/g);
    if (allNumbers) {
      for (const num of allNumbers) {
        const parsed = parseFloat(num.replace(',', '.'));
        if (parsed >= 1) { // Ignorar números muito pequenos como IDs
          valor = parsed;
          break;
        }
      }
    }
  }

  // ========================================
  // DETECTAR TIPO (ENTRADA/SAÍDA)
  // ========================================
  const entradaKeywords = [
    'recebi', 'ganhei', 'entrou', 'entrada', 'salário', 'salario',
    'pagamento recebido', 'crédito', 'credito', 'depositei', 'depósito', 'deposito',
    'cliente pagou', 'me pagou', 'pagou-me', 'venda', 'vendi', 'lucro',
    'renda', 'provento', 'recebimento', 'freelance', 'freela', 'serviço',
    'de um cliente', 'do cliente', 'cliente'
  ];

  const saidaKeywords = [
    'gastei', 'paguei', 'comprei', 'despesa', 'saída', 'saida',
    'débito', 'debito', 'gasto', 'compra', 'pagamento de', 'pagar',
    'conta de', 'boleto', 'fatura', 'dívida', 'divida', 'parcela',
    'prestação', 'prestacao', 'aluguel', 'mensalidade'
  ];

  let entradaScore = 0;
  let saidaScore = 0;

  for (const kw of entradaKeywords) {
    if (lowerText.includes(kw)) {
      entradaScore += kw.length; // Palavras mais longas são mais específicas
    }
  }

  for (const kw of saidaKeywords) {
    if (lowerText.includes(kw)) {
      saidaScore += kw.length;
    }
  }

  // Se menciona "cliente" é muito provável que seja entrada
  if (lowerText.includes('cliente')) {
    entradaScore += 20;
  }

  let tipo: 'entrada' | 'saida';
  if (entradaScore > saidaScore) {
    tipo = 'entrada';
  } else if (saidaScore > entradaScore) {
    tipo = 'saida';
  } else {
    // Default: se tem "recebi/ganhei" é entrada, senão saída
    tipo = lowerText.includes('recebi') || lowerText.includes('ganhei') ? 'entrada' : 'saida';
  }

  // ========================================
  // CATEGORIA
  // ========================================
  const categoriaMap: Record<string, string> = {
    // Alimentação
    'almoço': 'Alimentação', 'almoco': 'Alimentação', 'jantar': 'Alimentação',
    'café': 'Alimentação', 'cafe': 'Alimentação', 'lanche': 'Alimentação',
    'comida': 'Alimentação', 'restaurante': 'Alimentação', 'ifood': 'Alimentação',
    'mercado': 'Alimentação', 'supermercado': 'Alimentação', 'padaria': 'Alimentação',
    'açougue': 'Alimentação', 'acougue': 'Alimentação', 'feira': 'Alimentação',

    // Transporte
    'gasolina': 'Transporte', 'combustível': 'Transporte', 'combustivel': 'Transporte',
    'uber': 'Transporte', '99': 'Transporte', 'taxi': 'Transporte',
    'ônibus': 'Transporte', 'onibus': 'Transporte', 'metrô': 'Transporte',
    'passagem': 'Transporte', 'estacionamento': 'Transporte', 'pedágio': 'Transporte',

    // Contas
    'luz': 'Contas', 'energia': 'Contas', 'água': 'Contas', 'agua': 'Contas',
    'internet': 'Contas', 'telefone': 'Contas', 'celular': 'Contas',
    'gás': 'Contas', 'gas': 'Contas', 'condomínio': 'Contas', 'condominio': 'Contas',
    'aluguel': 'Moradia', 'iptu': 'Contas', 'ipva': 'Contas',

    // Salário/Entrada
    'cliente': 'Salário', 'salário': 'Salário', 'salario': 'Salário',
    'venda': 'Salário', 'recebimento': 'Salário', 'freelance': 'Salário',
    'freela': 'Salário', 'serviço': 'Salário', 'servico': 'Salário',
    'comissão': 'Salário', 'comissao': 'Salário', 'pagamento': 'Salário',

    // Saúde
    'médico': 'Saúde', 'medico': 'Saúde', 'farmácia': 'Saúde', 'farmacia': 'Saúde',
    'remédio': 'Saúde', 'remedio': 'Saúde', 'consulta': 'Saúde', 'exame': 'Saúde',
    'hospital': 'Saúde', 'dentista': 'Saúde', 'plano de saúde': 'Saúde',

    // Lazer
    'cinema': 'Lazer', 'show': 'Lazer', 'festa': 'Lazer', 'bar': 'Lazer',
    'cerveja': 'Lazer', 'viagem': 'Lazer', 'passeio': 'Lazer', 'netflix': 'Lazer',
    'spotify': 'Lazer', 'streaming': 'Lazer', 'jogo': 'Lazer', 'game': 'Lazer',

    // Compras
    'roupa': 'Compras', 'sapato': 'Compras', 'tênis': 'Compras', 'tenis': 'Compras',
    'shopping': 'Compras', 'loja': 'Compras', 'presente': 'Compras',
    'amazon': 'Compras', 'mercado livre': 'Compras', 'shopee': 'Compras',

    // Educação
    'curso': 'Educação', 'escola': 'Educação', 'faculdade': 'Educação',
    'livro': 'Educação', 'mensalidade': 'Educação', 'material': 'Educação',
  };

  let categoria = tipo === 'entrada' ? 'Salário' : 'Outros';
  for (const [keyword, cat] of Object.entries(categoriaMap)) {
    if (lowerText.includes(keyword)) {
      categoria = cat;
      break;
    }
  }

  // ========================================
  // GERAR DESCRIÇÃO
  // ========================================
  let descricao = originalText.substring(0, 100);

  // Tentar gerar descrição mais limpa
  if (tipo === 'entrada' && lowerText.includes('cliente')) {
    descricao = 'Recebimento de cliente';
  } else if (tipo === 'entrada' && (lowerText.includes('recebi') || lowerText.includes('ganhei'))) {
    descricao = originalText.replace(/hoje|ontem|agora/gi, '').trim().substring(0, 100) || 'Recebimento';
  }

  // ========================================
  // CALCULAR CONFIANÇA
  // ========================================
  let confianca = 0.5; // Base

  if (valor !== null && valor > 0) {
    confianca += 0.2; // Valor encontrado
  }

  if (entradaScore > 0 || saidaScore > 0) {
    confianca += 0.15; // Tipo detectado com keywords
  }

  if (categoria !== 'Outros' && categoria !== 'Salário') {
    confianca += 0.1; // Categoria específica encontrada
  }

  // Boost para padrões muito claros
  if (lowerText.match(/recebi\s+\d+/) || lowerText.match(/gastei\s+\d+/)) {
    confianca = Math.min(confianca + 0.2, 0.95);
  }

  // Se não encontrou valor
  if (!valor || valor <= 0) {
    console.log("[Fallback] Valor não encontrado na mensagem:", text);
    return {
      tipo,
      categoria,
      valor: null,
      dataReal: today,
      descricao,
      confianca: 0.2,
    };
  }

  console.log(`[Fallback] Extraído: tipo=${tipo}, valor=${valor}, categoria=${categoria}, confiança=${confianca}`);

  return {
    tipo,
    categoria,
    valor,
    dataReal: today,
    descricao,
    confianca,
  };
}

/**
 * Processa mensagem do WhatsApp com base no tipo (com retry)
 */
export async function processWhatsAppMessage(
  messageType: 'text' | 'audio' | 'image' | 'video',
  content: string, // pode ser texto, base64, ou caminho de arquivo
  userId: string
): Promise<TransacaoExtractedData> {
  const maxRetries = 2;
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      switch (messageType) {
        case 'text':
          return await classifyTextMessage(content, userId);
        
        case 'audio':
          return await transcribeAndClassifyAudio(content, userId);
        
        case 'image':
          return await analyzeImageForFinancialData(content);
        
        case 'video':
          return await analyzeVideoForFinancialData(content);
        
        default:
          throw new Error("Tipo de mensagem não suportado");
      }
    } catch (error: any) {
      lastError = error;
      console.error(`[AI] Tentativa ${attempt + 1}/${maxRetries} falhou:`, error.message);
      
      // Se for última tentativa e for texto, tentar extração simples
      if (attempt === maxRetries - 1 && messageType === 'text') {
        console.log("[AI] Usando extração simples como fallback...");
        return extractSimpleTransaction(content);
      }
      
      // Aguardar antes de retry (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  
  throw lastError || new Error("Falha ao processar mensagem");
}

/**
 * Tipos de resposta que podem ser geradas
 */
export type AIResponseType =
  | "transacao_registrada"
  | "pedir_email"
  | "pedir_email_inicial"
  | "erro_geral"
  | "erro_processamento"
  | "edicao_iniciada"
  | "edicao_concluida"
  | "exclusao_confirmada"
  | "transacao_nao_entendida"
  | "boas_vindas_autenticado"
  | "assinatura_inativa"
  | "email_nao_encontrado"
  | "video_nao_suportado"
  | "rate_limit_excedido"
  | "senha_temporaria_enviada"
  | "erro_download_midia"
  | "erro_processar_midia"
  | "erro_inesperado";

/**
 * Dados para geração de resposta IA
 */
export interface AIResponseData {
  user?: {
    id?: string;
    firstName?: string | null;
    email?: string | null;
  };
  transaction?: {
    id?: string;
    tipo?: string;
    valor?: string;
    categoria?: string;
    descricao?: string;
    data?: string;
  };
  error?: string;
  context?: Record<string, any>;
}

/**
 * Gera uma resposta humanizada e personalizada usando IA
 */
export async function generateAIResponse(
  type: AIResponseType,
  data: AIResponseData = {}
): Promise<string> {
  const userName = data.user?.firstName || "amigo(a)";
  const userEmail = data.user?.email || null;

  let prompt = "";

  switch (type) {
    case "transacao_registrada": {
      const trans = data.transaction;
      const tipoTexto = trans?.tipo === "entrada" ? "entrada" : "saída";
      
      prompt = `O usuário ${userName} acaba de registrar uma transação financeira.

Dados da transação:
- Tipo: ${tipoTexto}
- Categoria: ${trans?.categoria || "N/A"}
- Descrição: ${trans?.descricao || "N/A"}

Crie APENAS uma headline curta e natural confirmando o registro.

Instruções:
- Use o nome "${userName}" no início
- Seja breve (máximo 1-2 frases curtas)
- Seja natural, empático e celebrativo
- Não mencione detalhes como valor, categoria ou data (o servidor adiciona depois)
- Não use emojis (o servidor adiciona)
- Não use estrutura ou formatação
- Apenas a headline: exemplo "Mateus, ótimo registro!" ou "Perfeito, transação anotada!"

Responda APENAS com a headline, sem aspas, emojis ou formatação extra.`;
      break;
    }

    case "pedir_email":
    case "pedir_email_inicial": {
      prompt = `O usuário ${userName} precisa fornecer seu email para liberar o acesso.

Crie APENAS uma headline curta e gentil pedindo o email.

Instruções:
- Use o nome "${userName}" quando possível
- Seja gentil e respeitoso, não frio
- Não pareça urgente ou pressionante
- Seja breve (máximo 1-2 frases)
- Não use emojis (o servidor adiciona)
- Não use estrutura ou formatação
- Apenas a headline: exemplo "Oi! Me informa seu email cadastrado?" ou "Preciso do seu email para liberar o acesso"

Responda APENAS com a headline, sem aspas, emojis ou formatação extra.`;
      break;
    }

    case "erro_geral":
    case "erro_processamento": {
      const rateLimit = data.context?.rateLimit;
      const sessionError = data.context?.sessionError;
      
      let contextInfo = "";
      if (rateLimit) {
        contextInfo = " O usuário está enviando muitas mensagens muito rápido.";
      } else if (sessionError) {
        contextInfo = " Houve um problema com a sessão do usuário.";
      }
      
      prompt = `Ocorreu um problema${contextInfo}

Crie APENAS uma headline curta e humana para o usuário ${userName}.

Instruções:
- Use o nome "${userName}"
- Seja empático, não técnico
- ${rateLimit ? "Peça gentilmente para aguardar um momento" : sessionError ? "Peça para fornecer o email novamente" : "Peça para tentar novamente de forma acolhedora"}
- Seja breve (máximo 1-2 frases)
- Não use emojis (o servidor adiciona)
- Não use estrutura ou formatação
- Apenas a headline: exemplo "Opa, ${userName}! Aguarde um momento, por favor" ou "Ops, aconteceu algo. Pode tentar novamente?"

Responda APENAS com a headline, sem aspas, emojis ou formatação extra.`;
      break;
    }

    case "edicao_iniciada": {
      prompt = `O usuário ${userName} quer editar uma transação.

Crie APENAS uma headline curta pedindo as novas informações.

Instruções:
- Use o nome "${userName}"
- Peça de forma clara mas gentil as novas informações
- Seja breve (máximo 1-2 frases)
- Não use emojis (o servidor adiciona)
- Não use estrutura ou formatação
- Apenas a headline: exemplo "Claro! Me diga as novas informações da transação" ou "Perfeito, me passa os dados atualizados"

Responda APENAS com a headline, sem aspas, emojis ou formatação extra.`;
      break;
    }

    case "edicao_concluida": {
      const trans = data.transaction;
      const tipoTexto = trans?.tipo === "entrada" ? "entrada" : "saída";
      
      prompt = `O usuário ${userName} acabou de editar uma transação.

Dados da transação editada:
- Tipo: ${tipoTexto}
- Categoria: ${trans?.categoria || "N/A"}
- Descrição: ${trans?.descricao || "N/A"}

Crie APENAS uma headline curta confirmando a edição.

Instruções:
- Use o nome "${userName}"
- Confirme a edição de forma carinhosa
- Seja breve (máximo 1-2 frases)
- Não mencione detalhes como valor, categoria ou data (o servidor adiciona depois)
- Não use emojis (o servidor adiciona)
- Não use estrutura ou formatação
- Apenas a headline: exemplo "${userName}, transação atualizada!" ou "Perfeito, edição salva!"

Responda APENAS com a headline, sem aspas, emojis ou formatação extra.`;
      break;
    }

    case "exclusao_confirmada": {
      prompt = `O usuário ${userName} acabou de excluir uma transação.

Crie APENAS uma headline curta confirmando a exclusão.

Instruções:
- Use o nome "${userName}"
- Seja elegante e direto
- Confirme que foi excluída
- Seja breve (máximo 1-2 frases)
- Não use emojis (o servidor adiciona)
- Não use estrutura ou formatação
- Apenas a headline: exemplo "Transação excluída com sucesso!" ou "Perfeito, ${userName}! Removido!"

Responda APENAS com a headline, sem aspas, emojis ou formatação extra.`;
      break;
    }

    case "transacao_nao_entendida": {
      prompt = `O usuário ${userName} enviou uma mensagem que você não conseguiu entender como transação.

Crie APENAS uma headline curta pedindo para reenviar de forma clara.

Instruções:
- Use o nome "${userName}"
- Seja paciente e acolhedor
- Peça para reenviar informação de forma clara
- Seja breve (máximo 1-2 frases)
- Não use emojis (o servidor adiciona)
- Não use estrutura ou formatação
- Apenas a headline: exemplo "Não consegui entender, ${userName}. Pode repetir?" ou "Ops, não ficou claro. Me explica de novo?"

Responda APENAS com a headline, sem aspas, emojis ou formatação extra.`;
      break;
    }

    case "boas_vindas_autenticado": {
      const passwordPending = data.context?.passwordPending;
      const passwordInfo = passwordPending 
        ? "\n\nIMPORTANTE: Seus dados de login serão enviados em breve. Acesse seu painel em https://anotatudo.com/login. Se não receber a senha, entre em contato com o suporte."
        : "";
      
      prompt = `Você é um assistente financeiro simpático e carinhoso do AnotaTudo.AI, conversando via WhatsApp.

O usuário ${userName} acabou de ser autenticado com sucesso. Dê boas-vindas e explique que pode começar a enviar transações.${passwordInfo}

Instruções:
- Use o nome "${userName}"
- Seja caloroso e acolhedor
- Explique que pode começar a enviar transações
- Dê exemplos breves (texto, foto, áudio)
- ${passwordPending ? "Mencione que os dados de login serão enviados em breve e forneça o link do painel" : ""}
- Use emojis de expressão positiva: 😊🙌✨🎉
- VARIE os emojis - nunca repita os mesmos
- MÁXIMO de 3-4 emojis na mensagem
- Use emojis de forma natural e calorosa
- Tom: caloroso, simpático, encorajador
- Variação: nunca pareça robô repetitivo - cada resposta deve ser única e acolhedora
- Não seja muito longo ou formal

Responda APENAS com o texto da mensagem, sem aspas ou formatação extra.`;
      break;
    }

    case "assinatura_inativa": {
      const statusMessage = data.context?.statusMessage || "inativa";
      const blocked = data.context?.blocked;
      
      let situationDesc = "";
      if (blocked) {
        situationDesc = `O acesso do usuário ${userName} está bloqueado.`;
      } else {
        situationDesc = `O usuário ${userName} tem uma assinatura ${statusMessage}.`;
      }
      
      prompt = `Você é um assistente financeiro simpático e carinhoso do AnotaTudo.AI, conversando via WhatsApp.

${situationDesc} Informe de forma empática e sugira entrar em contato com suporte para resolver.

Instruções:
- Use o nome "${userName}"
- Seja empático, não frio ou acusativo
- ${blocked ? "Informe que o acesso está bloqueado" : `Informe que a assinatura está ${statusMessage}`}
- Sugira entrar em contato com suporte para resolver
- Use emojis de expressão empática: 🙂😊🙏
- VARIE os emojis - nunca repita os mesmos
- MÁXIMO de 2-3 emojis na mensagem
- Use emojis de forma natural e empática
- Tom: empático, acolhedor, profissional
- Variação: nunca pareça robô repetitivo - cada resposta deve ser única

Responda APENAS com o texto da mensagem, sem aspas ou formatação extra.`;
      break;
    }

    case "email_nao_encontrado": {
      prompt = `Você é um assistente financeiro simpático e carinhoso do AnotaTudo.AI, conversando via WhatsApp.

O email fornecido pelo usuário ${userName} não foi encontrado. Informe de forma gentil e peça para verificar ou tentar novamente.

Instruções:
- Use o nome "${userName}" quando possível
- Seja gentil, não acusativo
- Peça para verificar o email
- Ofereça ajuda
- Use emojis de expressão empática: 🙂😊🤔✨
- VARIE os emojis - nunca repita os mesmos
- MÁXIMO de 2-3 emojis na mensagem
- Use emojis de forma natural e gentil
- Tom: gentil, paciente, acolhedor
- Variação: nunca pareça robô repetitivo - cada resposta deve ser única

Responda APENAS com o texto da mensagem, sem aspas ou formatação extra.`;
      break;
    }

    default: {
      prompt = `Você é um assistente financeiro simpático e carinhoso do AnotaTudo.AI, conversando via WhatsApp.

Crie uma mensagem apropriada para a situação.

Instruções:
- Seja simpático, leve e natural
- Use o nome do usuário quando disponível
- Use emojis de forma natural e coerente com o contexto
- VARIE os emojis - nunca repita os mesmos
- MÁXIMO de 3-4 emojis na mensagem
- Não force emojis se ficar estranho
- Não seja repetitivo
- Tom: profissional mas carinhoso
- Cada resposta deve ser única e humanizada

Responda APENAS com o texto da mensagem, sem aspas ou formatação extra.`;
    }

    case "video_nao_suportado": {
      prompt = `O usuário ${userName} enviou um vídeo, mas ainda não conseguimos processar vídeos.

Crie APENAS uma headline curta informando isso e sugerindo alternativas.

Instruções:
- Use o nome "${userName}"
- Seja empático e acolhedor
- Sugira alternativas: texto, áudio ou foto
- Seja breve (máximo 1-2 frases)
- Não use emojis (o servidor adiciona)
- Não use estrutura ou formatação
- Apenas a headline: exemplo "Oi ${userName}! Ainda não consigo processar vídeos. Pode enviar como texto ou foto?"

Responda APENAS com a headline, sem aspas, emojis ou formatação extra.`;
      break;
    }

    case "rate_limit_excedido": {
      prompt = `O usuário ${userName} está enviando mensagens muito rapidamente.

Crie APENAS uma headline curta pedindo para aguardar um momento.

Instruções:
- Use o nome "${userName}"
- Seja gentil e compreensivo
- Peça para aguardar um momento
- Seja breve (máximo 1-2 frases)
- Não use emojis (o servidor adiciona)
- Não use estrutura ou formatação
- Apenas a headline: exemplo "Aguarde um momento, ${userName}!" ou "Um instante, por favor!"

Responda APENAS com a headline, sem aspas, emojis ou formatação extra.`;
      break;
    }

    case "senha_temporaria_enviada": {
      const email = data.context?.email || "";
      const tempPassword = data.context?.tempPassword || "";
      const domain = data.context?.domain || "anotatudo.replit.app";
      
      prompt = `Você é um assistente financeiro simpático e carinhoso do AnotaTudo.AI, conversando via WhatsApp.

O usuário ${userName} acabou de ter o acesso liberado. Envie uma mensagem calorosa confirmando o acesso, incluindo email, senha temporária e link para acessar o dashboard. Importante: mencione que deve trocar a senha após o primeiro login.

Dados:
- Email: ${email}
- Senha temporária: ${tempPassword}
- Link: ${domain}

Instruções:
- Use o nome "${userName}"
- Seja caloroso e acolhedor
- Informe que o acesso foi liberado
- Mencione que as transações via WhatsApp aparecem automaticamente no dashboard
- Informe email, senha temporária e link
- AVISE sobre trocar a senha após primeiro login
- Dê exemplos de como começar a enviar transações (texto, foto, áudio)
- Use emojis de forma natural e celebrativa: ✅😊🎉📱
- VARIE os emojis - nunca repita os mesmos
- MÁXIMO de 4-5 emojis na mensagem (pode usar mais por ser mensagem de boas-vindas)
- Tom: caloroso, acolhedor, útil, encorajador
- Variação: nunca pareça robô repetitivo - cada resposta deve ser única

Responda APENAS com o texto da mensagem, sem aspas ou formatação extra.`;
      break;
    }

    case "erro_download_midia": {
      prompt = `Ocorreu um erro ao baixar a mídia que o usuário ${userName} enviou.

Crie APENAS uma headline curta informando isso e pedindo para tentar novamente.

Instruções:
- Use o nome "${userName}"
- Seja empático, não técnico
- Peça para tentar enviar novamente
- Seja breve (máximo 1-2 frases)
- Não use emojis (o servidor adiciona)
- Não use estrutura ou formatação
- Apenas a headline: exemplo "Ops, ${userName}! Tive um problema. Pode tentar de novo?"

Responda APENAS com a headline, sem aspas, emojis ou formatação extra.`;
      break;
    }

    case "erro_processar_midia": {
      const messageType = data.context?.messageType || "mídia";
      const messageTypeText = messageType === 'text' ? 'mensagem' : messageType === 'audio' ? 'áudio' : messageType === 'image' ? 'foto' : 'mídia';
      
      prompt = `Ocorreu um erro ao processar o ${messageTypeText} que o usuário ${userName} enviou.

Crie APENAS uma headline curta informando isso e sugerindo alternativas.

Instruções:
- Use o nome "${userName}"
- Seja empático e acolhedor
- Sugira tentar novamente ou enviar de outra forma
- Seja breve (máximo 1-2 frases)
- Não use emojis (o servidor adiciona)
- Não use estrutura ou formatação
- Apenas a headline: exemplo "Não consegui processar isso, ${userName}. Pode tentar de novo?"

Responda APENAS com a headline, sem aspas, emojis ou formatação extra.`;
      break;
    }

    case "erro_inesperado": {
      prompt = `Ocorreu um erro inesperado ao processar a solicitação do usuário ${userName}.

Crie APENAS uma headline curta e humana pedindo para tentar novamente.

Instruções:
- Use o nome "${userName}"
- Seja empático e humano
- Não seja técnico
- Peça para tentar novamente
- Use linguagem natural: "Opa, aconteceu algo..."
- Seja breve (máximo 1-2 frases)
- Não use emojis (o servidor adiciona)
- Não use estrutura ou formatação
- Apenas a headline: exemplo "Opa, ${userName}! Aconteceu algo. Pode tentar novamente?"

Responda APENAS com a headline, sem aspas, emojis ou formatação extra.`;
      break;
    }
  }

  try {
    // Usar modelo mais rápido para geração de resposta com timeout curto
    const response = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Você é o assistente oficial do AnotaTudo AI. Gere APENAS uma frase curta e natural (headline) sem emojis ou estrutura. O servidor adiciona formatação depois.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 100,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 8000)
      )
    ]) as any;

    let message = response.choices[0].message.content || "";
    
    // Limpar possíveis aspas ou formatação extra
    message = message.trim().replace(/^["']|["']$/g, "");
    
    return message;
  } catch (error) {
    console.error("[AI] Erro ao gerar resposta:", error);
    
    // Fallback para mensagens simples caso a IA falhe
    const fallbacks: Record<AIResponseType, string> = {
      transacao_registrada: `✅ Transação registrada com sucesso, ${userName}!`,
      pedir_email: `Olá ${userName}! Me informe seu email cadastrado para liberar seu acesso.`,
      pedir_email_inicial: `Olá! 👋 Para começar, me diga seu email cadastrado.`,
      erro_geral: `Ops, ${userName}! Aconteceu um problema. Pode tentar novamente?`,
      erro_processamento: `Desculpe, ${userName}! Não consegui processar isso. Pode repetir?`,
      edicao_iniciada: `Claro, ${userName}! Me diga as novas informações da transação.`,
      edicao_concluida: `✅ Transação atualizada, ${userName}!`,
      exclusao_confirmada: `🗑 Transação excluída com sucesso, ${userName}!`,
      transacao_nao_entendida: `Não entendi bem, ${userName}. Pode enviar novamente com mais detalhes?`,
      boas_vindas_autenticado: `Perfeito, ${userName}! Agora pode enviar suas transações por texto, foto ou áudio.`,
      assinatura_inativa: `Sua assinatura está inativa, ${userName}. Entre em contato com o suporte.`,
      email_nao_encontrado: `Não encontrei esse email, ${userName}. Pode verificar e tentar novamente?`,
      video_nao_suportado: `Oi ${userName}! 😊 Ainda não conseguimos processar vídeos. Pode enviar como texto, áudio ou foto?`,
      rate_limit_excedido: `Oi ${userName}! Aguarde um momento antes de enviar mais mensagens, por favor. 😊`,
      senha_temporaria_enviada: `✅ Acesso liberado, ${userName}! Suas transações via WhatsApp já aparecem no dashboard automaticamente.`,
      erro_download_midia: `Ops, ${userName}! Tive um problema ao baixar a mídia. Pode tentar enviar novamente? 😊`,
      erro_processar_midia: `Opa, ${userName}! Não consegui processar isso. Pode tentar de novo ou enviar como texto? 😊`,
      erro_inesperado: `Opa, ${userName}! Aconteceu algo inesperado. Pode tentar novamente? 😊`,
    };
    
    return fallbacks[type] || `Olá ${userName}! Como posso ajudar?`;
  }
}
