import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertTransacaoSchema, insertCartaoSchema } from "@shared/schema";
import { processWhatsAppMessage } from "./ai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Transaction routes
  app.get("/api/transacoes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transacoes = await storage.getTransacoes(userId);
      res.json(transacoes);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transacoes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const cartoes = await storage.getCartoes(userId);
      res.json(cartoes);
    } catch (error) {
      console.error("Error fetching cards:", error);
      res.status(500).json({ message: "Failed to fetch cards" });
    }
  });

  app.post("/api/cartoes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  const httpServer = createServer(app);

  return httpServer;
}
