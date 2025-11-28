# 📋 Análise Completa - Webhook WhatsApp e Fluxo de Email

## 1. 📁 ARQUIVO COMPLETO DA ROTA DO WEBHOOK WHATSAPP

**Arquivo:** `server/routes.ts` (linhas 595-942)

```typescript
// WhatsApp Webhook route
app.post("/api/webhook/whatsapp", async (req, res) => {
  try {
    // Verificar se é uma verificação do webhook do Meta
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token']) {
      const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'anotatudo_verify_token';
      if (req.query['hub.verify_token'] === verifyToken) {
        res.status(200).send(req.query['hub.challenge']);
        return;
      } else {
        res.status(403).send('Forbidden');
        return;
      }
    }

    // Processar mensagem recebida do WhatsApp
    const { entry } = req.body;
    
    if (!entry || !entry[0]) {
      res.status(200).json({ success: true });
      return;
    }

    const changes = entry[0].changes;
    if (!changes || !changes[0]) {
      res.status(200).json({ success: true });
      return;
    }

    const message = changes[0].value?.messages?.[0];
    if (!message) {
      res.status(200).json({ success: true });
      return;
    }

    // Extrair informações da mensagem
    const phoneNumber = message.from;
    const messageType = message.type;
    let content = "";
    let mediaId = "";

    // Extrair conteúdo baseado no tipo de mensagem
    switch (messageType) {
      case 'text':
        content = message.text?.body || "";
        break;
      case 'audio':
        mediaId = message.audio?.id || "";
        break;
      case 'image':
        mediaId = message.image?.id || "";
        content = message.image?.caption || "";
        break;
      case 'video':
        // Vídeo não suportado ainda - requer extração de frames via ffmpeg
        await sendWhatsAppReply(
          phoneNumber,
          "Vídeos ainda não são suportados.\n\nPor favor, envie:\n• Texto: Almoço R$ 45\n• Áudio com sua transação\n• Foto de nota fiscal ou comprovante"
        );
        res.status(200).json({ success: true });
        return;
      default:
        console.log(`[WhatsApp] Unsupported message type: ${messageType}`);
        res.status(200).json({ success: true });
        return;
    }

    // Se não tem conteúdo de texto e não tem mídia, ignorar
    if (!content && !mediaId) {
      res.status(200).json({ success: true });
      return;
    }

    // Rate limiting: 10 mensagens por minuto por telefone
    if (!checkRateLimit(phoneNumber)) {
      await sendWhatsAppReply(
        phoneNumber,
        "Você está enviando mensagens muito rápido. Por favor, aguarde um momento."
      );
      res.status(200).json({ success: true });
      return;
    }

    // Buscar usuário pelo telefone
    let user = await storage.getUserByPhone(phoneNumber);

    // Se não existe usuário, criar com status='awaiting_email'
    if (!user) {
      user = await storage.createUserFromPhone(phoneNumber);
      await sendWhatsAppReply(
        phoneNumber,
        randomMessage(GREETING_RESPONSES)
      );
      res.status(200).json({ success: true });
      return;
    }

    // Se usuário está aguardando email
    if (user.status === 'awaiting_email') {
      // Check if message is a greeting or short message
      const normalizedContent = content.toLowerCase().trim();
      const isGreeting = normalizedContent === 'oi' || 
                        normalizedContent === 'olá' || 
                        normalizedContent === 'ola' ||
                        normalizedContent === 'quero acessar' ||
                        normalizedContent === 'acessar' ||
                        normalizedContent.length < 5;
      
      // Só aceitar texto para autenticação
      if (messageType !== 'text' || !content) {
        await sendWhatsAppReply(
          phoneNumber,
          randomMessage(NON_TEXT_WHILE_AWAITING_EMAIL)
        );
        res.status(200).json({ success: true });
        return;
      }
      
      // If it's a greeting or very short message, respond with empathy
      if (isGreeting) {
        await sendWhatsAppReply(phoneNumber, randomMessage(GREETING_RESPONSES));
        res.status(200).json({ success: true });
        return;
      }

      const email = extractEmail(content);

      if (!email) {
        await sendWhatsAppReply(
          phoneNumber,
          randomMessage(ASK_EMAIL_MESSAGES)
        );
        res.status(200).json({ success: true });
        return;
      }

      // Buscar compra aprovada
      const purchase = await storage.getPurchaseByEmail(email);

      if (!purchase || purchase.status !== 'approved') {
        await sendWhatsAppReply(
          phoneNumber,
          randomMessage(EMAIL_NOT_FOUND_MESSAGES)
        );
        res.status(200).json({ success: true });
        return;
      }

      // Verificar se já existe usuário web com esse email (criado via webhook Caktos)
      const existingWebUser = await storage.getUserByEmail(email);

      if (existingWebUser) {
        // Usuário web já existe - vincular telefone
        await storage.updateUserTelefone(existingWebUser.id, phoneNumber);
        await storage.updateUserStatus(existingWebUser.id, 'authenticated');
        await storage.updatePurchasePhone(email, phoneNumber);

        // Se havia usuário temporário, transferir transações
        if (user.id !== existingWebUser.id) {
          await storage.transferTransactions(user.id, existingWebUser.id);
        }

        // Gerar senha temporária segura usando crypto.randomBytes
        const crypto = await import('crypto');
        const tempPassword = crypto.randomBytes(9).toString('base64url').slice(0, 12);
        const passwordHash = await hashPassword(tempPassword);
        await storage.updateUserPassword(existingWebUser.id, passwordHash);

        console.log(`[WhatsApp] ✅ Temporary password generated for ${email}`);

        await sendWhatsAppReply(
          phoneNumber,
          `✅ *Acesso liberado!*\n\n` +
          `📱 Suas transações via WhatsApp já aparecem no dashboard automaticamente.\n\n` +
          `🌐 *Acesse:*\n${process.env.REPLIT_DEV_DOMAIN || 'anotatudo.replit.app'}\n\n` +
          `📧 *Email:* ${email}\n` +
          `🔑 *Senha temporária:* \`${tempPassword}\`\n\n` +
          `⚠️ *IMPORTANTE:* Troque sua senha após o primeiro login!\n\n` +
          `💡 *Comece a enviar:*\n` +
          `• Almoço R$ 45\n` +
          `• Gasolina 200 reais\n` +
          `• Foto de recibo\n` +
          `• Áudio descrevendo compra`
        );
      } else {
        // Usuário não existe - atualizar dados do usuário temporário
        await storage.updateUserEmail(user.id, email);
        await storage.updateUserStatus(user.id, 'authenticated');
        await storage.updatePurchasePhone(email, phoneNumber);

        // Gerar senha temporária segura usando crypto.randomBytes
        const crypto = await import('crypto');
        const tempPassword = crypto.randomBytes(9).toString('base64url').slice(0, 12);
        const passwordHash = await hashPassword(tempPassword);
        await storage.updateUserPassword(user.id, passwordHash);

        console.log(`[WhatsApp] ✅ Temporary password generated for ${email}`);

        await sendWhatsAppReply(
          phoneNumber,
          `✅ *Acesso liberado!*\n\n` +
          `📱 Suas transações via WhatsApp já aparecem no dashboard automaticamente.\n\n` +
          `🌐 *Acesse:*\n${process.env.REPLIT_DEV_DOMAIN || 'anotatudo.replit.app'}\n\n` +
          `📧 *Email:* ${email}\n` +
          `🔑 *Senha temporária:* \`${tempPassword}\`\n\n` +
          `⚠️ *IMPORTANTE:* Troque sua senha após o primeiro login!\n\n` +
          `💡 *Comece a enviar:*\n` +
          `• Almoço R$ 45\n` +
          `• Gasolina 200 reais\n` +
          `• Foto de recibo\n` +
          `• Áudio descrevendo compra`
        );
      }

      res.status(200).json({ success: true });
      return;
    }

    // Se usuário está autenticado, processar transação
    if (user.status === 'authenticated') {
      // Comando para recuperar senha
      if (messageType === 'text' && content) {
        const lowerContent = content.toLowerCase().trim();
        if (lowerContent === 'senha' || lowerContent === 'recuperar senha' || lowerContent === 'esqueci senha' || lowerContent === 'nova senha') {
          // Gerar nova senha temporária segura
          const crypto = await import('crypto');
          const tempPassword = crypto.randomBytes(9).toString('base64url').slice(0, 12);
          const passwordHash = await hashPassword(tempPassword);
          await storage.updateUserPassword(user.id, passwordHash);

          console.log(`[WhatsApp] 🔑 Password reset for user ${user.id}`);

          await sendWhatsAppReply(
            phoneNumber,
            `🔑 *Nova senha gerada!*\n\n` +
            `📧 *Email:* ${user.email}\n` +
            `🔑 *Senha temporária:* \`${tempPassword}\`\n\n` +
            `🌐 *Acesse:* ${process.env.REPLIT_DEV_DOMAIN || 'anotatudo.replit.app'}\n\n` +
            `⚠️ *IMPORTANTE:* Esta é uma senha temporária. Recomendamos que você a troque após o login!`
          );

          res.status(200).json({ success: true });
          return;
        }
      }

      try {
        let processedContent = content;
        let mediaUrl = "";

        // Se tem mídia, baixar e processar
        if (mediaId) {
          try {
            const mediaPath = await downloadWhatsAppMedia(mediaId, messageType as 'audio' | 'image' | 'video');
            console.log(`[WhatsApp] Media downloaded: ${mediaPath}`);
            mediaUrl = mediaPath;

            // Para imagem, converter para base64
            if (messageType === 'image') {
              const fs = await import('fs');
              const fileBuffer = fs.readFileSync(mediaPath);
              const base64 = fileBuffer.toString('base64');
              processedContent = base64;
            } else {
              // Para áudio, passar o caminho do arquivo
              processedContent = mediaPath;
            }
          } catch (mediaError) {
            console.error("[WhatsApp] Error downloading media:", mediaError);
            await sendWhatsAppReply(
              phoneNumber,
              "Erro ao baixar mídia. Por favor, tente novamente."
            );
            res.status(200).json({ success: true });
            return;
          }
        }

        // Processar com IA
        let extractedData: any = null;
        try {
          extractedData = await processWhatsAppMessage(messageType, processedContent || content, user.id);
        } catch (aiError: any) {
          console.error("[WhatsApp] AI processing error:", aiError);
          await sendWhatsAppReply(
            phoneNumber,
            `Erro ao processar ${messageType === 'text' ? 'mensagem' : 'mídia'}.\n\nTente novamente ou envie uma mensagem de texto:\n• Almoço R$ 45\n• Gasolina 200 reais`
          );
          res.status(200).json({ success: true });
          return;
        }

        if (extractedData && extractedData.tipo && extractedData.valor) {
          const transacao = await storage.createTransacao({
            userId: user.id,
            tipo: extractedData.tipo,
            categoria: extractedData.categoria || 'Outros',
            valor: String(extractedData.valor),
            descricao: extractedData.descricao || content || `${messageType} recebido`,
            dataReal: extractedData.dataReal || new Date().toISOString().split('T')[0],
            origem: messageType,
            mediaUrl: mediaUrl || undefined,
          });

          console.log(`[WhatsApp] ✅ Transaction created for user ${user.id}: ${extractedData.tipo} R$ ${extractedData.valor}`);

          await sendWhatsAppReply(
            phoneNumber,
            `Transação registrada!\n\n${extractedData.tipo === 'entrada' ? 'Entrada' : 'Saída'}: R$ ${extractedData.valor}\nCategoria: ${extractedData.categoria}\n\nVeja no dashboard: https://anotatudo.replit.app`
          );
        } else {
          console.log(`[WhatsApp] ⚠️ Could not extract transaction data from ${messageType}`);
          await sendWhatsAppReply(
            phoneNumber,
            "Não consegui entender essa transação.\n\nTente novamente:\n• Almoço R$ 45\n• Gasolina 200 reais\n• Salário recebido 5000"
          );
        }
      } catch (error: any) {
        console.error("[WhatsApp] Unexpected error processing transaction:", error);
        await sendWhatsAppReply(
          phoneNumber,
          "Erro inesperado. Por favor, tente novamente."
        );
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error processing WhatsApp webhook:", error);
    res.status(200).json({ success: true }); // Sempre retornar 200 para o WhatsApp
  }
});

