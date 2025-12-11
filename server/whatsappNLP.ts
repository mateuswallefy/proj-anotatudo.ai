/**
 * WhatsApp NLP - Classificação e processamento de mensagens
 * Sistema simplificado de NLP para detectar despesas, receitas e lembretes
 */

import { storage } from "./storage.js";
import { sendWhatsAppReply } from "./whatsapp.js";
import { extractSimpleTransaction } from "./ai.js";
import { detectEventoInMessage } from "./ai.js";
import { db } from "./db.js";
import { whatsappLatency, whatsappSessions } from "../shared/schema.js";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

export interface ClassifiedMessage {
  type: 'expense' | 'income' | 'reminder' | 'unknown';
  value?: number;
  category?: string;
  date?: string; // YYYY-MM-DD
  description?: string;
  confidence: number;
}

/**
 * Classifica uma mensagem de texto em despesa, receita, lembrete ou desconhecido
 */
export function classifyMessage(text: string): ClassifiedMessage {
  const lowerText = text.toLowerCase().trim();
  const originalText = text.trim();

  // ========================================
  // DETECTAR LEMBRETE/EVENTO PRIMEIRO
  // ========================================
  const reminderKeywords = [
    'lembrete', 'lembrar', 'não esquecer', 'nao esquecer', 'não esquece', 'nao esquece',
    'reunião', 'reuniao', 'meeting', 'consulta', 'compromisso', 'agendar', 'agendamento',
    'marcar', 'marcado', 'evento', 'encontro', 'entrevista', 'apresentação', 'apresentacao',
    'dentista', 'médico', 'medico', 'exame', 'prova', 'aniversário', 'aniversario',
    'festa', 'casamento', 'voo', 'viagem', 'hotel', 'reserva', 'prazo', 'deadline'
  ];

  // Se tem palavra-chave de lembrete E não tem palavras de transação financeira
  const hasReminderKeyword = reminderKeywords.some(kw => lowerText.includes(kw));
  const hasFinancialKeyword = lowerText.match(/(?:recebi|ganhei|gastei|paguei|comprei|vendi)\s+\d+/i) ||
                               lowerText.match(/\d+\s*(?:reais?|r\$)/i);

  if (hasReminderKeyword && !hasFinancialKeyword) {
    // Extrair data se mencionada
    const extractedDate = extractDateFromText(lowerText);
    const extractedTime = extractTimeFromText(lowerText);

    return {
      type: 'reminder',
      date: extractedDate || new Date().toISOString().split('T')[0],
      description: originalText.substring(0, 200),
      confidence: 0.8,
    };
  }

  // ========================================
  // DETECTAR DESPESA OU RECEITA
  // ========================================
  
  // Extrair valor
  let value: number | undefined;
  
  // Padrão 1: "R$ 100", "R$100"
  const valorMatch1 = text.match(/r\$\s*(\d+(?:[.,]\d{1,2})?)/i);
  if (valorMatch1) {
    value = parseFloat(valorMatch1[1].replace(',', '.'));
  }

  // Padrão 2: "100 reais", "100reais"
  if (!value) {
    const valorMatch2 = text.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:reais?|real)/i);
    if (valorMatch2) {
      value = parseFloat(valorMatch2[1].replace(',', '.'));
    }
  }

  // Padrão 3: Número após palavras-chave
  if (!value) {
    const valorMatch3 = lowerText.match(/(?:recebi|ganhei|gastei|paguei|comprei|vendi|de|por)\s+(\d+(?:[.,]\d{1,2})?)/);
    if (valorMatch3) {
      value = parseFloat(valorMatch3[1].replace(',', '.'));
    }
  }

  // Padrão 4: Qualquer número no texto
  if (!value) {
    const allNumbers = text.match(/\d+(?:[.,]\d{1,2})?/g);
    if (allNumbers) {
      for (const num of allNumbers) {
        const parsed = parseFloat(num.replace(',', '.'));
        if (parsed >= 1) {
          value = parsed;
          break;
        }
      }
    }
  }

  // Detectar tipo (entrada/saída)
  const incomeKeywords = [
    'recebi', 'ganhei', 'entrou', 'entrada', 'salário', 'salario',
    'pagamento recebido', 'crédito', 'credito', 'depositei', 'depósito', 'deposito',
    'cliente pagou', 'me pagou', 'pagou-me', 'venda', 'vendi', 'lucro',
    'renda', 'provento', 'recebimento', 'freelance', 'freela', 'serviço',
    'de um cliente', 'do cliente', 'cliente'
  ];

  const expenseKeywords = [
    'gastei', 'paguei', 'comprei', 'despesa', 'saída', 'saida',
    'débito', 'debito', 'gasto', 'compra', 'pagamento de', 'pagar',
    'conta de', 'boleto', 'fatura', 'dívida', 'divida', 'parcela',
    'prestação', 'prestacao', 'aluguel', 'mensalidade'
  ];

  let incomeScore = 0;
  let expenseScore = 0;

  for (const kw of incomeKeywords) {
    if (lowerText.includes(kw)) {
      incomeScore += kw.length;
    }
  }

  for (const kw of expenseKeywords) {
    if (lowerText.includes(kw)) {
      expenseScore += kw.length;
    }
  }

  // Boost para "cliente" (muito provável que seja receita)
  if (lowerText.includes('cliente')) {
    incomeScore += 20;
  }

  // Detectar categoria
  const categoriaMap: Record<string, string> = {
    // Alimentação
    'almoço': 'Alimentação', 'almoco': 'Alimentação', 'jantar': 'Alimentação',
    'café': 'Alimentação', 'cafe': 'Alimentação', 'lanche': 'Alimentação',
    'comida': 'Alimentação', 'restaurante': 'Alimentação', 'ifood': 'Alimentação',
    'mercado': 'Alimentação', 'supermercado': 'Alimentação', 'padaria': 'Alimentação',

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
    'comissão': 'Salário', 'comissao': 'Salário',

    // Saúde
    'médico': 'Saúde', 'medico': 'Saúde', 'farmácia': 'Saúde', 'farmacia': 'Saúde',
    'remédio': 'Saúde', 'remedio': 'Saúde', 'consulta': 'Saúde', 'exame': 'Saúde',

    // Lazer
    'cinema': 'Lazer', 'show': 'Lazer', 'festa': 'Lazer', 'bar': 'Lazer',
    'cerveja': 'Lazer', 'viagem': 'Lazer', 'passeio': 'Lazer',

    // Compras
    'roupa': 'Compras', 'sapato': 'Compras', 'shopping': 'Compras', 'loja': 'Compras',
  };

  let category = 'Outros';
  for (const [keyword, cat] of Object.entries(categoriaMap)) {
    if (lowerText.includes(keyword)) {
      category = cat;
      break;
    }
  }

  // Se não encontrou categoria e é receita, usar "Salário"
  if (incomeScore > expenseScore && category === 'Outros') {
    category = 'Salário';
  }

  // Determinar tipo final
  let type: 'expense' | 'income' | 'unknown';
  if (incomeScore > expenseScore) {
    type = 'income';
  } else if (expenseScore > incomeScore) {
    type = 'expense';
  } else {
    // Se não detectou claramente, verificar se tem valor
    if (value && value > 0) {
      // Se tem valor mas não detectou tipo, assumir despesa (mais comum)
      type = 'expense';
    } else {
      type = 'unknown';
    }
  }

  // Extrair data se mencionada
  const extractedDate = extractDateFromText(lowerText);

  // Calcular confiança
  let confidence = 0.5;
  if (value && value > 0) confidence += 0.2;
  if (incomeScore > 0 || expenseScore > 0) confidence += 0.2;
  if (category !== 'Outros') confidence += 0.1;

  return {
    type,
    value,
    category,
    date: extractedDate || new Date().toISOString().split('T')[0],
    description: originalText.substring(0, 200),
    confidence: Math.min(confidence, 0.95),
  };
}

