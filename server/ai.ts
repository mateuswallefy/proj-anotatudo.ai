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
 * Detecta se uma mensagem é sobre um evento/compromisso e extrai dados
 */
export async function detectEventoInMessage(text: string): Promise<EventoExtractedData> {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const prompt = `Você é um assistente especializado em detectar compromissos e eventos em mensagens.

Analise a seguinte mensagem e determine se ela menciona um compromisso, evento, reunião ou algo que precisa ser lembrado em uma data/hora específica:

Mensagem: "${text}"

Data de hoje: ${todayStr}

Responda com JSON válido:
{
  "isEvento": boolean (true se a mensagem menciona um compromisso/evento, false caso contrário),
  "titulo": string (título do evento, se detectado),
  "descricao": string (descrição adicional, se houver),
  "data": "YYYY-MM-DD" (data do evento, use hoje se não especificada mas mencionar "hoje", use amanhã se mencionar "amanhã", etc.),
  "hora": "HH:mm" (hora do evento, se mencionada, ou null),
  "confianca": number (0 a 1, confiança na detecção)
}

Exemplos de eventos:
- "Amanhã tenho reunião às 15h"
- "Reunião com cliente na terça às 10h"
- "Consulta médica dia 20 às 14:30"
- "Não esqueça: pagar conta no dia 15"

Responda APENAS com JSON válido.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é um especialista em detectar compromissos e eventos. Sempre responda com JSON válido."
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
    return {
      isEvento: false,
      confianca: 0,
    };
  }
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
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é o assistente oficial do AnotaTudo AI.

Sua missão: Criar HEADLINES (títulos/frases principais) extremamente humanas, simpáticas, acolhedoras, naturais e diferentes a cada mensagem.

⚠️ REGRAS CRÍTICAS:

Você NUNCA deve gerar emojis.
Você NUNCA deve gerar estrutura de mensagem.
Você NUNCA deve gerar bullets, listas ou blocos.
Você gera APENAS a frase principal (headline) da mensagem.
A estrutura, emojis e formatação são adicionados pelo servidor.

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

3. ESTILO DAS HEADLINES
- frases curtas, naturais e diferentes a cada vez (máximo 1-2 frases)
- não use gírias pesadas, apenas leveza
- evite repetições
- não seja formal demais
- jamais responda com robótica ou linguagem dura
- APENAS a headline, sem detalhes adicionais

4. CONTEXTUALIZAÇÃO
- Se a transação for alimentação → comente algo sobre isso brevemente
- Se for mercado → comente naturalmente
- Se for transporte → mencione viagens, deslocamento
- Se for lazer → reaja com alegria
- Se for despesa → empatia leve
- Se for entrada de dinheiro → comemore junto

5. PROIBIDO
- NÃO gerar emojis (o servidor adiciona)
- NÃO gerar estrutura (descrição, valor, categoria - o servidor adiciona)
- NÃO mencionar "confiança", "probabilidade", "processamento" ou termos técnicos
- NÃO parecer máquina
- NÃO repetir textos
- NÃO usar blocos ou listas
- NÃO mostrar prompts
- NÃO usar linguagem técnica

6. EXEMPLOS DE HEADLINES (apenas o texto, sem emojis ou estrutura):

✓ "Mateus, ótimo registro!"
✓ "Perfeito, transação anotada!"
✓ "Anotado com sucesso, João!"
✓ "Ótimo, tudo registrado!"
✓ "Transação salva com sucesso!"

✗ "Mateus, ótimo registro! 💰 Descrição: ..." (NÃO - apenas a headline)

7. OBJETIVO FINAL
Gerar apenas uma headline natural, única e humanizada. O servidor completa o resto.`
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
