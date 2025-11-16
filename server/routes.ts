import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated, hashPassword, comparePassword } from "./auth";
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
import { processWhatsAppMessage } from "./ai";
import { 
  calculateFinancialInsights, 
  calculateSpendingProgress,
  getMonthlyComparison,
  getExpensesByCategory,
  getIncomeByCategory,
  getYearlyEvolution,
  getPeriodSummary
} from "./analytics";
import { z } from "zod";
import { sendWhatsAppReply, normalizePhoneNumber, extractEmail, checkRateLimit, downloadWhatsAppMedia } from "./whatsapp";

function parsePeriodParam(period?: string): { mes?: number; ano?: number } {
  if (!period || !/^\d{4}-\d{2}$/.test(period)) {
    return {};
  }
  const [year, month] = period.split('-').map(Number);
  return { mes: month, ano: year };
}

export async function registerRoutes(app: Express): Promise<Server> {

  // Health check endpoints for Cloud Run (must be first)
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/_health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
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
      console.error("Error logging in:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao fazer login" });
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

  // TODO: Implement secure password reset with email verification
  // For now, users can use "Criar Conta" with their purchase email to set a new password

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove sensitive data before sending to client
      const { passwordHash, ...sanitizedUser } = user;
      
      res.json(sanitizedUser);
    } catch (error) {
      console.error("Error fetching user:", error);
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
      
      const transacao = await storage.createTransacao(data);
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
          "Bem-vindo ao AnotaTudo.AI!\n\nPara liberar seu acesso, envie o e-mail usado na compra."
        );
        res.status(200).json({ success: true });
        return;
      }

      // Se usuário está aguardando email
      if (user.status === 'awaiting_email') {
        // Só aceitar texto para autenticação
        if (messageType !== 'text' || !content) {
          await sendWhatsAppReply(
            phoneNumber,
            "Por favor, envie o e-mail usado na compra (apenas texto).\n\nExemplo: seu@email.com"
          );
          res.status(200).json({ success: true });
          return;
        }

        const email = extractEmail(content);

        if (!email) {
          await sendWhatsAppReply(
            phoneNumber,
            "Por favor, envie um e-mail válido para continuar.\n\nExemplo: seu@email.com"
          );
          res.status(200).json({ success: true });
          return;
        }

        // Buscar compra aprovada
        const purchase = await storage.getPurchaseByEmail(email);

        if (!purchase || purchase.status !== 'approved') {
          await sendWhatsAppReply(
            phoneNumber,
            "Email não encontrado ou compra não aprovada.\n\nPor favor, use o mesmo e-mail da compra ou entre em contato com o suporte."
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
      
      await storage.updateGoalStatus(id, status);
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

  // Webhook verification (GET) - Meta sends this to verify your endpoint
  app.get("/api/whatsapp/webhook", (req, res) => {
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "seu_token_secreto_aqui";
    
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    console.log("[WhatsApp Webhook] Verification request:", { mode, token });
    
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log("[WhatsApp Webhook] ✅ Webhook verified successfully!");
      res.status(200).send(challenge);
    } else {
      console.log("[WhatsApp Webhook] ❌ Verification failed");
      res.sendStatus(403);
    }
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
            
            // Find or create user by phone number
            let user = await storage.getUserByPhone(fromNumber);
            
            if (!user) {
              console.log(`[WhatsApp] Creating new user for phone ${fromNumber}`);
              user = await storage.createUserFromPhone(fromNumber);
              console.log(`[WhatsApp] User created with status: ${user.status}`);
            }
            
            // Extract message content
            let messageContent = '';
            if (messageType === 'text') {
              messageContent = message.text.body;
            } else if (messageType === 'audio') {
              // Download audio file from WhatsApp
              try {
                messageContent = await downloadWhatsAppMedia(message.audio.id, 'audio');
                console.log(`[WhatsApp] Audio downloaded: ${messageContent}`);
              } catch (error: any) {
                console.error(`[WhatsApp] Failed to download audio:`, error.message);
                await sendWhatsAppReply(fromNumber, "❌ Erro ao baixar áudio. Por favor, tente novamente.");
                continue;
              }
            } else if (messageType === 'image') {
              messageContent = message.image.id;
            } else if (messageType === 'video') {
              messageContent = message.video.id;
            }
            
            console.log(`[WhatsApp] User status: ${user.status}, Message: "${messageContent}"`);
            
            // ========================================
            // AUTHENTICATION FLOW
            // ========================================
            
            if (user.status === 'awaiting_email') {
              // User needs to send email to authenticate
              
              if (messageType === 'text') {
                const extractedEmail = extractEmail(messageContent);
                
                if (extractedEmail) {
                  console.log(`[WhatsApp] Email extracted: ${extractedEmail}`);
                  
                  // Verify if purchase exists and is approved
                  const purchase = await storage.getPurchaseByEmail(extractedEmail);
                  
                  if (purchase) {
                    // Authenticate user
                    await storage.updateUserEmail(user.id, extractedEmail);
                    await storage.updateUserStatus(user.id, 'authenticated');
                    await storage.updatePurchasePhone(extractedEmail, fromNumber);
                    
                    console.log(`[WhatsApp] ✅ User authenticated: ${extractedEmail}`);
                    
                    await sendWhatsAppReply(
                      fromNumber,
                      "✅ *Acesso liberado!*\n\nAgora você já pode enviar suas transações financeiras.\n\n💡 Exemplos:\n• \"Gastei R$ 45 no mercado\"\n• \"Recebi R$ 5000 de salário\"\n• Envie foto de um recibo\n• Envie áudio descrevendo a transação"
                    );
                  } else {
                    console.log(`[WhatsApp] ❌ No approved purchase found for ${extractedEmail}`);
                    
                    await sendWhatsAppReply(
                      fromNumber,
                      "❌ *Esse e-mail não possui compra válida.*\n\nVerifique se você digitou corretamente o e-mail usado na compra ou entre em contato com o suporte."
                    );
                  }
                } else {
                  // Not a valid email, prompt again
                  console.log(`[WhatsApp] Invalid email format in message: "${messageContent}"`);
                  
                  await sendWhatsAppReply(
                    fromNumber,
                    "📧 *Para liberar seu acesso, envie o e-mail usado na compra.*\n\nExemplo: seuemail@gmail.com"
                  );
                }
              } else {
                // Non-text message while awaiting email
                await sendWhatsAppReply(
                  fromNumber,
                  "📧 *Para liberar seu acesso, envie o e-mail usado na compra.*\n\nPor favor, envie uma mensagem de texto com seu e-mail."
                );
              }
            } 
            
            // ========================================
            // TRANSACTION PROCESSING (AUTHENTICATED USERS ONLY)
            // ========================================
            
            else if (user.status === 'authenticated') {
              console.log(`[WhatsApp] Processing transaction for authenticated user`);
              
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
                  "❌ Erro ao processar mensagem. Tente novamente."
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

  const httpServer = createServer(app);

  return httpServer;
}
