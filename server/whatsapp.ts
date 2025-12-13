import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { storage } from "./storage.js";

const streamPipeline = promisify(pipeline);

const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';

interface SendMessageParams {
  to: string;
  message: string;
}

interface SendTemplateParams {
  to: string;
  templateName: string;
  languageCode: string;
  components: any[];
}

export async function sendWhatsAppMessage({ to, message }: SendMessageParams): Promise<{ success: boolean; messageId?: string }> {
  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const token = process.env.WHATSAPP_TOKEN;

    if (!phoneNumberId || !token) {
      console.error('[WhatsApp] Missing credentials');
      return { success: false };
    }

    const response = await axios.post(
      `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: {
          body: message
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const messageId = response.data?.messages?.[0]?.id;
    console.log('[WhatsApp] Message sent successfully:', response.data);
    return { success: true, messageId };
  } catch (error: any) {
    console.error('[WhatsApp] Error sending message:', error.response?.data || error.message);
    return { success: false };
  }
}

export async function sendWhatsAppTemplate({ to, templateName, languageCode, components }: SendTemplateParams): Promise<boolean> {
  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const token = process.env.WHATSAPP_TOKEN;

    if (!phoneNumberId || !token) {
      console.error('[WhatsApp] Missing credentials');
      return false;
    }

    const response = await axios.post(
      `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode
          },
          components: components
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('[WhatsApp] Template sent successfully:', response.data);
    return true;
  } catch (error: any) {
    console.error('[WhatsApp] Error sending template:', error.response?.data || error.message);
    return false;
  }
}

