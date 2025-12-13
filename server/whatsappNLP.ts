/**
 * WhatsApp NLP - Classificação e processamento de mensagens
 * Sistema simplificado de NLP para detectar despesas, receitas e lembretes
 */

import { storage } from "./storage.js";
import { sendWhatsAppReply, sendWhatsAppTransactionMessage } from "./whatsapp.js";
import { extractSimpleTransaction } from "./ai.js";
import { detectEventoInMessage } from "./ai.js";
// Removidos imports não utilizados - usar storage diretamente

export interface ClassifiedMessage {
  type: 'expense' | 'income' | 'reminder' | 'greeting' | 'unknown';
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
  // DETECTAR SAUDAÇÕES PRIMEIRO
  // ========================================
  const greetingKeywords = [
    'oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite',
    'e aí', 'e ai', 'eae', 'opa', 'hey', 'hi', 'hello',
    'tudo bem', 'td bem', 'tudo bom', 'td bom'
  ];

  const isGreeting = greetingKeywords.some(kw => {
    // Verificar se a palavra-chave está no início da mensagem ou sozinha
    return lowerText === kw || lowerText.startsWith(kw + ' ') || lowerText === kw;
  });

  if (isGreeting) {
    return {
      type: 'greeting',
      description: originalText.substring(0, 200),
      confidence: 0.9,
    };
  }

  // ========================================
  // DETECTAR LEMBRETE/EVENTO
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

