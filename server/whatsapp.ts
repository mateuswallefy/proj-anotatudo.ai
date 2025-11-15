import axios from 'axios';

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

export async function sendWhatsAppMessage({ to, message }: SendMessageParams): Promise<boolean> {
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

    console.log('[WhatsApp] Message sent successfully:', response.data);
    return true;
  } catch (error: any) {
    console.error('[WhatsApp] Error sending message:', error.response?.data || error.message);
    return false;
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
export async function sendWhatsAppReply(to: string, message: string): Promise<boolean> {
  return await sendWhatsAppMessage({ to, message });
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
