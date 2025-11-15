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
  insertAccountMemberSchema
} from "@shared/schema";
import { processWhatsAppMessage } from "./ai";
import { calculateFinancialInsights, calculateSpendingProgress } from "./analytics";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {

  // Local Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(409).json({ message: "Email já está em uso" });
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
      const { email, password } = loginSchema.parse(req.body);

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }

      // Verify password
      const isValid = await comparePassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }

      // Create session
      req.session.userId = user.id;

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

  // Transaction routes
  app.get("/api/transacoes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const transacoes = await storage.getTransacoes(userId);
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
      const messageType = message.type; // text, audio, image, video
      let content = "";

      switch (messageType) {
        case 'text':
          content = message.text?.body || "";
          break;
        case 'audio':
          // Em produção, você baixaria o áudio usando a API do WhatsApp
          content = ""; // caminho do arquivo de áudio
          break;
        case 'image':
          // Em produção, você baixaria a imagem e converteria para base64
          content = ""; // base64 da imagem
          break;
        case 'video':
          // Em produção, você extrairia frames do vídeo
          content = ""; // base64 do frame
          break;
      }

      // Processar com IA apenas se tiver conteúdo
      if (content && messageType === 'text') {
        const extractedData = await processWhatsAppMessage(messageType, content);
        
        // Encontrar usuário pelo telefone (em produção, você teria uma tabela de mapeamento)
        // Por enquanto, vamos apenas logar os dados extraídos
        console.log("Dados extraídos da mensagem do WhatsApp:", {
          phoneNumber,
          extractedData,
        });

        // Aqui você criaria a transação automaticamente
        // const transacao = await storage.createTransacao({
        //   userId: userIdFromPhone,
        //   tipo: extractedData.tipo,
        //   categoria: extractedData.categoria,
        //   valor: extractedData.valor?.toString() || "0",
        //   dataReal: extractedData.dataReal,
        //   origem: messageType,
        //   descricao: extractedData.descricao,
        // });
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
      const mes = req.query.mes ? parseInt(req.query.mes as string) : undefined;
      const ano = req.query.ano ? parseInt(req.query.ano as string) : undefined;
      
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
      const mes = req.query.mes ? parseInt(req.query.mes as string) : undefined;
      const ano = req.query.ano ? parseInt(req.query.ano as string) : undefined;
      
      const progress = await calculateSpendingProgress(userId, mes, ano);
      res.json(progress);
    } catch (error) {
      console.error("Error calculating spending progress:", error);
      res.status(500).json({ message: "Failed to calculate progress" });
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
      const limits = await storage.getSpendingLimits(userId);
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

  const httpServer = createServer(app);

  return httpServer;
}