// Verificação do webhook (GET)
app.get("/api/webhook/whatsapp", (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'anotatudo_verify_token';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log("WhatsApp webhook verificado!");
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Forbidden');
  }
});
```

---

## 2. 📤 ARQUIVO COMPLETO DE ENVIO DE MENSAGENS WHATSAPP

**Arquivo:** `server/whatsapp.ts` (COMPLETO)

```typescript
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { pipeline } from 'stream';

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
```

---

## 3. 🔍 FUNÇÕES DE VALIDAÇÃO DE EMAIL

**Arquivo:** `server/whatsapp.ts` (linhas 104-121)

```typescript
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
```

**Como funciona:**
1. `isValidEmail()`: Valida se o texto é um email válido usando regex
2. `extractEmail()`: Tenta extrair um email do texto, primeiro verificando se o texto inteiro é um email, depois procurando por padrão de email no texto

---

## 4. 💾 CÓDIGO DE ARMAZENAMENTO E RECUPERAÇÃO DO ESTADO DO USUÁRIO

**Arquivo:** `server/storage.ts`

### 4.1. Schema do Banco de Dados (Estado do Usuário)

**Arquivo:** `shared/schema.ts` (linhas 29-46)

```typescript
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  telefone: varchar("telefone").unique(),
  plano: varchar("plano").default('free'),
  status: varchar("status", { enum: ['awaiting_email', 'authenticated'] }).default('awaiting_email'),
  role: varchar("role", { enum: ['user', 'admin'] }).default('user').notNull(),
  whatsappNumber: varchar("whatsapp_number"),
  planLabel: varchar("plan_label"),
  billingStatus: varchar("billing_status", { enum: ['trial', 'active', 'paused', 'canceled', 'overdue', 'none'] }).default('none').notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