  // Fallback: se confidence >= 0.3 e não detectou nada específico, tratar como greeting
  if (type === 'unknown' && confidence >= 0.3 && !value && incomeScore === 0 && expenseScore === 0) {
    return {
      type: 'greeting',
      description: originalText.substring(0, 200),
      confidence: 0.5,
    };
  }

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
    } catch (latencyError: any) {
      console.error("[WhatsApp NLP] ❌ Erro ao criar latency:", latencyError?.message || latencyError);
      // Continuar processamento mesmo se latency falhar
    }

    // Atualizar ou criar sessão WhatsApp usando storage
    try {
      const existingSession = await storage.getWhatsAppSession(phoneNumber);
      
      if (existingSession) {
        await storage.updateWhatsAppSession(phoneNumber, {
          lastMessageAt: receivedAt,
          userId: user.id,
        });
      } else {
        await storage.createWhatsAppSession({
          phoneNumber,
          userId: user.id,
          status: 'verified',
          lastMessageAt: receivedAt,
        });
      }
    } catch (sessionError: any) {
      console.error("[WhatsApp NLP] ❌ Erro ao atualizar sessão:", sessionError?.message || sessionError);
      // Não bloquear processamento se sessão falhar
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
        } catch (extractError: any) {
          console.error("[WhatsApp NLP] ❌ Erro na extração avançada:", extractError?.message || extractError);
          // Continuar sem valor extraído
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
      
      // Criar transação sem status/paymentMethod (usam defaults do schema)
      const transacao = await storage.createTransacao({
        userId: user.id,
        tipo,
        categoria: classification.category || 'Outros',
        valor: String(classification.value),
        descricao: classification.description || text.substring(0, 200),
        dataReal: classification.date || new Date().toISOString().split('T')[0],
        origem: 'whatsapp',
        // status e paymentMethod usam defaults do schema (paid, other)
      });

      console.log(`[WhatsApp NLP] ✅ Transação criada: ${tipo} R$ ${classification.value}`);

      // Enviar mensagem rica com botões interativos
      const result = await sendWhatsAppTransactionMessage(
        phoneNumber,
        {
          id: transacao.id,
          tipo,
          valor: String(classification.value),
          categoria: classification.category || 'Outros',
          descricao: classification.description || text.substring(0, 200),
          data: classification.date || new Date().toISOString().split('T')[0],
        },
        {
          firstName: user.firstName,
          id: user.id,
          email: user.email,
        },
        latencyId
      );

      // Atualizar latency com sucesso e messageId da resposta
      if (latencyId) {
        try {
          const updates: any = {
            processedAt: new Date(),
            botLatencyMs: Date.now() - receivedAt.getTime(),
          };
          
          // Se a mensagem rica foi enviada com sucesso, atualizar responseMessageId
          if (result.success && result.messageId) {
            updates.responseMessageId = result.messageId;
          }
          
          await storage.updateWhatsAppLatency(latencyId, updates);
        } catch (updateError) {
          console.error("[WhatsApp NLP] Erro ao atualizar latency:", updateError);
        }
      }

      const responseMessage = `${tipo === 'entrada' ? 'Receita' : 'Despesa'} registrada com sucesso!`;
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
            } catch (updateError: any) {
              console.error("[WhatsApp NLP] ❌ Erro ao atualizar latency:", updateError?.message || updateError);
              // Não bloquear resposta ao usuário
            }
          }

          return { success: true, message: responseMessage };
        }
      } catch (eventoError: any) {
        console.error("[WhatsApp NLP] ❌ Erro ao processar evento:", eventoError?.message || eventoError);
        // Continuar para resposta padrão
      }

      // Se não conseguiu criar evento, responder como desconhecido
      const responseMessage = "Não entendi, posso registrar despesas, receitas ou lembretes. Ex: 'Almoço R$ 45' ou 'Reunião amanhã às 15h'";
      await sendWhatsAppReply(phoneNumber, responseMessage, latencyId);
      return { success: false, message: responseMessage };

    } else if (classification.type === 'greeting') {
      // É uma saudação
      const greetingResponses = [
        `Olá${user.firstName ? `, ${user.firstName}` : ''}! 👋 Como posso ajudar?`,
        `Oi${user.firstName ? `, ${user.firstName}` : ''}! 😊 Posso registrar despesas, receitas ou lembretes.`,
        `Bom dia${user.firstName ? `, ${user.firstName}` : ''}! 🌅 Em que posso ajudar hoje?`,
        `Boa tarde${user.firstName ? `, ${user.firstName}` : ''}! ☀️ Como posso ajudar?`,
        `Boa noite${user.firstName ? `, ${user.firstName}` : ''}! 🌙 Em que posso ajudar?`,
      ];
      
      // Escolher resposta baseada na hora do dia
      const hour = new Date().getHours();
      let responseMessage: string;
      if (hour >= 5 && hour < 12) {
        responseMessage = greetingResponses[2]; // Bom dia
      } else if (hour >= 12 && hour < 18) {
        responseMessage = greetingResponses[3]; // Boa tarde
      } else if (hour >= 18 || hour < 5) {
        responseMessage = greetingResponses[4]; // Boa noite
      } else {
        responseMessage = greetingResponses[0]; // Olá genérico
      }
      
      await sendWhatsAppReply(phoneNumber, responseMessage, latencyId);
      
      if (latencyId) {
        try {
          await storage.updateWhatsAppLatency(latencyId, {
            processedAt: new Date(),
            botLatencyMs: Date.now() - receivedAt.getTime(),
          });
        } catch (updateError: any) {
          console.error("[WhatsApp NLP] ❌ Erro ao atualizar latency:", updateError?.message || updateError);
        }
      }

      return { success: true, message: responseMessage };

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
        } catch (updateError: any) {
          console.error("[WhatsApp NLP] ❌ Erro ao atualizar latency:", updateError?.message || updateError);
          // Não bloquear resposta ao usuário
        }
      }

      return { success: false, message: responseMessage };
    }

  } catch (error: any) {
    console.error("[WhatsApp NLP] ❌ Erro crítico ao processar mensagem:", error?.message || error, error?.stack);
    
    // Enviar mensagem de erro amigável
    const errorMessage = "Ops, aconteceu algo inesperado. Pode tentar novamente?";
    try {
      await sendWhatsAppReply(phoneNumber, errorMessage, latencyId);
    } catch (replyError: any) {
      console.error("[WhatsApp NLP] ❌ Erro ao enviar resposta de erro:", replyError?.message || replyError);
    }
    
    // Atualizar latency com erro
    if (latencyId) {
      try {
        await storage.updateWhatsAppLatency(latencyId, {
          processedAt: new Date(),
          botLatencyMs: Date.now() - receivedAt.getTime(),
        });
      } catch (updateError: any) {
        console.error("[WhatsApp NLP] ❌ Erro ao atualizar latency:", updateError?.message || updateError);
      }
    }

    return { success: false, message: errorMessage };
  }
}