export async function sendWhatsAppInteractiveMessage(
  to: string,
  bodyText: string,
  buttons: { id: string; title: string }[]
) {
  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const token = process.env.WHATSAPP_TOKEN;

    if (!phoneNumberId || !token) {
      console.error('[WhatsApp] Missing credentials');
      return { success: false };
    }

    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: bodyText },
        action: {
          buttons: buttons.map(btn => ({
            type: "reply",
            reply: { id: btn.id, title: btn.title }
          }))
        }
      }
    };

    const response = await axios.post(
      `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
      payload,
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    const messageId = response.data?.messages?.[0]?.id;
    console.log("[WhatsApp] Interactive message sent:", response.data);

    return { success: true, messageId };

  } catch (error: any) {
    console.error("[WhatsApp] Error sending interactive message:", error.response?.data || error.message);
    return { success: false };
  }
}

export async function sendWhatsAppTransactionMessage(
  to: string,
  content: {
    id: string;
    tipo: string;
    valor: string;
    categoria: string;
    descricao: string;
    data?: string;
  },
  user?: { firstName?: string | null; id?: string; email?: string | null },
  latencyId?: string
) {
  // Formatar data
  let dataFormatada = "Hoje";
  if (content.data) {
    try {
      const dataObj = new Date(content.data + "T00:00:00");
      if (!isNaN(dataObj.getTime())) {
        dataFormatada = dataObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
      }
    } catch (e) {
      // Se falhar, usar "Hoje"
    }
  }
  
  // Formatar valor com vírgula
  const valorFormatado = parseFloat(content.valor).toFixed(2).replace('.', ',');
  
  // Construir headline com nome do usuário
  const userName = user?.firstName ? `${user.firstName}! ✨` : "✨";
  
  // Montar mensagem final no padrão completo conforme exemplo
  const finalMessage = `${userName}

🧾 *Descrição:* ${content.descricao}
💰 *Valor:* R$ ${valorFormatado}
🏷️ *Categoria:* ${content.categoria}
📅 *Data:* ${dataFormatada}

🟢 Registrado com sucesso!

🔧 O que deseja fazer?
• ✏️ Editar transação
• 🗑️ Excluir transação`;

  const responseQueuedAt = new Date();
  
  // Registrar responseQueuedAt ANTES de enviar (se temos latencyId)
  if (latencyId) {
    try {
      await storage.updateWhatsAppLatency(latencyId, { responseQueuedAt });
      
      // Logar evento
      const { logClientEvent, EventTypes } = await import("./clientLogger.js");
      const latency = await storage.getWhatsAppLatencyById(latencyId);
      if (latency?.userId) {
        await logClientEvent(latency.userId, EventTypes.WHATSAPP_RESPONSE_SENT, `Resposta rica de transação enviada ao WhatsApp`, {
          to,
          latencyId,
          transactionId: content.id,
          responseQueuedAt: responseQueuedAt.toISOString(),
        });
      }
    } catch (error) {
      console.error(`[WhatsApp] Erro ao atualizar responseQueuedAt para latency ${latencyId}:`, error);
    }
  }

  const result = await sendWhatsAppInteractiveMessage(
    to,
    finalMessage,
    [
      { id: `edit_${content.id}`, title: "✏️ Editar transação" },
      { id: `delete_${content.id}`, title: "🗑️ Excluir transação" }
    ]
  );

  // Se temos latencyId e messageId da resposta, atualizar responseMessageId
  if (latencyId && result.success && result.messageId) {
    try {
      await storage.updateWhatsAppLatency(latencyId, { responseMessageId: result.messageId });
    } catch (error) {
      console.error(`[WhatsApp] Erro ao atualizar responseMessageId:`, error);
    }
  }

  return result;
}

/**
 * Envia mensagem de transação excluída com formato estruturado
 */
export async function sendWhatsAppTransactionDeletedMessage(
  to: string,
  transaction: {
    descricao: string;
    valor: string;
    categoria: string;
    dataReal?: string;
  },
  user?: { firstName?: string | null; id?: string; email?: string | null }
) {
  const { generateAIResponse } = await import("./ai.js");
  const { pickEmoji } = await import("./emoji.js");
  
  // Gerar apenas a headline via IA
  const headlineText = await generateAIResponse("exclusao_confirmada", {
    user: user ? {
      id: user.id,
      firstName: user.firstName,
      email: user.email
    } : undefined
  });
  
  // Pegar emojis conforme categoria
  const emojis = pickEmoji(transaction.categoria);
  
  // Formatar data
  let dataFormatada = "Hoje";
  if (transaction.dataReal) {
    try {
      const dataObj = new Date(transaction.dataReal + "T00:00:00");
      if (!isNaN(dataObj.getTime())) {
        dataFormatada = dataObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
      }
    } catch (e) {
      // Se falhar, usar "Hoje"
    }
  }
  
  // Construir headline final
  const headline = `${headlineText} ${emojis}`;
  
  // Montar mensagem final
  const finalMessage = `${headline}

🧾 *Descrição:* ${transaction.descricao}
💰 *Valor:* R$ ${transaction.valor}
🏷️ *Categoria:* ${transaction.categoria}
📅 *Data:* ${dataFormatada}

🗑️ Excluída com sucesso!
`;

  return await sendWhatsAppReply(to, finalMessage);
}

// Helper to send replies to users
export async function sendWhatsAppReply(to: string, message: string, latencyId?: string): Promise<{ success: boolean; messageId?: string }> {
  const responseQueuedAt = new Date();
  
  // Registrar responseQueuedAt ANTES de enviar
  if (latencyId) {
    try {
      const { storage } = await import("./storage.js");
      await storage.updateWhatsAppLatency(latencyId, { responseQueuedAt });
      
      // Logar evento - buscar userId do latency via storage
      const { logClientEvent, EventTypes } = await import("./clientLogger.js");
      const latency = await storage.getWhatsAppLatencyById(latencyId);
      if (latency?.userId) {
        await logClientEvent(latency.userId, EventTypes.WHATSAPP_RESPONSE_SENT, `Resposta enviada ao WhatsApp`, {
          to,
          latencyId,
          responseQueuedAt: responseQueuedAt.toISOString(),
        });
      }
    } catch (error) {
      console.error(`[WhatsApp] Erro ao atualizar responseQueuedAt para latency ${latencyId}:`, error);
    }
  }
  
  const result = await sendWhatsAppMessage({ to, message });
  
  // Se temos latencyId e messageId da resposta, atualizar responseMessageId
  if (latencyId && result.success && result.messageId) {
    try {
      const { storage } = await import("./storage.js");
      await storage.updateWhatsAppLatency(latencyId, { responseMessageId: result.messageId });
    } catch (error) {
      console.error(`[WhatsApp] Erro ao atualizar responseMessageId:`, error);
    }
  }
  
  return result;
}

// Email validation regex
export function isValidEmail(text: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(text.trim());
}

// Extract email from message text
export function extractEmail(text: string): string | null {
  const trimmed = text.trim().toLowerCase();
  if (isValidEmail(trimmed)) {
    return trimmed;
  }
  
  // Try to find email in longer text
  const emailRegex = /([^\s@]+@[^\s@]+\.[^\s@]+)/;
  const match = text.match(emailRegex);
  return match ? match[1].toLowerCase() : null;
}

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(phoneNumber: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const key = phoneNumber;
  
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetAt) {
    // Reset or create new window
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    console.log(`[Rate Limit] ${phoneNumber} exceeded ${maxRequests} requests in ${windowMs}ms`);
    return false;
  }
  
  record.count++;
  return true;
}

export function normalizePhoneNumber(phone: string): string {
  let normalized = phone.replace(/\D/g, '');
  
  if (normalized.startsWith('0')) {
    normalized = normalized.substring(1);
  }
  
  if (!normalized.startsWith('55') && normalized.length === 11) {
    normalized = '55' + normalized;
  }
  
  return normalized;
}

/**
 * Download media file from WhatsApp Cloud API
 * Returns the local file path where the media was saved
 */
export async function downloadWhatsAppMedia(mediaId: string, mediaType: 'audio' | 'image' | 'video'): Promise<string> {
  try {
    const token = process.env.WHATSAPP_TOKEN;

    if (!token) {
      throw new Error('WHATSAPP_TOKEN not configured');
    }

    // Step 1: Get media URL
    console.log(`[WhatsApp] Getting media URL for ID: ${mediaId}`);
    const mediaInfoResponse = await axios.get(
      `${WHATSAPP_API_URL}/${mediaId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const mediaUrl = mediaInfoResponse.data.url;
    const mimeType = mediaInfoResponse.data.mime_type;
    
    console.log(`[WhatsApp] Media URL obtained: ${mediaUrl}`);
    console.log(`[WhatsApp] MIME type: ${mimeType}`);

    // Step 2: Download the actual file
    const mediaResponse = await axios.get(mediaUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      responseType: 'stream'
    });

    // Step 3: Save to temporary directory
    const tempDir = '/tmp/whatsapp_media';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Determine file extension
    let extension = '';
    if (mediaType === 'audio') {
      extension = mimeType.includes('ogg') ? '.ogg' : '.mp3';
    } else if (mediaType === 'image') {
      extension = mimeType.includes('png') ? '.png' : '.jpg';
    } else if (mediaType === 'video') {
      extension = '.mp4';
    }

    const filePath = path.join(tempDir, `${mediaId}${extension}`);
    
    // Save file
    await streamPipeline(mediaResponse.data, fs.createWriteStream(filePath));
    
    console.log(`[WhatsApp] Media saved to: ${filePath}`);
    return filePath;

  } catch (error: any) {
    console.error('[WhatsApp] Error downloading media:', error.response?.data || error.message);
    throw new Error(`Failed to download WhatsApp media: ${error.message}`);
  }
}

