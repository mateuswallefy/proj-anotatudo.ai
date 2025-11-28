import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { db } from "./db.js";
import { whatsappLatency } from "../shared/schema.js";
import { eq } from "drizzle-orm";

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

// Helper to send replies to users
export async function sendWhatsAppReply(to: string, message: string, latencyId?: string): Promise<{ success: boolean; messageId?: string }> {
  const responseQueuedAt = new Date();
  
  // Registrar responseQueuedAt ANTES de enviar
  if (latencyId) {
    try {
      const { storage } = await import("./storage.js");
      await storage.updateWhatsAppLatency(latencyId, { responseQueuedAt });
      
      // Logar evento
      const { logClientEvent, EventTypes } = await import("./clientLogger.js");
      const latency = await db.select().from(whatsappLatency).where(eq(whatsappLatency.id, latencyId)).limit(1);
      if (latency[0]?.userId) {
        await logClientEvent(latency[0].userId, EventTypes.WHATSAPP_RESPONSE_SENT, `Resposta enviada ao WhatsApp`, {
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
// HUMANIZED MESSAGES - Random selection
// ========================================

/**
 * Selects a random message from an array
 */
export function randomMessage(messages: string[]): string {
  if (messages.length === 0) return "";
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

// Messages to ask for email (variations)
export const ASK_EMAIL_MESSAGES = [
  "Oi! 😊 Para liberar seu acesso, me manda o e-mail que você usou na compra, por favor.",
  "Claro! Só preciso do seu e-mail para localizar seu cadastro. 📩",
  "Me envia seu e-mail que eu libero seu acesso rapidinho! 🙌",
  "Qual e-mail você usou na compra? Me manda que eu já ativo. 😉",
  "Perfeito! Me diz qual é o seu e-mail cadastrado?",
];

// Messages when email is not found
export const EMAIL_NOT_FOUND_MESSAGES = [
  "😕 Não achei esse e-mail aqui. Consegue conferir se digitou certinho?",
  "Ops! Não encontrei esse e-mail no meu sistema. Pode ver se está igual ao da compra?",
  "Ainda não localizei esse e-mail. Se quiser, me manda outro que você use com mais frequência. 🙂",
  "Hmm, esse e-mail não está cadastrado ainda. Pode verificar e me enviar novamente?",
  "Não consegui encontrar esse e-mail. Tenta me mandar de novo, por favor? 😊",
];

// Messages for backend errors
export const ERROR_MESSAGES = [
  "Opa, acho que deu um errinho aqui… já tenta novamente, por favor? 🙏",
  "Tive um problema momentâneo, pode repetir? 😊",
  "Aconteceu algo inesperado, mas já estou pronto de novo. Me manda o e-mail mais uma vez?",
];

// Messages for initial greetings (oi, olá, etc.)
export const GREETING_RESPONSES = [
  "Oi! 😊 Tudo bem? Para liberar seu acesso, me manda o e-mail que você usou na compra, por favor.",
  "Olá! 🙌 Me envia seu e-mail que eu libero seu acesso rapidinho.",
  "Oi! Vou te ajudar agora. Qual e-mail você usou na compra?",
  "Olá! 😊 Para começar, me manda seu e-mail cadastrado, por favor.",
];

// Messages for non-text messages while awaiting email
export const NON_TEXT_WHILE_AWAITING_EMAIL = [
  "Claro! Me diz qual e-mail você usou na compra? 😊",
  "Perfeito, só preciso do seu e-mail para localizar seu acesso. 📩",
  "Me manda o e-mail que você usa no AnotaTudo? 🙌",
];
