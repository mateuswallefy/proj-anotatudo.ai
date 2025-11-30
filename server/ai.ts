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
      const emoji = trans?.tipo === "entrada" ? "💰" : "💸";
      const tipoTexto = trans?.tipo === "entrada" ? "entrada" : "saída";
      
      // Mapear categoria para sugestão de emojis
      const categoriaLower = (trans?.categoria || "").toLowerCase();
      let emojiSuggestion = "";
      if (categoriaLower.includes("aliment") || categoriaLower.includes("comida") || categoriaLower.includes("restaurante")) {
        emojiSuggestion = "Use emojis relacionados: 🍽️🥗🍔🍕☕";
      } else if (categoriaLower.includes("transporte") || categoriaLower.includes("combustível") || categoriaLower.includes("uber")) {
        emojiSuggestion = "Use emojis relacionados: 🚗🛵🚌🚕✈️";
      } else if (categoriaLower.includes("mercado") || categoriaLower.includes("compras") || categoriaLower.includes("super")) {
        emojiSuggestion = "Use emojis relacionados: 🛒🛍️🧾";
      } else if (categoriaLower.includes("saúde") || categoriaLower.includes("farmacia") || categoriaLower.includes("médico")) {
        emojiSuggestion = "Use emojis relacionados: 🏥💊🩺";
      } else if (categoriaLower.includes("lazer") || categoriaLower.includes("cinema") || categoriaLower.includes("entretenimento")) {
        emojiSuggestion = "Use emojis relacionados: 🎉🎶🍿";
      } else if (categoriaLower.includes("conta") || categoriaLower.includes("luz") || categoriaLower.includes("água") || categoriaLower.includes("água")) {
        emojiSuggestion = "Use emojis relacionados: 💡💧🏠🧾";
      } else if (trans?.tipo === "entrada") {
        emojiSuggestion = "Use emojis relacionados: 🤑💵💰";
      } else {
        emojiSuggestion = "Use emojis relacionados: 💰💸🪙";
      }
      
      prompt = `Você é um assistente financeiro simpático e carinhoso do AnotaTudo.AI, conversando via WhatsApp.

O usuário ${userName} acaba de registrar uma transação financeira. Crie uma mensagem curta, empática e natural confirmando o registro.

Dados da transação:
- Tipo: ${tipoTexto}
- Valor: R$ ${trans?.valor || "N/A"}
- Categoria: ${trans?.categoria || "N/A"}
- Descrição: ${trans?.descricao || "N/A"}
- Data: ${trans?.data || "Hoje"}

Instruções:
- Use o nome "${userName}" no início da mensagem
- Seja conciso mas amigável (máximo 6 linhas)
- ${emojiSuggestion}
- Use emojis de forma natural e coerente com o contexto (categoria: ${trans?.categoria || "N/A"})
- VARIE os emojis - nunca use os mesmos sempre, cada resposta deve ser única
- Use emojis de expressão humana para empatia: 🙂😊😄😉🙌✨
- MÁXIMO de 3-4 emojis na mensagem completa
- Não force emojis se ficar estranho
- Não use emojis genéricos demais ou repetitivos
- Explique de forma natural o que foi registrado
- Não mencione "confiança", "score" ou termos técnicos
- Variação: nunca pareça robô repetitivo - cada resposta deve ser única
- Tom: simpático, leve, natural, profissional mas carinhoso
- O usuário deve sentir que foi uma pessoa real que escreveu

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
- Use emojis de expressão humana para empatia: 🙂😊😄😉🙌✨
- VARIE os emojis - cada resposta deve ser única, não repita os mesmos
- MÁXIMO de 2-3 emojis na mensagem
- Use emojis de forma natural, não force se ficar estranho
- Tom: acolhedor, paciente, simpático
- Variação: nunca pareça robô repetitivo - cada resposta deve soar única e humana

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
- Use emojis de expressão humana para empatia: 🙂😊🙏✨
- VARIE os emojis - nunca repita os mesmos
- MÁXIMO de 2-3 emojis na mensagem
- Use emojis de forma natural e coerente
- Tom: paciente, acolhedor, humano
- Variação: nunca pareça robô repetitivo - cada resposta deve ser única

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
- Use emojis de expressão humana para empatia: 🙂😊✏️✨
- VARIE os emojis - nunca repita os mesmos
- MÁXIMO de 2-3 emojis na mensagem
- Use emojis de forma natural, não force
- Tom: simpático, paciente, claro
- Variação: nunca pareça robô repetitivo - cada resposta deve ser única

Responda APENAS com o texto da mensagem, sem aspas ou formatação extra.`;
      break;
    }

    case "edicao_concluida": {
      const trans = data.transaction;
      const emoji = trans?.tipo === "entrada" ? "💰" : "💸";
      
      // Mapear categoria para sugestão de emojis
      const categoriaLowerEdit = (trans?.categoria || "").toLowerCase();
      let emojiSuggestionEdit = "";
      if (categoriaLowerEdit.includes("aliment") || categoriaLowerEdit.includes("comida") || categoriaLowerEdit.includes("restaurante")) {
        emojiSuggestionEdit = "Use emojis relacionados: 🍽️🥗🍔🍕☕";
      } else if (categoriaLowerEdit.includes("transporte") || categoriaLowerEdit.includes("combustível") || categoriaLowerEdit.includes("uber")) {
        emojiSuggestionEdit = "Use emojis relacionados: 🚗🛵🚌🚕✈️";
      } else if (categoriaLowerEdit.includes("mercado") || categoriaLowerEdit.includes("compras") || categoriaLowerEdit.includes("super")) {
        emojiSuggestionEdit = "Use emojis relacionados: 🛒🛍️🧾";
      } else if (categoriaLowerEdit.includes("saúde") || categoriaLowerEdit.includes("farmacia") || categoriaLowerEdit.includes("médico")) {
        emojiSuggestionEdit = "Use emojis relacionados: 🏥💊🩺";
      } else if (categoriaLowerEdit.includes("lazer") || categoriaLowerEdit.includes("cinema") || categoriaLowerEdit.includes("entretenimento")) {
        emojiSuggestionEdit = "Use emojis relacionados: 🎉🎶🍿";
      } else if (categoriaLowerEdit.includes("conta") || categoriaLowerEdit.includes("luz") || categoriaLowerEdit.includes("água")) {
        emojiSuggestionEdit = "Use emojis relacionados: 💡💧🏠🧾";
      } else if (trans?.tipo === "entrada") {
        emojiSuggestionEdit = "Use emojis relacionados: 🤑💵💰";
      } else {
        emojiSuggestionEdit = "Use emojis relacionados: 💰💸🪙";
      }
      
      prompt = `Você é um assistente financeiro simpático e carinhoso do AnotaTudo.AI, conversando via WhatsApp.

O usuário ${userName} acabou de editar uma transação. Crie uma mensagem confirmando a edição de forma natural.

Dados da transação editada:
- Tipo: ${trans?.tipo === "entrada" ? "entrada" : "saída"}
- Valor: R$ ${trans?.valor || "N/A"}
- Categoria: ${trans?.categoria || "N/A"}
- Descrição: ${trans?.descricao || "N/A"}

Instruções:
- Use o nome "${userName}"
- Confirme a edição de forma carinhosa
- Mostre os dados atualizados de forma natural
- ${emojiSuggestionEdit}
- Use emojis de forma natural e coerente com a categoria: ${trans?.categoria || "N/A"}
- VARIE os emojis - nunca use os mesmos sempre
- Use emojis de expressão humana: 🙂😊✅✨
- MÁXIMO de 3-4 emojis na mensagem
- Seja conciso (máximo 6 linhas)
- Tom: simpático, carinhoso, claro
- Variação: nunca pareça robô repetitivo - cada resposta deve ser única

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
- Use emojis de forma discreta e natural: ✅🗑️✨
- VARIE os emojis - nunca repita os mesmos
- MÁXIMO de 2 emojis na mensagem
- Não force emojis, seja sutil
- Tom: simpático, profissional, carinhoso
- Variação: nunca pareça robô repetitivo - cada resposta deve ser única

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
- Use emojis de expressão humana para empatia: 🙂😊🤔✨
- VARIE os emojis - nunca repita os mesmos
- MÁXIMO de 2-3 emojis na mensagem
- Use emojis de forma natural, não force
- Tom: paciente, acolhedor, simpático
- Variação: nunca pareça robô repetitivo - cada resposta deve ser única

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
      prompt = `Você é um assistente financeiro simpático e carinhoso do AnotaTudo.AI, conversando via WhatsApp.

O usuário ${userName} enviou um vídeo, mas ainda não conseguimos processar vídeos. Informe isso de forma simpática e sugira alternativas (texto, áudio ou foto).

Instruções:
- Use o nome "${userName}"
- Seja empático e acolhedor, não frustrado
- Explique que vídeos ainda não são suportados
- Sugira alternativas: texto, áudio ou foto
- Dê exemplos breves (ex: "Almoço R$ 45")
- Use emojis de forma natural: 😊📸🎤
- VARIE os emojis - nunca repita os mesmos
- MÁXIMO de 2-3 emojis na mensagem
- Tom: simpático, acolhedor, útil
- Variação: nunca pareça robô repetitivo - cada resposta deve ser única

Responda APENAS com o texto da mensagem, sem aspas ou formatação extra.`;
      break;
    }

    case "rate_limit_excedido": {
      prompt = `Você é um assistente financeiro simpático e carinhoso do AnotaTudo.AI, conversando via WhatsApp.

O usuário ${userName} está enviando mensagens muito rapidamente. Peça gentilmente para aguardar um momento antes de continuar.

Instruções:
- Use o nome "${userName}"
- Seja gentil e compreensivo, não rude ou impaciente
- Peça para aguardar um momento
- Seja breve e direto
- Use emojis de forma natural: 😊⏱️✨
- VARIE os emojis - nunca repita os mesmos
- MÁXIMO de 2 emojis na mensagem
- Tom: gentil, compreensivo, profissional
- Variação: nunca pareça robô repetitivo - cada resposta deve ser única

Responda APENAS com o texto da mensagem, sem aspas ou formatação extra.`;
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
      prompt = `Você é um assistente financeiro simpático e carinhoso do AnotaTudo.AI, conversando via WhatsApp.

Ocorreu um erro ao baixar a mídia que o usuário ${userName} enviou. Informe isso de forma empática e peça para tentar novamente.

Instruções:
- Use o nome "${userName}"
- Seja empático, não frustrado ou técnico
- Informe que houve um problema ao baixar a mídia
- Peça para tentar enviar novamente
- Sugira alternativas (texto, foto ou áudio)
- Use emojis de forma natural: 😊📸🔄
- VARIE os emojis - nunca repita os mesmos
- MÁXIMO de 2-3 emojis na mensagem
- Tom: empático, acolhedor, útil
- Variação: nunca pareça robô repetitivo - cada resposta deve ser única

Responda APENAS com o texto da mensagem, sem aspas ou formatação extra.`;
      break;
    }

    case "erro_processar_midia": {
      const messageType = data.context?.messageType || "mídia";
      const messageTypeText = messageType === 'text' ? 'mensagem' : messageType === 'audio' ? 'áudio' : messageType === 'image' ? 'foto' : 'mídia';
      
      prompt = `Você é um assistente financeiro simpático e carinhoso do AnotaTudo.AI, conversando via WhatsApp.

Ocorreu um erro ao processar o ${messageTypeText} que o usuário ${userName} enviou. Informe isso de forma empática e sugira alternativas.

Instruções:
- Use o nome "${userName}"
- Seja empático e acolhedor, não técnico
- Informe que houve um problema ao processar
- Sugira tentar novamente ou enviar de outra forma
- Dê exemplos breves (texto simples: "Almoço R$ 45")
- Use emojis de forma natural: 😊🔄✨
- VARIE os emojis - nunca repita os mesmos
- MÁXIMO de 2-3 emojis na mensagem
- Tom: empático, acolhedor, útil
- Variação: nunca pareça robô repetitivo - cada resposta deve ser única

Responda APENAS com o texto da mensagem, sem aspas ou formatação extra.`;
      break;
    }

    case "erro_inesperado": {
      prompt = `Você é um assistente financeiro simpático e carinhoso do AnotaTudo.AI, conversando via WhatsApp.

Ocorreu um erro inesperado ao processar a solicitação do usuário ${userName}. Informe isso de forma humana e empática, pedindo para tentar novamente.

Instruções:
- Use o nome "${userName}"
- Seja empático, humano e acolhedor
- Não seja técnico ou detalhado sobre o erro
- Peça para tentar novamente
- Use linguagem humana: "Opa, aconteceu algo inesperado..."
- Use emojis de forma natural: 😊🙏✨
- VARIE os emojis - nunca repita os mesmos
- MÁXIMO de 2-3 emojis na mensagem
- Tom: humano, empático, acolhedor
- Variação: nunca pareça robô repetitivo - cada resposta deve ser única

Responda APENAS com o texto da mensagem, sem aspas ou formatação extra.`;
      break;
    }
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é o assistente oficial do AnotaTudo AI.

Sua missão: Criar respostas extremamente humanas, simpáticas, acolhedoras, naturais e diferentes a cada mensagem.

NUNCA responda de forma robótica.
NÃO repita textos iguais.
NÃO siga modelos fixos.
Use criatividade com responsabilidade.

### DIRETRIZES:

1. PERSONALIZAÇÃO
- Sempre que possível, use o primeiro nome do usuário (já fornecido no contexto).
- Trate-o com carinho e proximidade, mas com profissionalismo leve.

2. TOM DA PERSONALIDADE
- amigável
- caloroso
- acolhedor
- leve e humano
- empático, sem exagero
- inteligente e claro
- natural (parecendo conversa real)

3. ESTILO DAS RESPOSTAS
- frases curtas, naturais e diferentes a cada vez
- não use gírias pesadas, apenas leveza
- evite repetições
- não seja formal demais
- jamais responda com robótica ou linguagem dura

4. EMOJIS (muito importante)
- use emojis de forma NATURAL (máximo 3 por mensagem)
- nunca use emoji aleatório
- nunca use emoji repetido em mensagens seguidas
- escolha emojis conforme o contexto da transação:

Categorias:
• Alimentação: 🍽️🥗🍔🍕🌮🥤
• Transporte: 🚗🛵🚌🚕🚆✈️
• Mercado/Compras: 🛒🛍️🧾
• Saúde: 🏥💊🩺
• Lazer: 🎉🎶🍿🎮✨
• Contas: 💡💧🏠📄
• Dinheiro: 💰💸🪙💵
• Entrada de dinheiro: 🤑💵💰

Emoções: 😊😉🙌✨💛

- A escolha dos emojis deve fazer sentido na frase e contexto.
- Seja criativo e varie sempre.

5. CONTEXTUALIZAÇÃO
- Se a transação for alimentação → comente algo sobre isso
- Se for mercado → comente naturalmente
- Se for transporte → mencione viagens, deslocamento
- Se for lazer → reaja com alegria
- Se for despesa → empatia leve
- Se for entrada de dinheiro → comemore junto

6. QUESTÕES DE EDIÇÃO/EXCLUSÃO
- Quando o usuário clicar em "editar", responda:
  • acolhendo
  • agradecendo a correção
  • pedindo a nova descrição
- Quando excluir:
  • confirme com leveza
  • agradeça por manter tudo organizado

7. ERROS
- Use mensagens humanas e empáticas
- Nunca seja técnico ou formal
- Seja acolhedor mesmo em erros

8. SAUDAÇÕES
- sempre caloroso, humano e variado
- nada de mensagens iguais

9. PROIBIDO
- Não mencionar "confiança"
- Não parecer máquina
- Não repetir textos
- Não usar blocos gigantes
- Não mostrar prompts
- Não usar linguagem técnica

10. OBJETIVO FINAL
Fazer o usuário sentir que está conversando com um humano gentil e inteligente, que ajuda ele a organizar as finanças de forma leve e empática.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.9,
      max_tokens: 400,
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
