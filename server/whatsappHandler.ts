/**
 * WhatsApp Handler Único
 * Handler centralizado para processar todas as mensagens do WhatsApp
 * Garante que o novo pipeline NLP seja sempre usado
 */

import { storage } from "./storage.js";
import { processIncomingMessage } from "./whatsappNLP.js";
import { sendAIMessage } from "./whatsapp.js";
// Função local para extrair texto (evita dependência circular)
function extractTextFromMessage(message: any): string {
  return (
    message?.text?.body ||
    message?.image?.caption ||
    message?.video?.caption ||
    message?.button?.text ||
    message?.interactive?.nfm_reply?.response_json ||
    message?.interactive?.list_reply?.title ||
    message?.interactive?.button_reply?.title ||
    message?.extended_text_message?.text ||
    message?.caption ||
    ""
  ).toString().trim();
}
import { v4 as uuidv4 } from "uuid";

export interface WhatsAppWebhookBody {
  object?: string;
  entry?: Array<{
    changes?: Array<{
      field?: string;
      value?: {
        messages?: Array<{
          id?: string;
          from?: string;
          type?: string;
          text?: { body?: string };
          audio?: { id?: string };
          image?: { id?: string; caption?: string };
          video?: { id?: string; caption?: string };
          timestamp?: string;
          interactive?: any;
        }>;
        statuses?: Array<any>;
      };
    }>;
  }>;
}

export interface WhatsAppMessage {
  id?: string;
  from?: string;
  type?: string;
  text?: { body?: string };
  audio?: { id?: string };
  image?: { id?: string; caption?: string };
  video?: { id?: string; caption?: string };
  timestamp?: string;
  interactive?: any;
}

/**
 * Extrai mensagens do body do webhook do WhatsApp Cloud API
 * Suporta múltiplos formatos possíveis
 */
export function extractMessagesFromWebhook(body: any): WhatsAppMessage[] {
  const messages: WhatsAppMessage[] = [];
  
  // Formato 1: body.entry[0].changes[0].value.messages[]
  if (body.entry && Array.isArray(body.entry)) {
    for (const entry of body.entry) {
      if (entry.changes && Array.isArray(entry.changes)) {
        for (const change of entry.changes) {
          if (change.value?.messages && Array.isArray(change.value.messages)) {
            messages.push(...change.value.messages);
          }
        }
      }
    }
  }
  
  // Formato 2: body.messages[] (fallback)
  if (messages.length === 0 && body.messages && Array.isArray(body.messages)) {
    messages.push(...body.messages);
  }
  
  // Formato 3: body.message (singular)
  if (messages.length === 0 && body.message) {
    messages.push(body.message);
  }
  
  return messages;
}

/**
 * Handler principal para processar mensagens do WhatsApp
 * Esta é a ÚNICA função que deve ser chamada pelos webhooks
 */
export async function handleWhatsAppWebhook(
  req: any,
  res: any,
  routeName: string
): Promise<void> {
  const startTime = Date.now();
  
  // Log inicial para identificar qual rota foi chamada
  console.log(`[WhatsApp Handler] 🚀 Rota chamada: ${routeName}`);
  console.log(`[WhatsApp Handler] 📦 Body recebido:`, JSON.stringify(req.body, null, 2));
  console.log(`[WhatsApp Handler] 🔍 Query params:`, JSON.stringify(req.query, null, 2));
  
  try {
    // Verificar se é verificação do webhook (GET ou POST com hub.mode)
    const hubMode = req.query?.['hub.mode'] || req.body?.hub?.mode;
    const hubToken = req.query?.['hub.verify_token'] || req.body?.hub?.verify_token;
    const hubChallenge = req.query?.['hub.challenge'] || req.body?.hub?.challenge;
    
    if (hubMode === 'subscribe' && hubToken) {
      const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'anotatudo_verify_token';
      if (hubToken === verifyToken) {
        console.log(`[WhatsApp Handler] ✅ Webhook verification SUCCESS (route: ${routeName})`);
        res.status(200).send(hubChallenge || 'OK');
        return;
      } else {
        console.log(`[WhatsApp Handler] ❌ Webhook verification FAILED (route: ${routeName})`);
        res.status(403).send('Forbidden');
        return;
      }
    }
    
    // Responder 200 imediatamente para evitar timeout do WhatsApp
    res.status(200).json({ success: true, route: routeName });
    
    const body: WhatsAppWebhookBody = req.body;
    
    // Verificar se é um evento do WhatsApp Business Account
    if (body.object && body.object !== 'whatsapp_business_account') {
      console.log(`[WhatsApp Handler] ⚠️ Ignoring non-WhatsApp event: ${body.object}`);
      return;
    }
    
    // Extrair mensagens do body
    const messages = extractMessagesFromWebhook(body);
    
    if (messages.length === 0) {
      console.log(`[WhatsApp Handler] ⚠️ Nenhuma mensagem encontrada no body`);
      return;
    }
    
    console.log(`[WhatsApp Handler] 📨 ${messages.length} mensagem(ns) extraída(s)`);
    
    // Processar cada mensagem
    for (const message of messages) {
      await processSingleMessage(message, routeName);
    }
    
    const endTime = Date.now();
    console.log(`[WhatsApp Handler] ✅ Processamento completo em ${endTime - startTime}ms (route: ${routeName})`);
    
  } catch (error: any) {
    console.error(`[WhatsApp Handler] ❌ ERRO CRÍTICO na rota ${routeName}:`, error);
    console.error(`[WhatsApp Handler] Stack:`, error.stack);
    // Não enviar resposta de erro aqui pois já respondemos 200
  }
}