/**
 * Extrai data de texto em português
 */
function extractDateFromText(text: string): string | null {
  const today = new Date();

  // Hoje
  if (text.includes('hoje')) {
    return today.toISOString().split('T')[0];
  }

  // Amanhã
  if (text.includes('amanhã') || text.includes('amanha')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  // Dia específico: "dia 15", "no dia 20"
  const diaMatch = text.match(/(?:dia|no dia)\s*(\d{1,2})/);
  if (diaMatch) {
    const dia = parseInt(diaMatch[1]);
    const result = new Date(today.getFullYear(), today.getMonth(), dia);
    if (result < today) {
      result.setMonth(result.getMonth() + 1);
    }
    return result.toISOString().split('T')[0];
  }

  return null;
}

/**
 * Extrai hora de texto
 */
function extractTimeFromText(text: string): string | null {
  // Padrão: "às 15h", "as 15:30", "15h30"
  const timeMatch = text.match(/(?:às|as|,)?\s*(\d{1,2})(?::|\s*h\s*|h)(\d{2})?\s*(?:horas?|h)?/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  }

  // Períodos do dia
  if (text.includes('manhã') || text.includes('manha')) return '09:00';
  if (text.includes('meio-dia') || text.includes('meio dia')) return '12:00';
  if (text.includes('tarde')) return '14:00';
  if (text.includes('noite')) return '19:00';

  return null;
}

/**
 * Processa mensagem recebida do WhatsApp
 * Cria transação, evento ou retorna resposta apropriada
 */
export async function processIncomingMessage(
  user: { id: string; firstName?: string | null; whatsappNumber?: string | null },
  text: string,
  phoneNumber: string,
  messageId?: string
): Promise<{ success: boolean; message?: string }> {
  const receivedAt = new Date();
  let latencyId: string | undefined;

  try {
    // Criar registro de latência
    try {
      const crypto = await import('crypto');
      latencyId = crypto.randomUUID();
      
      await storage.createWhatsAppLatency({
        id: latencyId,
        waMessageId: messageId || undefined,
        fromNumber: phoneNumber,
        messageType: 'text',
        receivedAt,
        userId: user.id,
      });
    } catch (latencyError) {
      console.error("[WhatsApp NLP] Erro ao criar latency:", latencyError);
    }

    // Atualizar ou criar sessão WhatsApp
    try {
      const existingSession = await db
        .select()
        .from(whatsappSessions)
        .where(eq(whatsappSessions.phoneNumber, phoneNumber))
        .limit(1);

      if (existingSession.length > 0) {
        await db
          .update(whatsappSessions)
          .set({
            lastMessageAt: receivedAt,
            userId: user.id,
            updatedAt: new Date(),
          })
          .where(eq(whatsappSessions.phoneNumber, phoneNumber));
      } else {
        await db.insert(whatsappSessions).values({
          phoneNumber,
          userId: user.id,
          status: 'verified',
          lastMessageAt: receivedAt,
        });
      }
    } catch (sessionError) {
      console.error("[WhatsApp NLP] Erro ao atualizar sessão:", sessionError);
    }

    // Classificar mensagem
    const classification = classifyMessage(text);

    console.log(`[WhatsApp NLP] Mensagem classificada:`, classification);

    // Processar baseado no tipo
    if (classification.type === 'expense' || classification.type === 'income') {
      // É uma transação financeira
      
      // Se não tem valor, tentar usar função de extração mais avançada
      if (!classification.value || classification.value <= 0) {
        try {
          const extracted = extractSimpleTransaction(text);
          if (extracted && extracted.valor && extracted.valor > 0) {
            classification.value = extracted.valor;
            classification.category = extracted.categoria;
            classification.description = extracted.descricao;
            classification.date = extracted.dataReal;
            classification.confidence = extracted.confianca;
          }
        } catch (extractError) {
          console.error("[WhatsApp NLP] Erro na extração avançada:", extractError);
        }
      }

      // Se ainda não tem valor, não pode criar transação
      if (!classification.value || classification.value <= 0) {
        const responseMessage = "Não consegui identificar o valor. Pode enviar novamente? Ex: 'Almoço R$ 45' ou 'Recebi 100 reais'";
        await sendWhatsAppReply(phoneNumber, responseMessage, latencyId);
        return { success: false, message: responseMessage };
      }

      // Criar transação
      const tipo = classification.type === 'income' ? 'entrada' : 'saida';
      
      const transacao = await storage.createTransacao({
        userId: user.id,
        tipo,
        categoria: classification.category || 'Outros',
        valor: String(classification.value),
        descricao: classification.description || text.substring(0, 200),
        dataReal: classification.date || new Date().toISOString().split('T')[0],
        origem: 'whatsapp',
        status: 'paid', // Por padrão, transações do WhatsApp são pagas
        paymentMethod: 'other',
      });

      console.log(`[WhatsApp NLP] ✅ Transação criada: ${tipo} R$ ${classification.value}`);

      // Enviar resposta automática
      const tipoTexto = tipo === 'entrada' ? 'Receita' : 'Despesa';
      const responseMessage = `${tipoTexto} registrada: ${classification.category || 'Outros'}, R$ ${classification.value.toFixed(2)}.`;
      await sendWhatsAppReply(phoneNumber, responseMessage, latencyId);

      // Atualizar latency com sucesso
      if (latencyId) {
        try {
          await storage.updateWhatsAppLatency(latencyId, {
            processedAt: new Date(),
            botLatencyMs: Date.now() - receivedAt.getTime(),
          });
        } catch (updateError) {
          console.error("[WhatsApp NLP] Erro ao atualizar latency:", updateError);
        }
      }

      return { success: true, message: responseMessage };

    } else if (classification.type === 'reminder') {
      // É um lembrete/evento
      
      // Tentar usar função de detecção de evento mais avançada
      try {
        const eventoData = await detectEventoInMessage(text);
        
        if (eventoData.isEvento) {
          const evento = await storage.createEvento({
            userId: user.id,
            titulo: eventoData.titulo || text.substring(0, 100),
            descricao: eventoData.descricao || text,
            data: eventoData.data || classification.date || new Date().toISOString().split('T')[0],
            hora: eventoData.hora || undefined,
            origem: 'whatsapp',
            whatsappMessageId: messageId || undefined,
          });

          console.log(`[WhatsApp NLP] ✅ Evento criado: ${evento.titulo}`);

          const responseMessage = "Anotado! Vou te lembrar.";
          await sendWhatsAppReply(phoneNumber, responseMessage, latencyId);

          if (latencyId) {
            try {
              await storage.updateWhatsAppLatency(latencyId, {
                processedAt: new Date(),
                botLatencyMs: Date.now() - receivedAt.getTime(),
              });
            } catch (updateError) {
              console.error("[WhatsApp NLP] Erro ao atualizar latency:", updateError);
            }
          }

          return { success: true, message: responseMessage };
        }
      } catch (eventoError) {
        console.error("[WhatsApp NLP] Erro ao processar evento:", eventoError);
      }

      // Se não conseguiu criar evento, responder como desconhecido
      const responseMessage = "Não entendi, posso registrar despesas, receitas ou lembretes. Ex: 'Almoço R$ 45' ou 'Reunião amanhã às 15h'";
      await sendWhatsAppReply(phoneNumber, responseMessage, latencyId);
      return { success: false, message: responseMessage };

    } else {
      // Tipo desconhecido
      const responseMessage = "Não entendi, posso registrar despesas, receitas ou lembretes. Ex: 'Almoço R$ 45', 'Recebi 100 reais' ou 'Reunião amanhã às 15h'";
      await sendWhatsAppReply(phoneNumber, responseMessage, latencyId);
      
      if (latencyId) {
        try {
          await storage.updateWhatsAppLatency(latencyId, {
            processedAt: new Date(),
            botLatencyMs: Date.now() - receivedAt.getTime(),
          });
        } catch (updateError) {
          console.error("[WhatsApp NLP] Erro ao atualizar latency:", updateError);
        }
      }

      return { success: false, message: responseMessage };
    }

  } catch (error: any) {
    console.error("[WhatsApp NLP] Erro ao processar mensagem:", error);
    
    // Enviar mensagem de erro amigável
    const errorMessage = "Ops, aconteceu algo inesperado. Pode tentar novamente?";
    await sendWhatsAppReply(phoneNumber, errorMessage, latencyId);
    
    // Atualizar latency com erro
    if (latencyId) {
      try {
        await storage.updateWhatsAppLatency(latencyId, {
          processedAt: new Date(),
          botLatencyMs: Date.now() - receivedAt.getTime(),
        });
      } catch (updateError) {
        console.error("[WhatsApp NLP] Erro ao atualizar latency:", updateError);
      }
    }

    return { success: false, message: errorMessage };
  }
}