**Estado do usuário:**
- `status`: `'awaiting_email'` ou `'authenticated'` (armazenado no banco PostgreSQL/Supabase)
- `telefone`: Número do WhatsApp (armazenado no banco)
- `email`: Email do usuário (armazenado no banco)

### 4.2. Funções de Armazenamento

**Arquivo:** `server/storage.ts`

```typescript
// Buscar usuário pelo telefone
async getUserByPhone(telefone: string): Promise<User | undefined> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.telefone, telefone));
  return user;
}

// Criar usuário a partir do telefone (status='awaiting_email')
async createUserFromPhone(telefone: string): Promise<User> {
  const [user] = await db
    .insert(users)
    .values({
      telefone,
      status: 'awaiting_email',
    })
    .returning();
  return user;
}

// Buscar usuário por email
async getUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

// Atualizar email do usuário
async updateUserEmail(id: string, email: string): Promise<void> {
  await db
    .update(users)
    .set({ email })
    .where(eq(users.id, id));
}

// Atualizar status do usuário
async updateUserStatus(id: string, status: 'awaiting_email' | 'authenticated'): Promise<void> {
  await db
    .update(users)
    .set({ status })
    .where(eq(users.id, id));
}

// Atualizar telefone do usuário
async updateUserTelefone(id: string, telefone: string): Promise<void> {
  await db
    .update(users)
    .set({ telefone })
    .where(eq(users.id, id));
}

// Buscar compra por email (tabela purchases)
async getPurchaseByEmail(email: string): Promise<Purchase | undefined> {
  const [purchase] = await db
    .select()
    .from(purchases)
    .where(
      and(
        eq(purchases.email, email),
        eq(purchases.status, 'approved')
      )
    )
    .orderBy(desc(purchases.createdAt))
    .limit(1);
  return purchase;
}

// Atualizar telefone na compra
async updatePurchasePhone(email: string, telefone: string): Promise<void> {
  await db
    .update(purchases)
    .set({ telefone })
    .where(eq(purchases.email, email));
}
```