/**
 * Processa uma única mensagem do WhatsApp
 */
async function processSingleMessage(
  message: WhatsAppMessage,
  routeName: string
): Promise<void> {
  const messageId = message.id;
  const phoneNumber = message.from;
  const messageType = message.type || 'text';
  
  console.log(`[WhatsApp Handler] 📩 Processando mensagem ${messageType} de ${phoneNumber} (ID: ${messageId})`);
  
  if (!phoneNumber) {
    console.log(`[WhatsApp Handler] ⚠️ Mensagem sem phoneNumber, ignorando`);
    return;
  }
  
  // Extrair conteúdo da mensagem
  let textContent = '';
  
  if (messageType === 'text') {
    textContent = message.text?.body || '';
  } else if (messageType === 'audio') {
    // Para áudio, tentar usar caption ou indicar que precisa transcrição
    textContent = message.audio?.id ? `[áudio:${message.audio.id}]` : '';
  } else if (messageType === 'image') {
    textContent = message.image?.caption || '';
  } else if (messageType === 'video') {
    textContent = message.video?.caption || '';
  } else if (message.interactive) {
    // Mensagens interativas (botões)
    textContent = message.interactive.button_reply?.title || 
                  message.interactive.list_reply?.title || 
                  '';
  }
  
  // Se não tem conteúdo de texto, tentar extrair de qualquer forma
  if (!textContent) {
    textContent = extractTextFromMessage(message as any) || '';
  }
  
  console.log(`[WhatsApp Handler] 📝 Conteúdo extraído: "${textContent}"`);
  
  // Se não tem conteúdo, logar mas continuar (pode ser status update)
  if (!textContent && messageType !== 'interactive') {
    console.log(`[WhatsApp Handler] ⚠️ Mensagem sem conteúdo de texto, pode ser status update`);
    return;
  }
  
  // Buscar ou criar usuário
  let user = await storage.getUserByPhone(phoneNumber);
  
  if (!user) {
    console.log(`[WhatsApp Handler] 👤 Usuário não encontrado, criando...`);
    user = await storage.createUserFromPhone(phoneNumber);
    await sendAIMessage(phoneNumber, "pedir_email_inicial", {});
    return;
  }
  
  // Verificar status do usuário
  if (user.status === 'awaiting_email') {
    console.log(`[WhatsApp Handler] 📧 Usuário aguardando email`);
    // Lógica de autenticação será mantida nas rotas específicas
    // Por enquanto, apenas processar se autenticado
    return;
  }
  
  if (user.status !== 'authenticated') {
    console.log(`[WhatsApp Handler] ⚠️ Usuário não autenticado (status: ${user.status})`);
    return;
  }
  
  // Se é mensagem de texto, usar o novo NLP
  if (messageType === 'text' && textContent) {
    console.log(`[WhatsApp Handler] 🤖 Processando com NLP novo...`);
    
    try {
      await processIncomingMessage(
        {
          id: user.id,
          firstName: user.firstName,
          whatsappNumber: user.whatsappNumber || phoneNumber,
        },
        textContent,
        phoneNumber,
        messageId
      );
      
      console.log(`[WhatsApp Handler] ✅ NLP processado com sucesso`);
    } catch (nlpError: any) {
      console.error(`[WhatsApp Handler] ❌ Erro no NLP:`, nlpError);
      // Enviar mensagem de erro amigável
      await sendAIMessage(
        phoneNumber,
        "erro_processamento",
        { user: { firstName: user.firstName || null, id: user.id } }
      );
    }
  } else {
    // Para mídia (áudio, imagem, vídeo), usar sistema antigo por enquanto
    console.log(`[WhatsApp Handler] 📎 Mensagem de mídia (${messageType}), usando sistema antigo`);
    // TODO: Integrar processamento de mídia com NLP quando necessário
  }
}

