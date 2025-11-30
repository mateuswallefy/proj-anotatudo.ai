import OpenAI from "openai";
import fs from "fs";
import { storage } from "./storage.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface TransacaoExtractedData {
  tipo: 'entrada' | 'saida';
  categoria: string;
  valor: number | null;
  dataReal: string;
  descricao: string;
  confianca: number;
}

/**
 * Classifica mensagem de texto e extrai dados financeiros
 */
export async function classifyTextMessage(text: string, userId: string): Promise<TransacaoExtractedData> {
  const today = new Date().toISOString().split('T')[0];
  
  // Buscar categorias customizadas do usuário
  const categoriasCustomizadas = await storage.getCategoriasCustomizadas(userId);
  const customCategoryNames = categoriasCustomizadas.map(c => `${c.emoji} ${c.nome}`).join(', ');
  
  const categoriasDisponiveis = customCategoryNames 
    ? `Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Compras, Contas, Salário, Investimentos, Outros, ${customCategoryNames}`
    : 'Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Compras, Contas, Salário, Investimentos, Outros';
  
  const prompt = `Você é um assistente financeiro especializado em interpretar mensagens sobre transações financeiras.

Analise a seguinte mensagem e extraia os dados estruturados:

Mensagem: "${text}"

Data de hoje: ${today}

Extraia e retorne um JSON com:
- tipo: "entrada" (receita/ganho) ou "saida" (despesa/gasto)
- categoria: uma das opções: ${categoriasDisponiveis}
- valor: número com 2 casas decimais (ou null se não identificado)
- dataReal: data no formato YYYY-MM-DD (use hoje se não especificada)
- descricao: descrição clara e objetiva da transação
- confianca: número de 0 a 1 indicando sua confiança na interpretação

IMPORTANTE: Para a categoria, retorne APENAS o nome da categoria (sem o emoji). Se a transação se encaixar em uma das categorias personalizadas do usuário, use o nome exato da categoria personalizada.

Responda APENAS com JSON válido neste formato:
{
  "tipo": "entrada" | "saida",
  "categoria": "string",
  "valor": number | null,
  "dataReal": "YYYY-MM-DD",
  "descricao": "string",
  "confianca": number
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é um especialista em análise financeira. Sempre responda com JSON válido."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result as TransacaoExtractedData;
  } catch (error) {
    console.error("Erro ao classificar texto:", error);
    throw new Error("Falha ao processar mensagem de texto");
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
    const response = await openai.chat.completions.create({
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
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result as TransacaoExtractedData;
  } catch (error) {
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
 * Processa mensagem do WhatsApp com base no tipo
 */
export async function processWhatsAppMessage(
  messageType: 'text' | 'audio' | 'image' | 'video',
  content: string, // pode ser texto, base64, ou caminho de arquivo
  userId: string
): Promise<TransacaoExtractedData> {
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
  | "email_nao_encontrado";

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
      const emoji = trans?.tipo === "entrada" ? "💰" : "💸";
      const tipoTexto = trans?.tipo === "entrada" ? "entrada" : "saída";
      
      prompt = `Você é um assistente financeiro simpático e carinhoso do AnotaTudo.AI, conversando via WhatsApp.

O usuário ${userName} acaba de registrar uma transação financeira. Crie uma mensagem curta, empática e natural confirmando o registro.

Dados da transação:
- Tipo: ${tipoTexto} ${emoji}
- Valor: R$ ${trans?.valor || "N/A"}
- Categoria: ${trans?.categoria || "N/A"}
- Descrição: ${trans?.descricao || "N/A"}
- Data: ${trans?.data || "Hoje"}

Instruções:
- Use o nome "${userName}" no início da mensagem
- Seja conciso mas amigável (máximo 6 linhas)
- Use emojis com moderação e sempre relevantes
- Explique de forma natural o que foi registrado
- Não mencione "confiança", "score" ou termos técnicos
- Variação: nunca pareça robô repetitivo
- Tom: simpático, leve, natural, profissional mas carinhoso

Responda APENAS com o texto da mensagem, sem aspas ou formatação extra.`;
      break;
    }

    case "pedir_email":
    case "pedir_email_inicial": {
      prompt = `Você é um assistente financeiro simpático e carinhoso do AnotaTudo.AI, conversando via WhatsApp.

O usuário ${userName} precisa fornecer seu email para liberar o acesso. Crie uma mensagem gentil pedindo o email.

Instruções:
- Use o nome "${userName}" quando possível
- Seja gentil e respeitoso, não frio
- Não pareça urgente ou pressionante
- Explique brevemente que precisa do email para liberar o acesso
- Tom: acolhedor, paciente, simpático
- Variação: nunca pareça robô repetitivo

Responda APENAS com o texto da mensagem, sem aspas ou formatação extra.`;
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
      
      prompt = `Você é um assistente financeiro simpático e carinhoso do AnotaTudo.AI, conversando via WhatsApp.

Ocorreu um problema${contextInfo} Crie uma mensagem humana, simples e empática para o usuário ${userName}.

Instruções:
- Use o nome "${userName}"
- Seja empático, não técnico
- ${rateLimit ? "Politely ask them to wait a moment before sending more messages" : sessionError ? "Ask them to provide their email again" : "Peça para tentar novamente de forma acolhedora"}
- Não mencione detalhes técnicos do erro
- Tom: paciente, acolhedor, humano
- Variação: nunca pareça robô repetitivo

Responda APENAS com o texto da mensagem, sem aspas ou formatação extra.`;
      break;
    }

    case "edicao_iniciada": {
      prompt = `Você é um assistente financeiro simpático e carinhoso do AnotaTudo.AI, conversando via WhatsApp.

O usuário ${userName} quer editar uma transação. Peça gentilmente as novas informações.

Instruções:
- Use o nome "${userName}"
- Peça de forma clara mas gentil as novas informações
- Seja direto mas acolhedor
- Tom: simpático, paciente, claro
- Variação: nunca pareça robô repetitivo

Responda APENAS com o texto da mensagem, sem aspas ou formatação extra.`;
      break;
    }

    case "edicao_concluida": {
      const trans = data.transaction;
      const emoji = trans?.tipo === "entrada" ? "💰" : "💸";
      
      prompt = `Você é um assistente financeiro simpático e carinhoso do AnotaTudo.AI, conversando via WhatsApp.

O usuário ${userName} acabou de editar uma transação. Crie uma mensagem confirmando a edição de forma natural.

Dados da transação editada:
- Tipo: ${trans?.tipo === "entrada" ? "entrada" : "saída"} ${emoji}
- Valor: R$ ${trans?.valor || "N/A"}
- Categoria: ${trans?.categoria || "N/A"}
- Descrição: ${trans?.descricao || "N/A"}

Instruções:
- Use o nome "${userName}"
- Confirme a edição de forma carinhosa
- Mostre os dados atualizados de forma natural
- Seja conciso (máximo 6 linhas)
- Tom: simpático, carinhoso, claro
- Variação: nunca pareça robô repetitivo

Responda APENAS com o texto da mensagem, sem aspas ou formatação extra.`;
      break;
    }

    case "exclusao_confirmada": {
      prompt = `Você é um assistente financeiro simpático e carinhoso do AnotaTudo.AI, conversando via WhatsApp.

O usuário ${userName} acabou de excluir uma transação. Confirme de forma elegante, simpática e direta.

Instruções:
- Use o nome "${userName}"
- Seja elegante e direto
- Confirme que foi excluída
- Tom: simpático, profissional, carinhoso
- Variação: nunca pareça robô repetitivo

Responda APENAS com o texto da mensagem, sem aspas ou formatação extra.`;
      break;
    }

    case "transacao_nao_entendida": {
      prompt = `Você é um assistente financeiro simpático e carinhoso do AnotaTudo.AI, conversando via WhatsApp.

O usuário ${userName} enviou uma mensagem que você não conseguiu entender como transação. Peça para reenviar de forma clara, sendo paciente e acolhedor.

Instruções:
- Use o nome "${userName}"
- Seja paciente e acolhedor
- Peça para reenviar informação de forma clara
- Dê exemplos breves se útil
- Tom: paciente, acolhedor, simpático
- Variação: nunca pareça robô repetitivo

Responda APENAS com o texto da mensagem, sem aspas ou formatação extra.`;
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
- Tom: caloroso, simpático, encorajador
- Variação: nunca pareça robô repetitivo
- Não seja muito longo ou formal

Responda APENAS com o texto da mensagem, sem aspas ou formatação extra.`;
      break;
    }

    case "assinatura_inativa": {
      prompt = `Você é um assistente financeiro simpático e carinhoso do AnotaTudo.AI, conversando via WhatsApp.

O usuário ${userName} tem uma assinatura inativa. Informe de forma empática e sugira entrar em contato com suporte.

Instruções:
- Use o nome "${userName}"
- Seja empático, não frio
- Informe que a assinatura está inativa
- Sugira entrar em contato com suporte
- Tom: empático, acolhedor, profissional
- Variação: nunca pareça robô repetitivo

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
- Tom: gentil, paciente, acolhedor
- Variação: nunca pareça robô repetitivo

Responda APENAS com o texto da mensagem, sem aspas ou formatação extra.`;
      break;
    }

    default: {
      prompt = `Você é um assistente financeiro simpático e carinhoso do AnotaTudo.AI, conversando via WhatsApp.

Crie uma mensagem apropriada para a situação.

Instruções:
- Seja simpático, leve e natural
- Use o nome do usuário quando disponível
- Não seja repetitivo
- Tom: profissional mas carinhoso

Responda APENAS com o texto da mensagem, sem aspas ou formatação extra.`;
    }
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é um assistente financeiro simpático, carinhoso e humano do AnotaTudo.AI. Suas mensagens são sempre naturais, pessoais e variadas. Nunca soe como robô. Sempre use o primeiro nome do usuário quando disponível. Não mencione termos técnicos ou que você é uma IA.

REGRAS PARA USO DE EMOJIS:
- Use emojis de forma natural, sempre coerentes com o contexto da mensagem
- Varie bastante os emojis para cada usuário e cada resposta (não repita o mesmo sempre)
- Use emojis relacionados ao tema da transação:
  • Alimentação: 🍽️🥗🍔🍕☕
  • Transporte: 🚗🛵🚌🚕✈️
  • Mercado/Compras: 🛒🛍️🧾
  • Saúde: 🏥💊🩺
  • Lazer: 🎉🎶🍿
  • Contas: 💡💧🏠🧾
  • Dinheiro: 💰💸🪙
  • Entrada de dinheiro: 🤑💵💰
- Use emojis de expressão humana quando desejar criar empatia: 🙂😊😄😉🙌✨
- NUNCA use mais que 3-4 emojis na mesma resposta
- Não force emojis se a frase ficar estranha
- Não use emojis genéricos demais repetidamente
- Não use emojis "aleatórios" que não se conectem à frase
- O usuário deve sentir que foi uma pessoa real que escreveu a frase`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 300,
    });

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
    };
    
    return fallbacks[type] || `Olá ${userName}! Como posso ajudar?`;
  }
}
