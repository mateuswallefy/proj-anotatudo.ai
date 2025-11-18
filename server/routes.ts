import express, { type Express } from "express";
import { createServer, type Server } from "http";
import * as pathModule from "path";
import * as fs from "fs";
import multer from "multer";
import { storage } from "./storage.js";
import { isAuthenticated, hashPassword, comparePassword, requireAdmin } from "./auth.js";
import { db } from "./db.js";
import { users, transacoes, subscriptionEvents } from "@shared/schema";
import { eq, and, or, desc, sql as sqlOp } from "drizzle-orm";
import { 
  insertTransacaoSchema, 
  insertCartaoSchema, 
  insertUserSchema, 
  loginSchema,
  insertGoalSchema,
  insertSpendingLimitSchema,
  insertAccountMemberSchema,
  insertCategoriaCustomizadaSchema,
  insertNotificationPreferencesSchema,
  updateNotificationPreferencesSchema
} from "@shared/schema";
import { processWhatsAppMessage } from "./ai.js";
import { 
  calculateFinancialInsights, 
  calculateSpendingProgress,
  getMonthlyComparison,
  getExpensesByCategory,
  getIncomeByCategory,
  getYearlyEvolution,
  getPeriodSummary
} from "./analytics.js";
import { z } from "zod";
import { 
  sendWhatsAppReply, 
  normalizePhoneNumber, 
  extractEmail, 
  checkRateLimit, 
  downloadWhatsAppMedia,
  randomMessage,
  ASK_EMAIL_MESSAGES,
  EMAIL_NOT_FOUND_MESSAGES,
  ERROR_MESSAGES,
  GREETING_RESPONSES,
  NON_TEXT_WHILE_AWAITING_EMAIL,
} from "./whatsapp.js";

function parsePeriodParam(period?: string): { mes?: number; ano?: number } {
  if (!period || !/^\d{4}-\d{2}$/.test(period)) {
    return {};
  }
  const [year, month] = period.split('-').map(Number);
  return { mes: month, ano: year };
}