// ========================================
// DEPRECATED: MESSAGES NOW GENERATED BY AI
// ========================================
// All messages are now dynamically generated by OpenAI using generateAIResponse()
// The randomMessage function is kept for backward compatibility but should not be used.
// Use sendAIMessage() instead.

/**
 * @deprecated Use sendAIMessage() instead. All messages are now AI-generated.
 * Kept for backward compatibility only.
 */
export function randomMessage(messages: string[]): string {
  if (messages.length === 0) return "";
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

/**
 * Envia mensagem gerada por IA via WhatsApp
 * @param to Número do destinatário
 * @param type Tipo de mensagem a ser gerada
 * @param data Dados para geração da mensagem
 * @param buttons Botões opcionais (para mensagens interativas)
 * @param latencyId ID de latência opcional
 */
export async function sendAIMessage(
  to: string,
  type: string,
  data: any = {},
  buttons?: { id: string; title: string }[],
  latencyId?: string
): Promise<{ success: boolean; messageId?: string }> {
  try {
    const { generateAIResponse } = await import("./ai.js");
    
    // Gerar mensagem usando IA
    const messageText = await generateAIResponse(type as any, data);
    
    // Se há botões, usar mensagem interativa
    if (buttons && buttons.length > 0) {
      return await sendWhatsAppInteractiveMessage(to, messageText, buttons);
    }
    
    // Caso contrário, usar mensagem simples
    return await sendWhatsAppReply(to, messageText, latencyId);
  } catch (error: any) {
    console.error("[WhatsApp] Erro ao enviar mensagem IA:", error);
    
    // Fallback para mensagem simples em caso de erro - usar IA mesmo no fallback
    try {
      const { generateAIResponse } = await import("./ai.js");
      const fallbackMessage = await generateAIResponse("erro_inesperado", {
        user: { firstName: null, id: undefined, email: null }
      });
      return await sendWhatsAppReply(to, fallbackMessage, latencyId);
    } catch (fallbackError) {
      // Último recurso: mensagem mínima
      return await sendWhatsAppReply(to, "Opa, aconteceu algo inesperado. Pode tentar novamente? 😊", latencyId);
    }
  }
}
