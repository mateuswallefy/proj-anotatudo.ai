import OpenAI from "openai";
import fs from "fs";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
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
export async function classifyTextMessage(text: string): Promise<TransacaoExtractedData> {
  const today = new Date().toISOString().split('T')[0];
  
  const prompt = `Você é um assistente financeiro especializado em interpretar mensagens sobre transações financeiras.

Analise a seguinte mensagem e extraia os dados estruturados:

Mensagem: "${text}"

Data de hoje: ${today}

Extraia e retorne um JSON com:
- tipo: "entrada" (receita/ganho) ou "saida" (despesa/gasto)
- categoria: uma das opções: Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Compras, Contas, Salário, Investimentos, Outros
- valor: número com 2 casas decimais (ou null se não identificado)
- dataReal: data no formato YYYY-MM-DD (use hoje se não especificada)
- descricao: descrição clara e objetiva da transação
- confianca: número de 0 a 1 indicando sua confiança na interpretação

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
      model: "gpt-5",
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
export async function transcribeAndClassifyAudio(audioFilePath: string): Promise<TransacaoExtractedData> {
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
    return await classifyTextMessage(text);
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
      model: "gpt-5",
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
  content: string // pode ser texto, base64, ou caminho de arquivo
): Promise<TransacaoExtractedData> {
  switch (messageType) {
    case 'text':
      return await classifyTextMessage(content);
    
    case 'audio':
      return await transcribeAndClassifyAudio(content);
    
    case 'image':
      return await analyzeImageForFinancialData(content);
    
    case 'video':
      return await analyzeVideoForFinancialData(content);
    
    default:
      throw new Error("Tipo de mensagem não suportado");
  }
}