// Função utilitária para extrair texto de mensagens WhatsApp de forma segura
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static files from server/uploads
  app.use('/uploads/avatars', express.static(pathModule.join(process.cwd(), 'server', 'uploads', 'avatars')));

  // Health check endpoints for Cloud Run (must be first)
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/_health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Public endpoint: User status by email (for WhatsApp integration)
  // This endpoint MUST be public and never require authentication
  // IMPORTANT: This route is registered BEFORE any auth middleware
  app.get('/api/user-status', async (req, res) => {
    try {
      console.log('[API /user-status] Request received');
      console.log('[API /user-status] Email:', req.query.email);
      console.log('[API /user-status] Session exists:', !!req.session);
      console.log('[API /user-status] This endpoint is PUBLIC - no auth required');
      
      const email = req.query.email as string;
      
      if (!email) {
        console.log('[API /user-status] ❌ Email parameter missing');
        return res.status(400).json({ 
          error: 'Email parameter is required',
          userExists: false,
          subscriptionStatus: 'none',
          plan: null,
          nextPayment: null,
          whatsappAllowed: false,
        });
      }

      console.log('[API /user-status] Searching for user with email:', email);
      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        console.log('[API /user-status] User not found for email:', email);
        return res.status(200).json({
          userExists: false,
          subscriptionStatus: 'none',
          plan: null,
          nextPayment: null,
          whatsappAllowed: false,
        });
      }

      console.log('[API /user-status] ✅ User found:', user.id, user.email);
      
      // Get subscription status
      const subscriptionStatus = await storage.getUserSubscriptionStatus(user.id);
      console.log('[API /user-status] Subscription status:', subscriptionStatus);
      
      // Get active subscription for plan and next payment
      const subscriptions = await storage.getSubscriptionsByUserId(user.id);
      const activeSubscription = subscriptions.find(
        sub => (sub.status === 'active' || sub.status === 'trial') && 
        (!sub.currentPeriodEnd || new Date(sub.currentPeriodEnd) > new Date())
      );

      const plan = activeSubscription?.planName || user.planLabel || null;
      const nextPayment = activeSubscription?.currentPeriodEnd 
        ? new Date(activeSubscription.currentPeriodEnd).toISOString()
        : null;

      // WhatsApp is allowed if subscription is active
      const whatsappAllowed = subscriptionStatus === 'active';

      console.log('[API /user-status] ✅ Returning response:', {
        userExists: true,
        subscriptionStatus,
        plan,
        whatsappAllowed,
      });

      return res.status(200).json({
        userExists: true,
        subscriptionStatus,
        plan,
        nextPayment,
        whatsappAllowed,
      });
    } catch (error: any) {
      console.error('[API /user-status] ❌ Error:', error);
      console.error('[API /user-status] Error stack:', error.stack);
      return res.status(500).json({
        error: 'Internal server error',
        userExists: false,
        subscriptionStatus: 'none',
        plan: null,
        nextPayment: null,
        whatsappAllowed: false,
      });
    }
  });

  // Local Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      // Check if email already exists
      if (data.email) {
        const existingUser = await storage.getUserByEmail(data.email);
        if (existingUser) {
          return res.status(409).json({ 
            message: "Email já está em uso. Se esqueceu sua senha, envie uma mensagem no WhatsApp para receber uma nova senha temporária." 
          });
        }
      }

      // Hash password and create user
      const passwordHash = await hashPassword(data.password);
      const user = await storage.createUser({
        email: data.email,
        passwordHash,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        telefone: data.telefone || null,
        plano: 'free',
      });

      // Create session
      req.session.userId = user.id;

      // Save session before responding
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.status(201).json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        telefone: user.telefone,
        plano: user.plano,
      });
    } catch (error: any) {
      console.error("Error registering user:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao criar conta" });
      }
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      console.log('[LOGIN] Attempt received:', { email: req.body.email, hasPassword: !!req.body.password });
      const { email, password } = loginSchema.parse(req.body);

      // Find user by email
      const user = await storage.getUserByEmail(email);
      console.log('[LOGIN] User found:', !!user, user ? { email: user.email, hasHash: !!user.passwordHash } : 'no user');
      
      if (!user || !user.passwordHash) {
        console.log('[LOGIN] ❌ User not found or no password hash');
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }

      // Verify password
      const isValid = await comparePassword(password, user.passwordHash);
      console.log('[LOGIN] Password valid:', isValid);
      
      if (!isValid) {
        console.log('[LOGIN] ❌ Invalid password');
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }

      // Create session
      req.session.userId = user.id;
      console.log('[LOGIN] 🔧 Session userId set to:', user.id);
      console.log('[LOGIN] 🔧 Session object before save:', JSON.stringify(req.session));
      
      // Save session before responding
      try {
        await new Promise<void>((resolve, reject) => {
          req.session.save((err) => {
            if (err) {
              console.error('[LOGIN] ❌ Session save error:', err);
              reject(err);
            } else {
              console.log('[LOGIN] ✅ Session saved successfully');
              resolve();
            }
          });
        });
      } catch (saveError) {
        console.error('[LOGIN] ❌ Failed to save session:', saveError);
        throw saveError;
      }
      
      console.log('[LOGIN] ✅ Login successful, session saved for user:', user.id);

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        telefone: user.telefone,
        plano: user.plano,
      });
    } catch (error: any) {
      console.error("LOGIN ERROR:", error);
      console.error("LOGIN ERROR - Message:", error.message);
      console.error("LOGIN ERROR - Stack:", error.stack);
      console.error("LOGIN ERROR - Full error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: error.message || "Erro ao fazer login" });
      }
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Logout realizado com sucesso" });
    });
  });

  // Logout endpoint (preferred for client dashboard)
  app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Erro ao fazer logout" });
      }
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });

  // TODO: Implement secure password reset with email verification
  // For now, users can use "Criar Conta" with their purchase email to set a new password

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      console.log('[API /auth/user] Request received');
      console.log('[API /auth/user] Session userId:', req.session?.userId);
      
      const userId = req.session.userId;
      
      if (!userId) {
        console.log('[API /auth/user] ❌ No userId in session');
        return res.status(401).json({ message: "Unauthorized - no session" });
      }
      
      console.log('[API /auth/user] Fetching user from database:', userId);
      const user = await storage.getUser(userId);
      
      if (!user) {
        console.log('[API /auth/user] ❌ User not found in database');
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log('[API /auth/user] ✅ User found:', user.email);
      
      // Remove sensitive data before sending to client
      const { passwordHash, ...sanitizedUser } = user;
      
      res.json(sanitizedUser);
    } catch (error: any) {
      console.error("[API /auth/user] ❌ Error fetching user:", error);
      console.error("[API /auth/user] Error stack:", error.stack);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Caktos Webhook - recebe notificações de compra
  app.post('/api/webhook-caktos', async (req, res) => {
    try {
      console.log("[Caktos Webhook] Received:", JSON.stringify(req.body, null, 2));
      
      const { email, phone, status, purchase_id, product_name, amount, name } = req.body;
      
      if (!email || !status) {
        return res.status(400).json({ error: "Email e status são obrigatórios" });
      }

      const normalizedEmail = email.toLowerCase();
      const normalizedPhone = phone ? normalizePhoneNumber(phone) : null;

      // Criar registro de compra
      await storage.createPurchase({
        email: normalizedEmail,
        telefone: normalizedPhone,
        status,
        purchaseId: purchase_id,
        productName: product_name,
        amount: amount ? String(amount) : null,
      });

      // Se compra aprovada, criar usuário SEM senha (será definida via WhatsApp)
      if (status === 'approved') {
        const existingUser = await storage.getUserByEmail(normalizedEmail);
        
        if (!existingUser) {
          // Extrair nome do campo "name" se disponível
          let firstName = null;
          let lastName = null;
          if (name) {
            const nameParts = name.trim().split(' ');
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(' ') || null;
          }

          await storage.createUser({
            email: normalizedEmail,
            passwordHash: null,
            firstName,
            lastName,
            telefone: normalizedPhone,
            plano: 'free',
          });

          console.log(`[Caktos] ✅ User created (pending password) for ${normalizedEmail}`);
        } else {
          console.log(`[Caktos] User already exists: ${normalizedEmail}`);
        }
      }

      console.log(`[Caktos] Purchase registered: ${normalizedEmail} - ${status}`);
      res.json({ success: true, message: "Purchase registered" });
    } catch (error: any) {
      console.error("[Caktos Webhook] Error:", error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  // Transaction routes
  app.get("/api/transacoes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const period = req.query.period as string | undefined;
      const transacoes = await storage.getTransacoes(userId, period);
      res.json(transacoes);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transacoes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const data = insertTransacaoSchema.parse({
        ...req.body,
        userId,
      });
      
      // Validar goalId antes de criar a transação
      if (data.goalId) {
        const goal = await storage.getGoalById(data.goalId);
        if (!goal || goal.userId !== userId) {
          return res.status(403).json({ message: "Meta não encontrada ou não autorizada" });
        }
      }
      
      // Validar cartaoId antes de criar a transação
      if (data.cartaoId) {
        const cartao = await storage.getCartaoById(data.cartaoId);
        if (!cartao || cartao.userId !== userId) {
          return res.status(403).json({ message: "Cartão não encontrado ou não autorizado" });
        }
      }
      
      const transacao = await storage.createTransacao(data);
      
      // Se a transação está vinculada a uma meta, atualizar valorAtual da meta
      if (data.goalId && data.tipo === 'entrada') {
        const goal = await storage.getGoalById(data.goalId);
        if (goal) {
          const newValorAtual = parseFloat(goal.valorAtual || '0') + parseFloat(data.valor);
          await storage.updateGoalValorAtual(data.goalId, userId, newValorAtual.toString());
          
          // Se atingiu a meta, atualizar status
          if (newValorAtual >= parseFloat(goal.valorAlvo)) {
            await storage.updateGoalStatus(data.goalId, userId, 'concluida');
          }
        }
      }
      
      // Se a transação está vinculada a um cartão, criar entrada em cartao_transacoes
      if (data.cartaoId) {
        const dataTransacao = new Date(data.dataReal);
        const mes = dataTransacao.getMonth() + 1; // getMonth() retorna 0-11
        const ano = dataTransacao.getFullYear();
        
        // Buscar ou criar fatura aberta para o mês/ano da transação
        const fatura = await storage.getOrCreateFaturaAberta(data.cartaoId, mes, ano);
        
        // Criar entrada em cartao_transacoes
        await storage.createCartaoTransacao({
          faturaId: fatura.id,
          descricao: data.descricao || 'Transação',
          valor: data.valor,
          dataCompra: data.dataReal,
          categoria: data.categoria,
        });
        
        // Atualizar valorFechado da fatura
        const novoValor = parseFloat(fatura.valorFechado) + parseFloat(data.valor);
        await storage.updateFaturaValor(fatura.id, novoValor.toString());
      }
      
      res.status(201).json(transacao);
    } catch (error: any) {
      console.error("Error creating transaction:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create transaction" });
      }
    }
  });

  app.patch("/api/transacoes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.session.userId;
      const data = insertTransacaoSchema.partial().parse(req.body);
      
      const transacao = await storage.updateTransacao(id, userId, data);
      if (!transacao) {
        return res.status(404).json({ message: "Transaction not found or unauthorized" });
      }
      res.json(transacao);
    } catch (error: any) {
      console.error("Error updating transaction:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update transaction" });
      }
    }
  });

  app.delete("/api/transacoes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.session.userId;
      await storage.deleteTransacao(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });

  // Custom categories routes
  app.get("/api/categorias-customizadas", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const categorias = await storage.getCategoriasCustomizadas(userId);
      res.json(categorias);
    } catch (error) {
      console.error("Error fetching custom categories:", error);
      res.status(500).json({ message: "Failed to fetch custom categories" });
    }
  });

  app.post("/api/categorias-customizadas", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const data = insertCategoriaCustomizadaSchema.parse({
        ...req.body,
        userId,
      });
      
      const categoria = await storage.createCategoriaCustomizada(data);
      res.status(201).json(categoria);
    } catch (error: any) {
      console.error("Error creating custom category:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create custom category" });
      }
    }
  });

  app.delete("/api/categorias-customizadas/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.session.userId;
      await storage.deleteCategoriaCustomizada(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting custom category:", error);
      res.status(500).json({ message: "Failed to delete custom category" });
    }
  });

  // Card routes
  app.get("/api/cartoes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const cartoes = await storage.getCartoes(userId);
      res.json(cartoes);
    } catch (error) {
      console.error("Error fetching cards:", error);
      res.status(500).json({ message: "Failed to fetch cards" });
    }
  });

  app.post("/api/cartoes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const data = insertCartaoSchema.parse({
        ...req.body,
        userId,
      });
      
      const cartao = await storage.createCartao(data);
      res.status(201).json(cartao);
    } catch (error: any) {
      console.error("Error creating card:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create card" });
      }
    }
  });

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
          content = extractTextFromMessage(message);
          break;
        case 'audio':
          mediaId = message.audio?.id || "";
          content = extractTextFromMessage(message);
          break;
        case 'image':
          mediaId = message.image?.id || "";
          content = extractTextFromMessage(message);
          break;
        case 'video':
          mediaId = message.video?.id || "";
          content = extractTextFromMessage(message);
          // Vídeo não suportado ainda - requer extração de frames via ffmpeg
          if (!content) {
            await sendWhatsAppReply(
              phoneNumber,
              "Vídeos ainda não são suportados.\n\nPor favor, envie:\n• Texto: Almoço R$ 45\n• Áudio com sua transação\n• Foto de nota fiscal ou comprovante"
            );
            res.status(200).json({ success: true });
            return;
          }
          break;
        default:
          // Tentar extrair texto mesmo para tipos não suportados
          content = extractTextFromMessage(message);
          if (!content) {
            console.log(`[WhatsApp] Unsupported message type: ${messageType}`);
            res.status(200).json({ success: true });
            return;
          }
          break;
      }

      console.log("📩 WhatsApp Email Message Content:", content);

      // Se não tem conteúdo de texto e não tem mídia, logar mas não ignorar completamente
      if (!content && !mediaId) {
        console.log("⚠️ WhatsApp message ignored because content was empty but message may have data:", JSON.stringify(message, null, 2));
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
        // Tentar extrair email do conteúdo (funciona mesmo com formatações diferentes do WhatsApp)
        const email = extractEmail(content);
        
        // Se não conseguiu extrair email, pedir novamente
        if (!email) {
          // Check if message is a greeting or short message
          const normalizedContent = content.toLowerCase().trim();
          const isGreeting = ["oi", "olá", "ola"].includes(normalizedContent);
          
          // If it's a greeting, respond with empathy
          if (isGreeting) {
            await sendWhatsAppReply(phoneNumber, randomMessage(GREETING_RESPONSES));
          } else {
            await sendWhatsAppReply(
              phoneNumber,
              randomMessage(ASK_EMAIL_MESSAGES)
            );
          }
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

  // Analytics routes
  app.get("/api/insights", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const periodParam = parsePeriodParam(req.query.period as string | undefined);
      const mes = req.query.mes ? parseInt(req.query.mes as string) : periodParam.mes;
      const ano = req.query.ano ? parseInt(req.query.ano as string) : periodParam.ano;
      
      const insights = await calculateFinancialInsights(userId, mes, ano);
      res.json(insights);
    } catch (error) {
      console.error("Error calculating insights:", error);
      res.status(500).json({ message: "Failed to calculate insights" });
    }
  });

  app.get("/api/spending-progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const periodParam = parsePeriodParam(req.query.period as string | undefined);
      const mes = req.query.mes ? parseInt(req.query.mes as string) : periodParam.mes;
      const ano = req.query.ano ? parseInt(req.query.ano as string) : periodParam.ano;
      
      const progress = await calculateSpendingProgress(userId, mes, ano);
      res.json(progress);
    } catch (error) {
      console.error("Error calculating spending progress:", error);
      res.status(500).json({ message: "Failed to calculate progress" });
    }
  });

  // Premium analytics endpoints
  app.get("/api/analytics/monthly-comparison", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const months = req.query.months ? parseInt(req.query.months as string) : 12;
      
      const data = await getMonthlyComparison(userId, months);
      res.json(data);
    } catch (error) {
      console.error("Error getting monthly comparison:", error);
      res.status(500).json({ message: "Failed to get monthly comparison" });
    }
  });

  app.get("/api/analytics/expenses-by-category", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const periodParam = parsePeriodParam(req.query.period as string | undefined);
      const mes = req.query.mes ? parseInt(req.query.mes as string) : periodParam.mes;
      const ano = req.query.ano ? parseInt(req.query.ano as string) : periodParam.ano;
      
      const data = await getExpensesByCategory(userId, mes, ano);
      res.json(data);
    } catch (error) {
      console.error("Error getting expenses by category:", error);
      res.status(500).json({ message: "Failed to get expenses by category" });
    }
  });

  app.get("/api/analytics/income-by-category", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const periodParam = parsePeriodParam(req.query.period as string | undefined);
      const mes = req.query.mes ? parseInt(req.query.mes as string) : periodParam.mes;
      const ano = req.query.ano ? parseInt(req.query.ano as string) : periodParam.ano;
      
      const data = await getIncomeByCategory(userId, mes, ano);
      res.json(data);
    } catch (error) {
      console.error("Error getting income by category:", error);
      res.status(500).json({ message: "Failed to get income by category" });
    }
  });

  app.get("/api/analytics/yearly-evolution", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const ano = req.query.ano ? parseInt(req.query.ano as string) : undefined;
      
      const data = await getYearlyEvolution(userId, ano);
      res.json(data);
    } catch (error) {
      console.error("Error getting yearly evolution:", error);
      res.status(500).json({ message: "Failed to get yearly evolution" });
    }
  });

  app.get("/api/analytics/period-summary", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const periodParam = parsePeriodParam(req.query.period as string | undefined);
      const mes = req.query.mes ? parseInt(req.query.mes as string) : periodParam.mes;
      const ano = req.query.ano ? parseInt(req.query.ano as string) : periodParam.ano;
      
      const data = await getPeriodSummary(userId, mes, ano);
      res.json(data);
    } catch (error) {
      console.error("Error getting period summary:", error);
      res.status(500).json({ message: "Failed to get period summary" });
    }
  });

  // Goals routes
  app.get("/api/goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const goals = await storage.getGoals(userId);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  app.post("/api/goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const data = insertGoalSchema.parse({
        ...req.body,
        userId,
      });
      
      const goal = await storage.createGoal(data);
      res.status(201).json(goal);
    } catch (error: any) {
      console.error("Error creating goal:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create goal" });
      }
    }
  });

  app.patch("/api/goals/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.session.userId;
      
      await storage.updateGoalStatus(id, userId, status);
      res.json({ message: "Goal status updated" });
    } catch (error) {
      console.error("Error updating goal status:", error);
      res.status(500).json({ message: "Failed to update goal status" });
    }
  });

  // Spending limits routes
  app.get("/api/spending-limits", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { period } = req.query;
      
      let limits = await storage.getSpendingLimits(userId);
      
      // Filter by period if provided (format: "YYYY-MM")
      if (period && typeof period === 'string') {
        const [ano, mes] = period.split('-').map(Number);
        if (ano && mes) {
          limits = limits.filter(limit => {
            // Include limits that match the period or are not period-specific
            return (
              (limit.mes === null && limit.ano === null) ||
              (limit.mes === mes && limit.ano === ano)
            );
          });
        }
      }
      
      res.json(limits);
    } catch (error) {
      console.error("Error fetching spending limits:", error);
      res.status(500).json({ message: "Failed to fetch spending limits" });
    }
  });

  app.post("/api/spending-limits", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const data = insertSpendingLimitSchema.parse({
        ...req.body,
        userId,
      });
      
      const limit = await storage.createSpendingLimit(data);
      res.status(201).json(limit);
    } catch (error: any) {
      console.error("Error creating spending limit:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create spending limit" });
      }
    }
  });

  app.patch("/api/spending-limits/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { valorLimite } = req.body;
      
      await storage.updateSpendingLimit(id, valorLimite);
      res.json({ message: "Spending limit updated" });
    } catch (error) {
      console.error("Error updating spending limit:", error);
      res.status(500).json({ message: "Failed to update spending limit" });
    }
  });

  // Account members routes
  app.get("/api/account-members", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const members = await storage.getAccountMembers(userId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching account members:", error);
      res.status(500).json({ message: "Failed to fetch account members" });
    }
  });

  app.post("/api/account-members", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { memberEmail, role } = req.body;
      
      // Find member by email
      const memberUser = await storage.getUserByEmail(memberEmail);
      if (!memberUser) {
        return res.status(404).json({ message: "User not found with this email" });
      }
      
      const data = insertAccountMemberSchema.parse({
        accountOwnerId: userId,
        memberId: memberUser.id,
        role: role || 'member',
        status: 'ativo',
      });
      
      const member = await storage.createAccountMember(data);
      res.status(201).json(member);
    } catch (error: any) {
      console.error("Error adding account member:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to add account member" });
      }
    }
  });

  app.delete("/api/account-members/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.removeAccountMember(id);
      res.json({ message: "Account member removed" });
    } catch (error) {
      console.error("Error removing account member:", error);
      res.status(500).json({ message: "Failed to remove account member" });
    }
  });

  // User settings routes
  const changePasswordSchema = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
  });

  app.post("/api/user/change-password", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
      
      const user = await storage.getUser(userId);
      if (!user || !user.passwordHash) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify current password
      const isValid = await comparePassword(currentPassword, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      
      // Hash and update new password
      const newPasswordHash = await hashPassword(newPassword);
      await storage.updateUserPassword(userId, newPasswordHash);
      
      res.json({ message: "Password updated successfully" });
    } catch (error: any) {
      console.error("Error changing password:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to change password" });
      }
    }
  });

  app.post("/api/user/profile-image", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { imageUrl } = req.body;
      
      if (!imageUrl) {
        return res.status(400).json({ message: "Image URL is required" });
      }
      
      await storage.updateUserProfileImage(userId, imageUrl);
      res.json({ message: "Profile image updated successfully", imageUrl });
    } catch (error) {
      console.error("Error updating profile image:", error);
      res.status(500).json({ message: "Failed to update profile image" });
    }
  });

  // Upload avatar route with multer

  // Configure multer storage
  const multerStorage = multer.diskStorage({
    destination: (req: any, file: any, cb: any) => {
      const uploadsDir = pathModule.join(process.cwd(), 'server', 'uploads', 'avatars');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      cb(null, uploadsDir);
    },
    filename: (req: any, file: any, cb: any) => {
      const userId = req.session.userId;
      const ext = file.originalname.split('.').pop() || 'jpg';
      const uniqueFilename = `${userId}-${Date.now()}.${ext}`;
      cb(null, uniqueFilename);
    }
  });

  // Configure multer upload
  const upload = multer({
    storage: multerStorage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req: any, file: any, cb: any) => {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only PNG, JPG, JPEG, and GIF are allowed.'));
      }
    }
  });

  app.post("/api/user/upload-avatar", isAuthenticated, (req: any, res: any, next: any) => {
    upload.single('avatar')(req, res, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: "Arquivo muito grande. Máximo de 5MB." });
        }
        return res.status(400).json({ message: err.message || "Erro ao fazer upload do arquivo" });
      }
      next();
    });
  }, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Generate URL (relative to server/uploads/avatars)
      // In production, you might want to use cloud storage (S3, Supabase Storage, etc.)
      const imageUrl = `/uploads/avatars/${req.file.filename}`;

      // Update user profile image in database
      await storage.updateUserProfileImage(userId, imageUrl);

      // Reload user session
      const user = await storage.getUser(userId);
      if (user) {
        req.session.user = user;
      }

      res.json({ 
        url: imageUrl,
        message: "Avatar uploaded successfully"
      });
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      res.status(500).json({ message: error.message || "Failed to upload avatar" });
    }
  });

  // Notification preferences routes
  app.get("/api/notification-preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const preferences = await storage.getNotificationPreferences(userId);
      
      // If no preferences exist, return default values
      if (!preferences) {
        return res.json({
          alertasOrcamento: 'ativo',
          vencimentoCartoes: 'ativo',
          insightsSemanais: 'inativo',
          metasAtingidas: 'ativo',
        });
      }
      
      res.json(preferences);
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      res.status(500).json({ message: "Failed to fetch notification preferences" });
    }
  });

  app.post("/api/notification-preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const data = updateNotificationPreferencesSchema.parse(req.body);
      
      const preferences = await storage.upsertNotificationPreferences(userId, data);
      res.json(preferences);
    } catch (error: any) {
      console.error("Error updating notification preferences:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update notification preferences" });
      }
    }
  });

  // ============================================================================
  // WHATSAPP WEBHOOK ROUTES (Meta WhatsApp Cloud API)
  // ============================================================================

  // Enable CORS for WhatsApp webhook endpoint
  app.use("/api/whatsapp/webhook", (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    
    next();
  });

  // Webhook verification (GET) - Meta sends this to verify your endpoint
  app.get("/api/whatsapp/webhook", (req, res) => {
    // Meta Webhook verification
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }

    return res.sendStatus(403);
  });

  // Webhook notifications (POST) - Meta sends incoming messages here
  app.post("/api/whatsapp/webhook", async (req, res) => {
    try {
      const body = req.body;
      
      // Always respond 200 immediately to acknowledge receipt
      res.sendStatus(200);
      
      console.log("[WhatsApp Webhook] Received:", JSON.stringify(body, null, 2));
      
      if (body.object !== 'whatsapp_business_account') {
        console.log("[WhatsApp Webhook] Ignoring non-WhatsApp event");
        return;
      }
      
      // Process each entry
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field !== 'messages') continue;
          
          const value = change.value;
          
          // Handle incoming messages
          if (value.messages && value.messages.length > 0) {
            const message = value.messages[0];
            const fromNumber = message.from; // User's WhatsApp number
            const messageType = message.type; // text, image, audio, video, etc.
            const messageId = message.id; // Unique message ID for idempotency
            
            console.log(`[WhatsApp] New ${messageType} message from ${fromNumber} (ID: ${messageId})`);
            
            // Rate limiting - 10 messages per minute
            if (!checkRateLimit(fromNumber, 10, 60000)) {
              console.log(`[WhatsApp] Rate limit exceeded for ${fromNumber} (10 msg/min)`);
              await sendWhatsAppReply(fromNumber, "⚠️ Você está enviando muitas mensagens. Por favor, aguarde um momento.");
              continue;
            }
            
            // Cleanup old sessions once per hour (simple in-memory tracking)
            const lastCleanup = (global as any).lastWhatsAppCleanup || 0;
            const now = Date.now();
            if (now - lastCleanup > 3600000) { // 1 hour
              storage.cleanupOldWhatsAppSessions(30).catch(err => 
                console.error('[WhatsApp] Cleanup error:', err)
              );
              (global as any).lastWhatsAppCleanup = now;
            }
            
            // Get or create WhatsApp session
            let session = await storage.getWhatsAppSession(fromNumber);
            
            if (!session) {
              console.log(`[WhatsApp] Creating new session for phone ${fromNumber}`);
              session = await storage.createWhatsAppSession({
                phoneNumber: fromNumber,
                status: 'awaiting_email',
                lastMessageAt: new Date(),
              });
              console.log(`[WhatsApp] Session created with status: ${session.status}`);
              // Send welcome message
              await sendWhatsAppReply(fromNumber, "Olá! 👋 Para começar, me diga seu email cadastrado.");
              continue;
            }
            
            // Update last message time
            await storage.updateWhatsAppSession(fromNumber, { lastMessageAt: new Date() });
            
            // Extract message content using safe extraction function
            let messageContent = '';
            const extractedText = extractTextFromMessage(message);
            
            if (messageType === 'text') {
              messageContent = extractedText;
            } else if (messageType === 'audio') {
              // Download audio file from WhatsApp
              try {
                const audioId = message.audio?.id || '';
                if (audioId) {
                  messageContent = await downloadWhatsAppMedia(audioId, 'audio');
                  console.log(`[WhatsApp] Audio downloaded: ${messageContent}`);
                } else {
                  // Fallback to extracted text if available
                  messageContent = extractedText;
                }
              } catch (error: any) {
                console.error(`[WhatsApp] Failed to download audio:`, error.message);
                // Try to use extracted text as fallback
                messageContent = extractedText || '';
                if (!messageContent) {
                  await sendWhatsAppReply(fromNumber, randomMessage(ERROR_MESSAGES));
                  continue;
                }
              }
            } else if (messageType === 'image') {
              const imageId = message.image?.id || '';
              messageContent = imageId || extractedText;
            } else if (messageType === 'video') {
              const videoId = message.video?.id || '';
              messageContent = videoId || extractedText;
            } else {
              // For other message types, try to extract text
              messageContent = extractedText;
            }
            
            console.log("📩 WhatsApp Email Message Content:", messageContent);
            
            // Log if content is empty but message has data
            if (!messageContent) {
              console.log("⚠️ WhatsApp message ignored because content was empty but message may have data:", JSON.stringify(message, null, 2));
            }
            
            console.log(`[WhatsApp] Session status: ${session.status}, Message: "${messageContent}"`);
            
            // ========================================
            // AUTHENTICATION FLOW
            // ========================================
            
            if (session.status === 'awaiting_email') {
              // User needs to send email to authenticate
              // Tentar extrair email do conteúdo (funciona mesmo com formatações diferentes do WhatsApp)
              const extractedEmail = extractEmail(messageContent);
              
              if (extractedEmail) {
                  console.log(`[WhatsApp] Email extracted: ${extractedEmail}`);
                  
                  // Find user by email
                  const userByEmail = await storage.getUserByEmail(extractedEmail);
                  
                  if (userByEmail) {
                    // Check if user has any subscriptions
                    const userSubscriptions = await storage.getSubscriptionsByUserId(userByEmail.id);
                    
                    // If user exists but has no subscription, create one automatically
                    if (userSubscriptions.length === 0) {
                      console.log(`[WhatsApp] User ${userByEmail.id} exists but has no subscription. Creating manual subscription...`);
                      
                      const crypto = await import('crypto');
                      const subscriptionId = crypto.randomUUID();
                      const now = new Date();
                      const expiresAt = new Date(now);
                      expiresAt.setDate(expiresAt.getDate() + 30); // Default to monthly (30 days)
                      
                      try {
                        await storage.createSubscription({
                          userId: userByEmail.id,
                          provider: 'manual',
                          providerSubscriptionId: subscriptionId,
                          planName: userByEmail.planLabel || 'Premium',
                          priceCents: 0,
                          currency: 'BRL',
                          billingInterval: 'month',
                          interval: 'monthly',
                          status: 'active',
                          currentPeriodEnd: expiresAt,
                          meta: {
                            createdBy: 'whatsapp_auto',
                            createdAt: now.toISOString(),
                          },
                        });
                        
                        console.log(`[WhatsApp] ✅ Auto-created subscription for user ${userByEmail.id}`);
                        
                        // Log system event
                        await storage.createSystemLog({
                          level: 'info',
                          source: 'whatsapp',
                          message: `Auto-created subscription for user without subscription`,
                          meta: { userId: userByEmail.id, email: extractedEmail, phoneNumber: fromNumber },
                        });
                      } catch (subError: any) {
                        console.error(`[WhatsApp] ❌ Error auto-creating subscription:`, subError);
                        // Continue anyway - will show error message below
                      }
                    }
                    
                    // Wait a bit to ensure subscription is committed to DB
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    // Check subscription status using unified function
                    const subscriptionStatus = await storage.getUserSubscriptionStatus(userByEmail.id);
                    
                    console.log(`[WhatsApp] User ${userByEmail.id} subscription status after check: ${subscriptionStatus}`);
                    
                    if (subscriptionStatus === 'active') {
                      // Update session to verified
                      await storage.updateWhatsAppSession(fromNumber, {
                        userId: userByEmail.id,
                        email: extractedEmail,
                        status: 'verified',
                      });
                      await storage.updatePurchasePhone(extractedEmail, fromNumber);
                      
                      console.log(`[WhatsApp] ✅ Session verified for user: ${extractedEmail}`);
                      
                      // Check if user is manual and needs password sent
                      const userMetadata = (userByEmail.metadata as any) || {};
                      const sentInitialPassword = userMetadata.sentInitialPassword || false;
                      const hasPassword = !!userByEmail.passwordHash;
                      
                      // If user has password but hasn't received it via WhatsApp, inform them
                      // Note: We can't send the actual password here because we only have the hash
                      // The admin must use regenerate-password endpoint to generate and send a new password
                      if (hasPassword && !sentInitialPassword) {
                        // Inform user that they need to contact support or admin will send password
                        await sendWhatsAppReply(
                          fromNumber,
                          `🎉 *Seu acesso ao AnotaTudo.AI foi liberado!*\n\nSeus dados de login serão enviados em breve.\n\n🔐 Acesse seu painel:\nhttps://anotatudo.com/login\n\nSe você não receber a senha, entre em contato com o suporte.`
                        );
                        
                        // Don't mark as sent since we didn't actually send the password
                        // Admin will need to use regenerate-password to send it
                      } else {
                        // Normal authentication message - humanized
                      const authSuccessMessages = [
                        "Perfeito! ✅ Já encontrei seu cadastro e sua assinatura está ativa.\n\nPode me mandar os registros de hoje. Exemplos:\n• \"Entrada 250 salário\"\n• \"Despesa 80 mercado\"\n• Foto de recibo\n• Áudio descrevendo",
                        "Ótimo! ✅ Seu acesso está liberado e ativo.\n\nAgora pode enviar suas transações:\n• \"Gastei R$ 45 no mercado\"\n• \"Recebi R$ 5000 de salário\"\n• Foto ou áudio também funcionam!",
                        "Tudo certo! ✅ Assinatura ativa confirmada.\n\nPode começar a enviar seus registros financeiros. Me manda texto, foto ou áudio!",
                      ];
                      await sendWhatsAppReply(
                        fromNumber,
                        randomMessage(authSuccessMessages)
                      );
                      }
                      
                      // Log WhatsApp authentication event (system log, not admin event)
                      await storage.createSystemLog({
                        level: 'info',
                        source: 'whatsapp',
                        message: `User authenticated via WhatsApp`,
                        meta: { userId: userByEmail.id, email: extractedEmail, phoneNumber: fromNumber },
                      });
                    } else {
                      console.log(`[WhatsApp] ❌ User subscription status: ${subscriptionStatus}`);
                      
                      const statusMessage = 
                        subscriptionStatus === 'paused' || subscriptionStatus === 'suspended' ? 'suspensa' :
                        subscriptionStatus === 'expired' ? 'expirada' :
                        subscriptionStatus === 'canceled' ? 'cancelada' :
                        'inativa';
                      
                      // Humanized messages for inactive subscription
                      const inactiveSubscriptionMessages = [
                        `😕 Sua assinatura está ${statusMessage} no momento.\n\nPara reativar, entre em contato com o suporte, por favor.`,
                        `Ops! Sua assinatura está ${statusMessage}.\n\nPrecisa reativar? Fale com o suporte que eles resolvem rapidinho. 😊`,
                        `Sua assinatura está ${statusMessage}.\n\nEntre em contato com o suporte para reativar seu acesso.`,
                      ];
                      
                      await sendWhatsAppReply(
                        fromNumber,
                        randomMessage(inactiveSubscriptionMessages)
                      );
                    }
                  } else {
                    // Check if purchase exists (legacy support)
                    const purchase = await storage.getPurchaseByEmail(extractedEmail);
                    
                    if (purchase) {
                      // Create or update user for this email (legacy support)
                      let purchaseUser = await storage.getUserByEmail(extractedEmail);
                      if (!purchaseUser) {
                        // Create user from purchase
                        purchaseUser = await storage.createUser({
                          email: extractedEmail,
                          plano: 'premium',
                          status: 'authenticated',
                        });
                      }
                      
                      // Update session to verified
                      await storage.updateWhatsAppSession(fromNumber, {
                        userId: purchaseUser.id,
                        email: extractedEmail,
                        status: 'verified',
                      });
                      await storage.updatePurchasePhone(extractedEmail, fromNumber);
                      
                      console.log(`[WhatsApp] ✅ Session verified via purchase: ${extractedEmail}`);
                      
                      // Humanized authentication success message
                      const authSuccessMessages = [
                        "Perfeito! ✅ Já encontrei seu cadastro e sua assinatura está ativa.\n\nPode me mandar os registros de hoje. Exemplos:\n• \"Entrada 250 salário\"\n• \"Despesa 80 mercado\"\n• Foto de recibo\n• Áudio descrevendo",
                        "Ótimo! ✅ Seu acesso está liberado e ativo.\n\nAgora pode enviar suas transações:\n• \"Gastei R$ 45 no mercado\"\n• \"Recebi R$ 5000 de salário\"\n• Foto ou áudio também funcionam!",
                        "Tudo certo! ✅ Assinatura ativa confirmada.\n\nPode começar a enviar seus registros financeiros. Me manda texto, foto ou áudio!",
                      ];
                      await sendWhatsAppReply(
                        fromNumber,
                        randomMessage(authSuccessMessages)
                      );
                    } else {
                      console.log(`[WhatsApp] ❌ No user or purchase found for ${extractedEmail}`);
                      
                      // Log email not found event
                      await storage.createSystemLog({
                        level: 'info',
                        source: 'whatsapp',
                        message: `Email not found during authentication`,
                        meta: { email: extractedEmail, phoneNumber: fromNumber, type: 'EMAIL_NOT_FOUND' },
                      });
                      
                      await sendWhatsAppReply(
                        fromNumber,
                        randomMessage(EMAIL_NOT_FOUND_MESSAGES)
                      );
                    }
                  }
                } else {
                  // Not a valid email, prompt again
                  // Check if message is a greeting or short message
                  const normalizedContent = messageContent.toLowerCase().trim();
                  const isGreeting = ["oi", "olá", "ola"].includes(normalizedContent);
                  
                  if (isGreeting) {
                    await sendWhatsAppReply(fromNumber, randomMessage(GREETING_RESPONSES));
                  } else {
                    console.log(`[WhatsApp] Invalid email format in message: "${messageContent}"`);
                    await sendWhatsAppReply(
                      fromNumber,
                      randomMessage(ASK_EMAIL_MESSAGES)
                    );
                  }
                }
            } 
            
            // ========================================
            // BLOCKED SESSION HANDLING
            // ========================================
            
            else if (session.status === 'blocked') {
              console.log(`[WhatsApp] Blocked session for phone ${fromNumber}`);
              await sendWhatsAppReply(fromNumber, "⛔ Seu acesso está bloqueado. Entre em contato com o suporte.");
              continue;
            }
            
            // ========================================
            // TRANSACTION PROCESSING (VERIFIED SESSIONS ONLY)
            // ========================================
            
            else if (session.status === 'verified') {
              // Re-validate subscription on every message
              const subscriptionStatus = await storage.getUserSubscriptionStatus(session.userId!);
              if (subscriptionStatus !== 'active') {
                console.log(`[WhatsApp] Subscription not active for session ${fromNumber}: ${subscriptionStatus}. Resetting session.`);
                // Update session to awaiting_email to force re-authentication
                await storage.updateWhatsAppSession(fromNumber, { status: 'awaiting_email', userId: null, email: null });
                await sendWhatsAppReply(fromNumber, "⚠️ Sua assinatura não está mais ativa. Por favor, entre em contato com o suporte ou forneça seu email para reativar.");
                continue;
              }
              
              // Fetch user from session
              const user = await storage.getUser(session.userId!);
              
              // Edge case: session has userId but user doesn't exist
              if (!user) {
                console.log(`[WhatsApp] User ${session.userId} not found for verified session. Resetting to awaiting_email.`);
                await storage.updateWhatsAppSession(fromNumber, {
                  userId: null,
                  email: null,
                  status: 'awaiting_email',
                });
                await sendWhatsAppReply(fromNumber, "⚠️ Houve um problema com sua sessão. Por favor, me envie seu email novamente.");
                continue;
              }
              
              console.log(`[WhatsApp] Processing transaction for authenticated user with active subscription`);
              
              try {
                // Call AI to process the message
                const result = await processWhatsAppMessage(
                  messageType as 'text' | 'audio' | 'image' | 'video',
                  messageContent,
                  user.id
                );
                
                console.log(`[WhatsApp] AI Result:`, result);
                
                // Create transaction if AI extracted valid financial data
                if (result && result.valor !== null) {
                  await storage.createTransacao({
                    userId: user.id,
                    tipo: result.tipo,
                    categoria: result.categoria,
                    valor: result.valor.toString(),
                    dataReal: result.dataReal,
                    descricao: result.descricao || '',
                    origem: messageType === 'text' ? 'texto' : messageType === 'audio' ? 'audio' : messageType === 'image' ? 'foto' : 'video',
                  });
                  
                  console.log(`[WhatsApp] ✅ Transaction created for user ${user.id}`);
                  
                  // Send confirmation
                  const tipoEmoji = result.tipo === 'entrada' ? '💰' : '💸';
                  await sendWhatsAppReply(
                    fromNumber,
                    `${tipoEmoji} *Transação registrada!*\n\n` +
                    `Tipo: ${result.tipo === 'entrada' ? 'Entrada' : 'Saída'}\n` +
                    `Valor: R$ ${result.valor}\n` +
                    `Categoria: ${result.categoria}\n` +
                    `Descrição: ${result.descricao || 'N/A'}\n\n` +
                    `Confiança: ${(result.confianca * 100).toFixed(0)}%`
                  );
                } else {
                  console.log(`[WhatsApp] ⚠️ No valid transaction data extracted`);
                  
                  await sendWhatsAppReply(
                    fromNumber,
                    "⚠️ Não consegui entender a transação.\n\nTente novamente com mais detalhes:\n• Valor\n• Tipo (gasto ou recebimento)\n• Descrição ou categoria"
                  );
                }
              } catch (aiError) {
                console.error("[WhatsApp] AI processing error:", aiError);
                
                await sendWhatsAppReply(
                  fromNumber,
                  randomMessage(ERROR_MESSAGES)
                );
              }
            }
          }
          
          // Handle status updates (optional)
          if (value.statuses && value.statuses.length > 0) {
            const status = value.statuses[0];
            console.log(`[WhatsApp] Status update: ${status.id} - ${status.status}`);
          }
        }
      }
    } catch (error) {
      console.error("[WhatsApp Webhook] Error processing webhook:", error);
      // Don't send error response - already sent 200
    }
  });

  // Contas routes
  app.get("/api/contas", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const contas = await storage.getContas(userId);
      res.json(contas);
    } catch (error) {
      console.error("Error fetching contas:", error);
      res.status(500).json({ message: "Failed to fetch contas" });
    }
  });

  // Investimentos routes
  app.get("/api/investimentos", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const investimentos = await storage.getInvestimentos(userId);
      res.json(investimentos);
    } catch (error) {
      console.error("Error fetching investimentos:", error);
      res.status(500).json({ message: "Failed to fetch investimentos" });
    }
  });

  // Alertas routes
  app.get("/api/alertas", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const incluirLidos = req.query.incluirLidos === 'true';
      const alertas = await storage.getAlertas(userId, incluirLidos);
      res.json(alertas);
    } catch (error) {
      console.error("Error fetching alertas:", error);
      res.status(500).json({ message: "Failed to fetch alertas" });
    }
  });

  app.patch("/api/alertas/:id/ler", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.session.userId;
      await storage.marcarAlertaComoLido(id, userId);
      res.json({ message: "Alert marked as read" });
    } catch (error) {
      console.error("Error marking alert as read:", error);
      res.status(500).json({ message: "Failed to mark alert as read" });
    }
  });

  // Insights routes
  app.get("/api/insights-ai", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
      const insights = await storage.getInsights(userId, limit);
      res.json(insights);
    } catch (error) {
      console.error("Error fetching insights:", error);
      res.status(500).json({ message: "Failed to fetch insights" });
    }
  });

  // Admin routes
  app.get("/api/admin/overview", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { items: allUsers } = await storage.listUsers();
      
      const totalUsers = allUsers.length;
      const activeUsers = allUsers.filter(u => u.billingStatus === 'active').length;
      const trialUsers = allUsers.filter(u => u.billingStatus === 'trial').length;
      const canceledUsers = allUsers.filter(u => u.billingStatus === 'canceled').length;
      const overdueUsers = allUsers.filter(u => u.billingStatus === 'overdue').length;

      // Calculate MRR from active subscriptions
      const activeSubscriptions = await storage.listSubscriptions({ status: 'active' });
      const mrrCentsEstimado = activeSubscriptions.reduce((sum, sub) => {
        if (sub.billingInterval === 'month') {
          return sum + sub.priceCents;
        } else if (sub.billingInterval === 'year') {
          return sum + Math.round(sub.priceCents / 12);
        }
        return sum;
      }, 0);

      // New users in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newUsersLast30Days = allUsers.filter(u => 
        u.createdAt && new Date(u.createdAt) >= thirtyDaysAgo
      ).length;

      res.json({
        totalUsers,
        activeUsers,
        trialUsers,
        canceledUsers,
        overdueUsers,
        mrrCentsEstimado,
        newUsersLast30Days,
      });
    } catch (error) {
      console.error("Error fetching admin overview:", error);
      res.status(500).json({ message: "Failed to fetch admin overview" });
    }
  });

  app.get("/api/admin/users", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 50;

      const { items, total } = await storage.listUsers({ search, status, page, pageSize });

      // Format response
      const formattedItems = items.map(user => ({
        id: user.id,
        name: user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : user.email || 'Sem nome',
        email: user.email,
        whatsappNumber: user.whatsappNumber || user.telefone,
        billingStatus: user.billingStatus,
        planLabel: user.planLabel,
        createdAt: user.createdAt,
      }));

      const totalPages = Math.ceil(total / pageSize);

      res.json({
        items: formattedItems,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
        },
      });
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/users/:id", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userSubscriptions = await storage.getSubscriptionsByUserId(id);
      const eventsRecentes = await storage.getSubscriptionEventsByUserId(id, 20);

      res.json({
        user,
        subscriptions: userSubscriptions,
        eventsRecentes,
      });
    } catch (error) {
      console.error("Error fetching admin user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/admin/users", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const adminId = req.session.userId;
      const { name, email, whatsappNumber, planLabel, billingStatus, role } = req.body;

      if (!name || !email) {
        return res.status(400).json({ message: "Nome e email são obrigatórios" });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Email inválido" });
      }

      // Check if email already exists
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(409).json({ message: "Email já está em uso" });
      }

      // Check if WhatsApp number already exists (if provided)
      if (whatsappNumber) {
        const existingUserByPhone = await storage.getUserByPhone(whatsappNumber);
        if (existingUserByPhone) {
          return res.status(409).json({ message: "WhatsApp já está em uso" });
        }
      }

      const [firstName, ...lastNameParts] = name.split(' ');
      const lastName = lastNameParts.join(' ') || null;

      // Generate temporary secure password (10 characters)
      const crypto = await import('crypto');
      const tempPassword = crypto.randomBytes(8).toString('base64url').slice(0, 10);
      
      // Hash the password
      const passwordHash = await hashPassword(tempPassword);

      // Create user with password (manual creation)
      const user = await storage.createUser({
        email,
        firstName,
        lastName,
        whatsappNumber: whatsappNumber || null,
        planLabel: planLabel || 'Premium',
        billingStatus: billingStatus || 'active',
        role: role || 'user',
        status: 'authenticated',
        passwordHash,
        metadata: {
          sentInitialPassword: false,
          createdBy: 'admin',
          createdAt: new Date().toISOString(),
        } as any,
      });

      // Create active subscription for manually created user
      const subscriptionId = crypto.randomUUID();
      const now = new Date();
      const expiresAt = new Date(now);
      
      // Get interval from request body (default to 'monthly')
      const interval = req.body.interval || 'monthly';
      
      // Calculate expiration based on interval
      if (interval === 'yearly') {
        expiresAt.setDate(expiresAt.getDate() + 365); // 365 days from now
      } else {
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now (monthly)
      }

      // Create active subscription for manually created user
      let subscription;
      try {
        subscription = await storage.createSubscription({
          userId: user.id,
          provider: 'manual',
          providerSubscriptionId: subscriptionId,
          planName: planLabel || 'Premium',
          priceCents: 0, // Manual subscriptions are free by default
          currency: 'BRL',
          billingInterval: interval === 'yearly' ? 'year' : 'month',
          interval: interval as 'monthly' | 'yearly',
          status: 'active',
          currentPeriodEnd: expiresAt,
          meta: {
            createdBy: 'admin',
            adminId: adminId,
            createdAt: now.toISOString(),
          },
        });
        console.log(`[Admin] ✅ Subscription created for user ${user.id}: ${subscription.id}`);
      } catch (subscriptionError: any) {
        console.error("[Admin] ❌ CRITICAL: Error creating subscription:", subscriptionError);
        console.error("[Admin] Subscription error details:", {
          message: subscriptionError.message,
          stack: subscriptionError.stack,
          userId: user.id,
          interval,
          expiresAt: expiresAt.toISOString(),
          errorCode: subscriptionError.code,
          errorName: subscriptionError.name,
        });
        // Rollback user creation if subscription fails
        try {
          await db.delete(users).where(eq(users.id, user.id));
          console.log(`[Admin] Rolled back user creation due to subscription error`);
        } catch (rollbackError) {
          console.error("[Admin] ❌ Failed to rollback user creation:", rollbackError);
        }
        throw new Error(`Falha ao criar assinatura: ${subscriptionError.message || 'Erro desconhecido'}`);
      }

      // Update user billing status
      await storage.updateUser(user.id, {
        billingStatus: 'active',
        planLabel: planLabel || 'Premium',
      });

      // Send password via WhatsApp if user has WhatsApp number
      let whatsappSent = false;
      if (whatsappNumber) {
        try {
          const welcomeMessage = `🎉 *Seu acesso ao AnotaTudo.AI foi liberado!*\n\nAqui estão seus dados de login:\n\n• Email: ${email}\n• Senha temporária: ${tempPassword}\n\n🔐 Acesse seu painel:\nhttps://anotatudo.com/login\n\nRecomendamos trocar a senha ao entrar.`;
          
          await sendWhatsAppReply(whatsappNumber, welcomeMessage);
          whatsappSent = true;
          
          // Mark as sent - preserve existing metadata
          const currentMetadata = (user.metadata as any) || {};
          await storage.updateUser(user.id, {
            metadata: {
              ...currentMetadata,
              sentInitialPassword: true,
              lastPasswordSentAt: new Date().toISOString(),
              createdBy: currentMetadata.createdBy || 'admin',
              createdAt: currentMetadata.createdAt || new Date().toISOString(),
            },
          });
        } catch (whatsappError) {
          console.error("[Admin] Error sending password via WhatsApp:", whatsappError);
          // Continue even if WhatsApp fails
        }
      }

      // Log admin action
      await storage.createAdminEventLog({
        adminId: adminId,
        userId: user.id,
        type: 'create_user_with_password',
        metadata: {
          email,
          whatsappNumber: whatsappNumber || null,
          planLabel: planLabel || 'Premium',
          subscriptionId: subscription.id,
          passwordGenerated: true,
          whatsappSent: whatsappSent,
        },
      });

      res.status(201).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          whatsappNumber: user.whatsappNumber,
          billingStatus: user.billingStatus,
          planLabel: user.planLabel,
        },
        subscription: {
          id: subscription.id,
          userId: subscription.userId,
          provider: subscription.provider,
          status: subscription.status,
          interval: subscription.interval,
          currentPeriodEnd: subscription.currentPeriodEnd,
        },
        temporaryPassword: tempPassword, // Return password in plain text for admin
        whatsappSent: whatsappSent,
      });
    } catch (error: any) {
      console.error("[Admin] ❌ CRITICAL ERROR creating admin user:", error);
      console.error("[Admin] Error details:", {
        message: error.message,
        stack: error.stack,
        body: req.body,
        errorCode: error.code,
        errorName: error.name,
      });
      const statusCode = error.message?.includes('já está em uso') ? 409 : 
                        error.message?.includes('inválido') ? 400 : 500;
      res.status(statusCode).json({ 
        success: false,
        message: error.message || "Falha ao criar cliente. Tente novamente.",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  });

  app.patch("/api/admin/users/:id", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const adminId = req.session.userId;
      const { id } = req.params;
      const { nome, sobrenome, email, whatsappNumber, status, plano, planLabel, billingStatus, role } = req.body;

      // Get current user to check for email/phone changes
      const currentUser = await storage.getUser(id);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const updates: any = {};
      const metadata: any = {};

      // Handle name updates
      if (nome !== undefined) {
        updates.firstName = nome;
        metadata.firstName = nome;
      }
      if (sobrenome !== undefined) {
        updates.lastName = sobrenome;
        metadata.lastName = sobrenome;
      }

      // Handle email update (critical: sync with WhatsApp and sessions)
      if (email && email !== currentUser.email) {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ message: "Email inválido" });
        }

        // Check if email is already taken by another user
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== id) {
          return res.status(409).json({ message: "Email já está em uso" });
        }

        updates.email = email;
        metadata.email = email;
        
        // Update WhatsApp purchase mapping
        if (currentUser.telefone || currentUser.whatsappNumber) {
          const phoneNumber = currentUser.whatsappNumber || currentUser.telefone;
          if (phoneNumber) {
            await storage.updatePurchasePhone(email, phoneNumber);
            console.log(`[Admin] Updated WhatsApp mapping: ${email} -> ${phoneNumber}`);
          }
        }

        // Force logout: Delete all sessions for this user
        const allSessions = await db.select().from(sessions);
        for (const session of allSessions) {
          try {
            const sessData = session.sess as any;
            if (sessData?.userId === id || sessData?.user?.id === id) {
              await db.delete(sessions).where(eq(sessions.sid, session.sid));
              console.log(`[Admin] Deleted session ${session.sid} for user ${id} (email change)`);
            }
          } catch (err) {
            // Ignore invalid session data
          }
        }
      }

      // Handle WhatsApp number update
      if (whatsappNumber !== undefined && whatsappNumber !== currentUser.whatsappNumber) {
        // Check if WhatsApp number is already taken by another user
        if (whatsappNumber) {
          const existingUserByPhone = await storage.getUserByPhone(whatsappNumber);
          if (existingUserByPhone && existingUserByPhone.id !== id) {
            return res.status(409).json({ message: "WhatsApp já está em uso" });
          }
        }

        updates.whatsappNumber = whatsappNumber;
        metadata.whatsappNumber = whatsappNumber;
        
        // Update phone in users table
        if (whatsappNumber) {
          updates.telefone = whatsappNumber;
        }

        // Update WhatsApp purchase mapping if email exists
        if (currentUser.email) {
          await storage.updatePurchasePhone(currentUser.email, whatsappNumber);
          console.log(`[Admin] Updated WhatsApp mapping: ${currentUser.email} -> ${whatsappNumber}`);
        }
      }

      // Handle status update (active/suspended) - also update subscriptions
      if (status !== undefined) {
        if (status === 'suspended') {
          updates.billingStatus = 'paused';
          updates.status = 'authenticated';
          
          // Update all active subscriptions to paused
          const userSubscriptions = await storage.getSubscriptionsByUserId(id);
          for (const sub of userSubscriptions) {
            if (sub.status === 'active' || sub.status === 'trial') {
              await storage.updateSubscription(sub.id, { status: 'paused' });
            }
          }
          metadata.status = 'suspended';
        } else if (status === 'active') {
          updates.billingStatus = billingStatus || 'active';
          updates.status = 'authenticated';
          
          // Reactivate paused subscriptions
          const userSubscriptions = await storage.getSubscriptionsByUserId(id);
          for (const sub of userSubscriptions) {
            if (sub.status === 'paused') {
              await storage.updateSubscription(sub.id, { status: 'active' });
            }
          }
          metadata.status = 'active';
        }
      }

      // Handle plano and planLabel
      if (plano !== undefined) {
        updates.plano = plano;
        metadata.plano = plano;
      }
      if (planLabel !== undefined) {
        updates.planLabel = planLabel;
        metadata.planLabel = planLabel;
        
        // Update subscription plan name
        const userSubscriptions = await storage.getSubscriptionsByUserId(id);
        for (const sub of userSubscriptions) {
          if (sub.status === 'active' || sub.status === 'trial') {
            await storage.updateSubscription(sub.id, { planName: planLabel });
          }
        }
      }
      if (billingStatus !== undefined) {
        updates.billingStatus = billingStatus;
        metadata.billingStatus = billingStatus;
      }
      if (role !== undefined) {
        updates.role = role;
        metadata.role = role;
      }

      // Handle interval update (if provided)
      const interval = req.body.interval;
      if (interval) {
        metadata.interval = interval;
        
        // Update or create subscription with new interval
        const userSubscriptions = await storage.getSubscriptionsByUserId(id);
        const activeSubscription = userSubscriptions.find(s => s.status === 'active' || s.status === 'trial');
        
        if (activeSubscription) {
          // Update existing subscription
          const now = new Date();
          const expiresAt = new Date(now);
          if (interval === 'yearly') {
            expiresAt.setDate(expiresAt.getDate() + 365);
          } else {
            expiresAt.setDate(expiresAt.getDate() + 30);
          }
          
          await storage.updateSubscription(activeSubscription.id, {
            interval: interval as 'monthly' | 'yearly',
            billingInterval: interval === 'yearly' ? 'year' : 'month',
            currentPeriodEnd: expiresAt,
          });
        } else if (userSubscriptions.length === 0) {
          // Create new subscription if none exists
          const crypto = await import('crypto');
          const subscriptionId = crypto.randomUUID();
          const now = new Date();
          const expiresAt = new Date(now);
          if (interval === 'yearly') {
            expiresAt.setDate(expiresAt.getDate() + 365);
          } else {
            expiresAt.setDate(expiresAt.getDate() + 30);
          }
          
          await storage.createSubscription({
            userId: id,
            provider: 'manual',
            providerSubscriptionId: subscriptionId,
            planName: currentUser.planLabel || 'Premium',
            priceCents: 0,
            currency: 'BRL',
            billingInterval: interval === 'yearly' ? 'year' : 'month',
            interval: interval as 'monthly' | 'yearly',
            status: billingStatus === 'active' ? 'active' : 'paused',
            currentPeriodEnd: expiresAt,
            meta: {
              createdBy: 'admin',
              adminId: adminId,
              createdAt: now.toISOString(),
            },
          });
        }
      }

      // Update user
      const updatedUser = await storage.updateUser(id, updates);

      if (!updatedUser) {
        return res.status(404).json({ success: false, message: "Usuário não encontrado" });
      }

      // Log admin action
      try {
        await storage.createAdminEventLog({
          adminId: adminId,
          userId: id,
          type: 'update_user',
          metadata: metadata,
        });
      } catch (logError) {
        console.error("[Admin] Warning: Failed to log admin event:", logError);
        // Don't fail the request if logging fails
      }

      res.json({
        success: true,
        ...updatedUser,
      });
    } catch (error: any) {
      console.error("[Admin] ❌ CRITICAL ERROR updating admin user:", error);
      console.error("[Admin] Error details:", {
        message: error.message,
        stack: error.stack,
        userId: req.params.id,
        body: req.body,
      });
      const statusCode = error.message?.includes('já está em uso') ? 409 : 
                        error.message?.includes('inválido') ? 400 : 500;
      res.status(statusCode).json({ 
        success: false,
        message: error.message || "Falha ao atualizar cliente. Tente novamente.",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  });

  app.delete("/api/admin/users/:id", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const adminId = req.session.userId;
      const { id } = req.params;
      
      // Check if user exists
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get subscriptions before deletion (for logging)
      const userSubscriptions = await storage.getSubscriptionsByUserId(id);

      // Delete user (cascade will handle related data including subscriptions)
      await db.delete(users).where(eq(users.id, id));

      // Log admin action (before deletion, so we have user data)
      await storage.createAdminEventLog({
        adminId: adminId,
        userId: id,
        type: 'delete_user',
        metadata: {
          email: user.email,
          whatsappNumber: user.whatsappNumber,
          subscriptionsCount: userSubscriptions.length,
        },
      });

      res.json({ 
        success: true,
        message: "Cliente excluído com sucesso",
        deletedUserId: id,
      });
    } catch (error: any) {
      console.error("[Admin] ❌ CRITICAL ERROR deleting admin user:", error);
      console.error("[Admin] Error details:", {
        message: error.message,
        stack: error.stack,
        userId: req.params.id,
        errorCode: error.code,
        errorName: error.name,
      });
      
      // Check if it's a foreign key constraint error
      const isConstraintError = error.message?.includes('foreign key') || 
                               error.message?.includes('constraint') ||
                               error.code === '23503';
      
      res.status(500).json({ 
        success: false,
        message: isConstraintError 
          ? "Não é possível excluir este cliente pois há dados relacionados. Remova as dependências primeiro."
          : error.message || "Falha ao excluir cliente. Tente novamente.",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  });

  app.post("/api/admin/users/:id/suspend", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const adminId = req.session.userId;
      const { id } = req.params;
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Suspend user: set billingStatus to paused and block access
      const updatedUser = await storage.updateUser(id, {
        billingStatus: 'paused',
        status: 'authenticated', // Keep authenticated but paused (blocks login in auth.ts if needed)
      });

      // Update all active subscriptions to paused
      const userSubscriptions = await storage.getSubscriptionsByUserId(id);
      for (const sub of userSubscriptions) {
        if (sub.status === 'active' || sub.status === 'trial') {
          await storage.updateSubscription(sub.id, { status: 'paused' });
        }
      }

      // Force logout: Delete all sessions for this user
      const allSessions = await db.select().from(sessions);
      for (const session of allSessions) {
        try {
          const sessData = session.sess as any;
          if (sessData?.userId === id || sessData?.user?.id === id) {
            await db.delete(sessions).where(eq(sessions.sid, session.sid));
            console.log(`[Admin] Deleted session ${session.sid} for user ${id} (suspended)`);
          }
        } catch (err) {
          // Ignore invalid session data
        }
      }

      // Log admin action
      await storage.createAdminEventLog({
        adminId: adminId,
        userId: id,
        type: 'suspend_user',
        metadata: {
          email: user.email,
          subscriptionsUpdated: userSubscriptions.filter(s => s.status === 'active' || s.status === 'trial').length,
        },
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error suspending user:", error);
      res.status(500).json({ message: "Failed to suspend user" });
    }
  });

  app.post("/api/admin/users/:id/reactivate", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const adminId = req.session.userId;
      const { id } = req.params;
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Reactivate user: set billingStatus to active
      const updatedUser = await storage.updateUser(id, {
        billingStatus: 'active',
        status: 'authenticated',
      });

      // Reactivate paused subscriptions
      const userSubscriptions = await storage.getSubscriptionsByUserId(id);
      for (const sub of userSubscriptions) {
        if (sub.status === 'paused') {
          await storage.updateSubscription(sub.id, { status: 'active' });
        }
      }

      // Log admin action
      await storage.createAdminEventLog({
        adminId: adminId,
        userId: id,
        type: 'reactivate_user',
        metadata: {
          email: user.email,
          subscriptionsUpdated: userSubscriptions.filter(s => s.status === 'paused').length,
        },
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error reactivating user:", error);
      res.status(500).json({ message: "Failed to reactivate user" });
    }
  });

  app.post("/api/admin/users/:id/logout", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const adminId = req.session.userId;
      const { id } = req.params;
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Force logout: Delete all sessions for this user
      const allSessions = await db.select().from(sessions);
      let deletedCount = 0;

      for (const session of allSessions) {
        try {
          const sessData = session.sess as any;
          if (sessData?.userId === id || sessData?.user?.id === id) {
            await db.delete(sessions).where(eq(sessions.sid, session.sid));
            deletedCount++;
            console.log(`[Admin] Deleted session ${session.sid} for user ${id} (forced logout)`);
          }
        } catch (err) {
          // Ignore invalid session data
        }
      }

      // Log admin action
      await storage.createAdminEventLog({
        adminId: adminId,
        userId: id,
        type: 'force_logout',
        metadata: {
          email: user.email,
          sessionsDeleted: deletedCount,
        },
      });

      res.json({ 
        message: "User logged out successfully",
        sessionsDeleted: deletedCount,
      });
    } catch (error) {
      console.error("Error forcing logout:", error);
      res.status(500).json({ message: "Failed to force logout" });
    }
  });

  app.post("/api/admin/users/:id/reset-password", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const adminId = req.session.userId;
      const { id } = req.params;
      
      // Check if user exists
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate a random temporary password
      const crypto = await import('crypto');
      const tempPassword = crypto.randomBytes(12).toString('base64url').slice(0, 16);
      
      // Hash the new password
      const passwordHash = await hashPassword(tempPassword);
      
      // Update user password
      await storage.updateUser(id, { passwordHash });

      // Log admin action
      await storage.createAdminEventLog({
        adminId: adminId,
        userId: id,
        type: 'reset_password',
        metadata: {
          email: user.email,
        },
      });

      // TODO: Send password via email or WhatsApp
      // For now, return the temporary password (in production, send via secure channel)
      
      res.json({ 
        message: "Password reset successfully",
        temporaryPassword: tempPassword, // In production, remove this and send via email/WhatsApp
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.post("/api/admin/users/:id/regenerate-password", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const adminId = req.session.userId;
      const { id } = req.params;
      
      // Check if user exists
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate a new random temporary password (10 characters)
      const crypto = await import('crypto');
      const tempPassword = crypto.randomBytes(8).toString('base64url').slice(0, 10);
      
      // Hash the new password
      const passwordHash = await hashPassword(tempPassword);
      
      // Get current metadata
      const currentMetadata = (user.metadata as any) || {};
      
      // Update user password and reset sent flag
      await storage.updateUser(id, { 
        passwordHash,
        metadata: {
          ...currentMetadata,
          sentInitialPassword: false, // Reset flag to allow WhatsApp to send again
        },
      });

      // Send password via WhatsApp if user has WhatsApp number
      let whatsappSent = false;
      if (user.whatsappNumber) {
        try {
          const welcomeMessage = `🎉 *Seu acesso ao AnotaTudo.AI foi liberado!*\n\nAqui estão seus dados de login:\n\n• Email: ${user.email}\n• Senha temporária: ${tempPassword}\n\n🔐 Acesse seu painel:\nhttps://anotatudo.com/login\n\nRecomendamos trocar a senha ao entrar.`;
          
          await sendWhatsAppReply(user.whatsappNumber, welcomeMessage);
          whatsappSent = true;
          
          // Mark as sent - get fresh user data to ensure we have latest metadata
          const updatedUser = await storage.getUser(id);
          const freshMetadata = (updatedUser?.metadata as any) || currentMetadata;
          await storage.updateUser(id, {
            metadata: {
              ...freshMetadata,
              sentInitialPassword: true,
              lastPasswordSentAt: new Date().toISOString(),
            },
          });
        } catch (whatsappError) {
          console.error("[Admin] Error sending password via WhatsApp:", whatsappError);
          // Continue even if WhatsApp fails
        }
      }

      // Log admin action
      await storage.createAdminEventLog({
        adminId: adminId,
        userId: id,
        type: 'regenerate_password',
        metadata: {
          email: user.email,
          whatsappSent: whatsappSent,
        },
      });

      res.json({ 
        message: "Password regenerated successfully",
        temporaryPassword: tempPassword,
        whatsappSent: whatsappSent,
      });
    } catch (error) {
      console.error("Error regenerating password:", error);
      res.status(500).json({ message: "Failed to regenerate password" });
    }
  });

  app.get("/api/admin/subscriptions", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const status = req.query.status as string | undefined;
      const provider = req.query.provider as string | undefined;

      const subscriptions = await storage.listSubscriptions({ status, provider });

      console.log(`[Admin] ✅ Fetched ${subscriptions.length} subscriptions (status: ${status || 'all'}, provider: ${provider || 'all'})`);

      res.json(subscriptions);
    } catch (error: any) {
      console.error("[Admin] ❌ CRITICAL ERROR fetching admin subscriptions:", error);
      console.error("[Admin] Error details:", {
        message: error.message,
        stack: error.stack,
        query: req.query,
      });
      res.status(500).json({ 
        success: false,
        message: error.message || "Falha ao buscar assinaturas",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  });

  app.get("/api/admin/subscriptions/:id", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const subscription = await storage.getSubscriptionById(id);

      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      const events = await storage.getSubscriptionEventsBySubscriptionId(id, 50);

      res.json({
        subscription,
        events,
      });
    } catch (error) {
      console.error("Error fetching admin subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  // Webhook Caktos
  app.post("/api/webhooks/caktos", async (req: any, res) => {
    try {
      // TODO: Verificar assinatura do webhook quando os secrets estiverem disponíveis
      // const signature = req.headers['x-caktos-signature'];
      // if (!verifyCaktosSignature(signature, req.body)) {
      //   return res.status(401).json({ message: "Invalid signature" });
      // }

      const event = req.body;
      const eventType = event.type;

      console.log('[CAKTOS WEBHOOK] Received event:', eventType, JSON.stringify(event, null, 2));

      // Find user by email or externalCustomerId
      let user;
      if (event.customer?.email) {
        user = await storage.getUserByEmail(event.customer.email);
      }

      if (!user && event.customer?.externalId) {
        // Se houver um campo externalId, podemos buscar por ele (ajustar conforme necessário)
        // Por enquanto, tentamos buscar pelo email
        console.log('[CAKTOS WEBHOOK] User not found by email, externalId:', event.customer.externalId);
      }

      if (!user) {
        console.log('[CAKTOS WEBHOOK] User not found for event');
        // Retornar 200 para evitar retries do webhook
        return res.status(200).json({ message: "User not found, event ignored" });
      }

      // Process subscription based on event type
      const subscriptionId = event.subscription?.id || event.data?.subscription?.id;
      if (!subscriptionId) {
        console.log('[CAKTOS WEBHOOK] No subscription ID in event');
        return res.status(200).json({ message: "No subscription ID, event ignored" });
      }

      // Check if subscription exists
      let subscription = await storage.getSubscriptionByProviderId('caktos', subscriptionId);

      const subscriptionData = event.subscription || event.data?.subscription || {};
      const planName = subscriptionData.plan?.name || subscriptionData.planName || 'Unknown';
      const priceCents = subscriptionData.price?.cents || subscriptionData.priceCents || 0;
      const currency = subscriptionData.price?.currency || subscriptionData.currency || 'BRL';
      const billingInterval = subscriptionData.billing?.interval || subscriptionData.billingInterval || 'month';
      const status = subscriptionData.status || event.status || 'active';

      const subscriptionUpdate: any = {
        userId: user.id,
        provider: 'caktos',
        providerSubscriptionId: subscriptionId,
        planName,
        priceCents,
        currency,
        billingInterval,
        status,
        meta: event,
      };

      // Handle dates
      if (subscriptionData.trialEndsAt) {
        subscriptionUpdate.trialEndsAt = new Date(subscriptionData.trialEndsAt);
      }
      if (subscriptionData.currentPeriodEnd) {
        subscriptionUpdate.currentPeriodEnd = new Date(subscriptionData.currentPeriodEnd);
      }
      if (subscriptionData.cancelAt) {
        subscriptionUpdate.cancelAt = new Date(subscriptionData.cancelAt);
      }

      if (subscription) {
        // Update existing subscription
        subscription = await storage.updateSubscription(subscription.id, subscriptionUpdate);
      } else {
        // Create new subscription
        subscription = await storage.createSubscription(subscriptionUpdate);
      }

      // Create subscription event
      await storage.createSubscriptionEvent({
        subscriptionId: subscription.id,
        type: eventType,
        rawPayload: event,
      });

      // Update user billing status and plan label
      await storage.updateUser(user.id, {
        billingStatus: status as any,
        planLabel: planName,
      });

      console.log('[CAKTOS WEBHOOK] Processed event successfully:', eventType);

      res.status(200).json({ message: "Event processed", subscriptionId: subscription.id });
    } catch (error) {
      console.error('[CAKTOS WEBHOOK] Error processing webhook:', error);
      res.status(500).json({ message: "Failed to process webhook" });
    }
  });

  // Health Center routes
  app.get("/api/admin/health/overview", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // WhatsApp status - use transacoes with origem from WhatsApp
      const allTransacoes = await db
        .select()
        .from(transacoes)
        .orderBy(desc(transacoes.createdAt));

      const whatsappTransacoes = allTransacoes.filter(t => {
        const createdAt = new Date(t.createdAt);
        return createdAt >= twentyFourHoursAgo && 
               (t.origem === 'texto' || t.origem === 'audio' || t.origem === 'foto' || t.origem === 'video');
      });

      const whatsappTransacoesLastHour = whatsappTransacoes.filter(t => 
        new Date(t.createdAt) >= oneHourAgo
      );

      const whatsappErrors = await storage.getSystemLogs({
        source: 'whatsapp',
        level: 'error',
        limit: 100
      });

      const lastWhatsAppError = whatsappErrors.length > 0 ? whatsappErrors[0].createdAt : null;
      const lastWhatsAppMessage = whatsappTransacoes.length > 0 ? whatsappTransacoes[0].createdAt : null;

      // Calculate error rate (errors in last 24h / total messages in last 24h)
      const whatsappErrors24h = whatsappErrors.filter(e => 
        new Date(e.createdAt) >= twentyFourHoursAgo
      ).length;
      const errorRate24h = whatsappTransacoes.length > 0 
        ? whatsappErrors24h / whatsappTransacoes.length 
        : 0;

      // Determine WhatsApp status
      let whatsappStatus: "up" | "down" | "degraded" = "up";
      if (lastWhatsAppError && new Date(lastWhatsAppError) >= oneHourAgo) {
        whatsappStatus = "down";
      } else if (errorRate24h > 0.1 || (lastWhatsAppMessage && new Date(now.getTime() - new Date(lastWhatsAppMessage).getTime()) > 2 * 60 * 60 * 1000)) {
        whatsappStatus = "degraded";
      }

      // AI status - use same transacoes (all go through AI)
      const aiErrors = await storage.getSystemLogs({
        source: 'ai',
        level: 'error',
        limit: 100
      });

      const aiErrors24h = aiErrors.filter(e => 
        new Date(e.createdAt) >= twentyFourHoursAgo
      ).length;

      const lastAiError = aiErrors.length > 0 ? aiErrors[0].createdAt : null;
      const lastAiCall = whatsappTransacoes.length > 0 ? whatsappTransacoes[0].createdAt : null;

      // Calculate average latency (simplified - would need actual timing data)
      const aiLatency = null; // TODO: Store actual latency in logs

      const aiErrorRate = whatsappTransacoes.length > 0 
        ? aiErrors24h / whatsappTransacoes.length 
        : 0;

      let aiStatus: "up" | "down" | "degraded" = "up";
      if (lastAiError && new Date(lastAiError) >= oneHourAgo) {
        aiStatus = "down";
      } else if (aiErrorRate > 0.1) {
        aiStatus = "degraded";
      }

      // Webhooks status - use subscriptionEvents
      const allWebhookEvents = await db
        .select()
        .from(subscriptionEvents)
        .orderBy(desc(subscriptionEvents.createdAt));

      const webhookEvents = allWebhookEvents.filter(e => 
        new Date(e.createdAt) >= twentyFourHoursAgo
      );

      const webhookErrors = await storage.getSystemLogs({
        source: 'webhook',
        level: 'error',
        limit: 100
      });

      const lastCaktosEvent = webhookEvents.length > 0 ? webhookEvents[0].createdAt : null;
      const lastWebhookError = webhookErrors.length > 0 ? webhookErrors[0].createdAt : null;

      const webhookErrors24h = webhookErrors.filter(e => 
        new Date(e.createdAt) >= twentyFourHoursAgo
      ).length;
      const webhookSuccess24h = webhookEvents.length - webhookErrors24h;

      let webhookStatus: "up" | "down" | "degraded" = "up";
      if (lastWebhookError && new Date(lastWebhookError) >= oneHourAgo) {
        webhookStatus = "down";
      } else if (webhookErrors24h > 0 && webhookErrors24h / webhookEvents.length > 0.1) {
        webhookStatus = "degraded";
      }

      // System status - aggregate all system logs
      const systemEvents = await storage.getSystemLogs({
        source: 'system',
        limit: 1000
      });

      const systemEventsLastHour = systemEvents.filter(e => 
        new Date(e.createdAt) >= oneHourAgo
      );
      const systemEvents24h = systemEvents.filter(e => 
        new Date(e.createdAt) >= twentyFourHoursAgo
      );
      const systemErrors24h = systemEvents24h.filter(e => e.level === 'error').length;

      // Test DB latency
      const dbStart = Date.now();
      await db.select().from(users).limit(1);
      const dbLatency = Date.now() - dbStart;

      let systemStatus: "up" | "down" | "degraded" = "up";
      if (dbLatency > 1000 || systemErrors24h > 10) {
        systemStatus = "down";
      } else if (dbLatency > 500 || systemErrors24h > 5) {
        systemStatus = "degraded";
      }

      res.json({
        whatsapp: {
          status: whatsappStatus,
          lastMessageAt: lastWhatsAppMessage,
          lastErrorAt: lastWhatsAppError,
          messagesLastHour: whatsappTransacoesLastHour.length,
          messagesLast24h: whatsappTransacoes.length,
          errorRate24h: errorRate24h,
        },
        ai: {
          status: aiStatus,
          lastCallAt: lastAiCall,
          lastErrorAt: lastAiError,
          callsLastHour: whatsappTransacoesLastHour.length,
          callsLast24h: whatsappTransacoes.length,
          avgLatencyMsLastHour: aiLatency,
          errorRate24h: aiErrorRate,
        },
        webhooks: {
          status: webhookStatus,
          lastCaktosAt: lastCaktosEvent,
          lastErrorAt: lastWebhookError,
          successLast24h: webhookSuccess24h,
          errorsLast24h: webhookErrors24h,
        },
        system: {
          status: systemStatus,
          dbLatencyMs: dbLatency,
          eventsLastHour: systemEventsLastHour.length,
          eventsLast24h: systemEvents24h.length,
          errorsLast24h: systemErrors24h,
        },
      });
    } catch (error) {
      console.error("Error fetching health overview:", error);
      res.status(500).json({ message: "Failed to fetch health overview" });
    }
  });

  app.get("/api/admin/health/logs", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const level = req.query.level as 'info' | 'warning' | 'error' | undefined;
      const source = req.query.source as 'whatsapp' | 'ai' | 'webhook' | 'system' | 'other' | undefined;

      const logs = await storage.getSystemLogs({
        limit,
        level,
        source,
      });

      res.json(logs.map(log => ({
        id: log.id,
        createdAt: log.createdAt,
        level: log.level,
        source: log.source,
        message: log.message,
        meta: log.meta,
      })));
    } catch (error) {
      console.error("Error fetching health logs:", error);
      res.status(500).json({ message: "Failed to fetch health logs" });
    }
  });

  // Health check test endpoints
  app.post("/api/admin/health/test/whatsapp", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      // Test WhatsApp connection by checking env vars
      const hasToken = !!process.env.WHATSAPP_TOKEN;
      const hasPhoneId = !!process.env.WHATSAPP_PHONE_NUMBER_ID;

      if (!hasToken || !hasPhoneId) {
        return res.json({
          ok: false,
          details: "WhatsApp credentials not configured",
        });
      }

      // Log the test
      await storage.createSystemLog({
        level: 'info',
        source: 'whatsapp',
        message: 'Health check test performed',
        meta: { testType: 'whatsapp', timestamp: new Date().toISOString() },
      });

      res.json({
        ok: true,
        details: "WhatsApp API configured and ready",
      });
    } catch (error) {
      console.error("Error testing WhatsApp:", error);
      res.status(500).json({ message: "Failed to test WhatsApp" });
    }
  });

  app.post("/api/admin/health/test/ai", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      // Test AI connection by checking env vars
      const hasApiKey = !!process.env.OPENAI_API_KEY;

      if (!hasApiKey) {
        return res.json({
          ok: false,
          details: "OpenAI API key not configured",
        });
      }

      // Log the test
      await storage.createSystemLog({
        level: 'info',
        source: 'ai',
        message: 'Health check test performed',
        meta: { testType: 'ai', timestamp: new Date().toISOString() },
      });

      res.json({
        ok: true,
        details: "OpenAI API configured and ready",
      });
    } catch (error) {
      console.error("Error testing AI:", error);
      res.status(500).json({ message: "Failed to test AI" });
    }
  });

  app.post("/api/admin/health/test/check", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      // General health check - test DB connection
      const dbStart = Date.now();
      await db.select().from(users).limit(1);
      const dbLatency = Date.now() - dbStart;

      // Log the test
      await storage.createSystemLog({
        level: 'info',
        source: 'system',
        message: 'General health check performed',
        meta: { dbLatency, timestamp: new Date().toISOString() },
      });

      res.json({
        ok: true,
        details: {
          dbLatency,
          status: dbLatency < 500 ? "healthy" : "degraded",
        },
      });
    } catch (error) {
      console.error("Error performing health check:", error);
      res.status(500).json({ message: "Failed to perform health check" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