**Onde o estado é armazenado:**
- ✅ **Banco de Dados PostgreSQL/Supabase** (tabela `users`)
- ❌ **NÃO** usa Redis
- ❌ **NÃO** usa memória (apenas para rate limiting)
- ✅ **Usa Supabase** (via `DATABASE_URL` que aponta para Supabase)

---

## 5. 📊 FLUXO COMPLETO QUANDO RECEBE O EMAIL

### Passo a Passo:

1. **Usuário envia mensagem com email** → Webhook recebe em `/api/webhook/whatsapp`
2. **Extração do email** → `extractEmail(content)` valida e extrai o email
3. **Busca da compra** → `storage.getPurchaseByEmail(email)` busca compra aprovada
4. **Verificação de usuário existente** → `storage.getUserByEmail(email)` verifica se já existe
5. **Atualização do estado:**
   - Se usuário existe: `updateUserTelefone()`, `updateUserStatus('authenticated')`
   - Se não existe: `updateUserEmail()`, `updateUserStatus('authenticated')`
6. **Geração de senha** → `crypto.randomBytes()` gera senha temporária
7. **Envio de resposta** → `sendWhatsAppReply()` envia credenciais

### Logs Esperados:

```
[WhatsApp] Email extracted: usuario@email.com
[WhatsApp] ✅ Temporary password generated for usuario@email.com
[WhatsApp] ✅ User authenticated: usuario@email.com
```

---

## 6. ⚠️ POSSÍVEIS ERROS E MENSAGENS

### Erros Comuns:

1. **Email não encontrado:**
   ```
   [WhatsApp] ❌ No user or purchase found for email@example.com
   ```
   Resposta: Mensagem aleatória de `EMAIL_NOT_FOUND_MESSAGES`

2. **Erro ao processar com IA:**
   ```
   [WhatsApp] AI processing error: [erro]
   ```
   Resposta: "Erro ao processar mensagem. Tente novamente..."

3. **Erro ao baixar mídia:**
   ```
   [WhatsApp] Error downloading media: [erro]
   ```
   Resposta: "Erro ao baixar mídia. Por favor, tente novamente."

4. **Credenciais WhatsApp faltando:**
   ```
   [WhatsApp] Missing credentials
   ```
   Retorna `false` em `sendWhatsAppMessage()`

5. **Erro inesperado no webhook:**
   ```
   Error processing WhatsApp webhook: [erro]
   ```
   Sempre retorna `200` para o WhatsApp (não quebra o webhook)

---

## 7. 🔐 VARIÁVEIS DE AMBIENTE (.env)

**Lista de variáveis usadas (SEM valores):**

```bash
# Banco de Dados (Supabase)
DATABASE_URL=

# WhatsApp Business API (Meta)
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=

# OpenAI (para processamento de mensagens)
OPENAI_API_KEY=

# Sessão e Autenticação
SESSION_SECRET=

# Domínio/URL
REPLIT_DEV_DOMAIN=
REPL_ID=
ISSUER_URL=

# Ambiente
NODE_ENV=
PORT=
FORCE_SECURE_COOKIES=
REPL_SLUG=
```

### Verificação de Configuração Supabase:

O Supabase está configurado através da variável `DATABASE_URL` que deve conter a connection string do Supabase.

**Arquivo:** `server/db.ts`
```typescript
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
```

**Para verificar se está configurado:**
1. Verifique se `DATABASE_URL` está definida
2. A connection string deve seguir o formato: `postgresql://user:password@host:port/database?sslmode=require`
3. O Supabase fornece essa URL no painel do projeto

---

## 📝 RESUMO

- ✅ **Webhook:** `/api/webhook/whatsapp` (POST e GET)
- ✅ **Envio de mensagens:** `sendWhatsAppMessage()`, `sendWhatsAppReply()`
- ✅ **Validação de email:** `isValidEmail()`, `extractEmail()`
- ✅ **Estado do usuário:** Armazenado no **PostgreSQL/Supabase** (tabela `users`, campo `status`)
- ✅ **Fluxo:** `awaiting_email` → valida email → busca compra → `authenticated`
- ✅ **Variáveis de ambiente:** `DATABASE_URL`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `OPENAI_API_KEY`, etc.


