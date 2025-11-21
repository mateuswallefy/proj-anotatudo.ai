import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { getSession } from "./session.js";
import { seedAdmin } from "./seedAdmin.js";
import { ensureAdminRootExists } from "./adminRootProtection.js";
import { ensureWebhookEventsTable } from "./ensureWebhookEventsTable.js";
import { storage } from "./storage.js";
import { processWebhook } from "./webhooks/webhookProcessor.js";

const app = express();

// ============================================
// WEBHOOK ENDPOINT - DEVE SER ANTES DE QUALQUER MIDDLEWARE DE AUTENTICAÇÃO
// ============================================
// Este endpoint NÃO requer autenticação e aceita requisições externas
app.post("/api/webhooks/subscriptions", express.json({ type: "*/*" }), async (req, res) => {
  let webhookId: string | null = null;

  try {
    console.log("[WEBHOOK] ========================================");
    console.log("[WEBHOOK] WEBHOOK RECEIVED");
    console.log("[WEBHOOK] Body:", JSON.stringify(req.body, null, 2));
    console.log("[WEBHOOK] ========================================");
    
    const rawPayload = req.body;

    // Validar formato do payload da Cakto
    if (!rawPayload.event || !rawPayload.data) {
      console.log("[WEBHOOK] ❌ Payload inválido - falta 'event' ou 'data'");
      
      // Registrar evento como falhado
      try {
        const invalidWebhook = await storage.createWebhookEvent({
          event: rawPayload.event || rawPayload.type || "webhook_invalid",
          type: rawPayload.event || rawPayload.type || "webhook_invalid",
          payload: rawPayload,
          status: 'failed',
          errorMessage: "Payload inválido - falta 'event' ou 'data'",
          processed: false,
        });
        webhookId = invalidWebhook.id;
      } catch (logError) {
        console.error("[WEBHOOK] ❌ Falha ao registrar evento inválido:", logError);
      }
      
      // Sempre retornar 200 OK mesmo com erro
      return res.status(200).json({ success: true });
    }

    // 1. Registrar webhook como PENDING antes de processar
    console.log("[WEBHOOK] 📝 Registrando webhook como PENDING...");
    const webhookRecord = await storage.createWebhookEvent({
      event: rawPayload.event,
      type: rawPayload.event,
      payload: rawPayload,
      status: 'pending',
      processed: false,
    });
    webhookId = webhookRecord.id;
    console.log(`[WEBHOOK] ✅ Webhook registrado com ID: ${webhookId}`);

    // 2. Processar webhook usando o processador completo
    console.log(`[WEBHOOK] 🔄 Iniciando processamento do webhook ${webhookId}...`);
    await processWebhook(webhookId, rawPayload);

    console.log(`[WEBHOOK] ✅ Webhook ${webhookId} processado com sucesso`);
    return res.status(200).json({ success: true });

  } catch (err: any) {
    console.error("[WEBHOOK] ========================================");
    console.error("[WEBHOOK] ❌ ERRO CRÍTICO NO WEBHOOK");
    console.error("[WEBHOOK] Erro:", err);
    console.error("[WEBHOOK] Stack:", err.stack);
    console.error("[WEBHOOK] Body recebido:", JSON.stringify(req.body, null, 2));
    console.error("[WEBHOOK] ========================================");
    
    // Se o webhook foi registrado, atualizar status como falhado
    if (webhookId) {
      try {
        const webhook = await storage.getWebhookEventById(webhookId);
        const currentRetryCount = webhook?.retryCount || 0;
        
        await storage.updateWebhookStatus(webhookId, {
          status: 'failed',
          errorMessage: err.stack || err.message || 'Erro desconhecido',
          retryCount: currentRetryCount + 1,
          lastRetryAt: new Date(),
        });
      } catch (updateError) {
        console.error("[WEBHOOK] ❌ Falha ao atualizar status do webhook:", updateError);
      }
    } else {
      // Se não foi registrado, tentar registrar como falhado
      try {
        await storage.createWebhookEvent({
          event: req.body?.event || req.body?.type || "webhook_error",
          type: req.body?.event || req.body?.type || "webhook_error",
          payload: req.body,
          status: 'failed',
          errorMessage: err.stack || err.message || 'Erro desconhecido',
          retryCount: 1,
          lastRetryAt: new Date(),
          processed: false,
        });
      } catch (logError) {
        console.error("[WEBHOOK] ❌ Falha ao registrar evento de erro:", logError);
      }
    }

    // Webhook nunca pode falhar - sempre retornar 200 OK
    return res.status(200).json({ success: true });
  }
});

// Session middleware for local auth
app.set("trust proxy", 1);
app.use(getSession());

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Seed admin user in production (before routes are registered)
  await seedAdmin();
  
  // 🔒 PROTEÇÃO ADMIN-ROOT: Verificar e recriar admin-root se necessário
  await ensureAdminRootExists();
  
  // 🔧 WEBHOOK-EVENTS: Garantir que a tabela webhook_events existe
  await ensureWebhookEventsTable();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error('[Server Error]', err);
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  
  // Check if port is already in use before listening
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  
  try {
    const { stdout } = await execAsync(`lsof -t -i:${port} 2>/dev/null || echo ""`);
    if (stdout.trim() !== '') {
      console.error(`[SERVER] ⚠️  Port ${port} is already in use!`);
      console.error(`[SERVER] Please run: npm run kill-port`);
      console.error(`[SERVER] Or: npm run restart-safe`);
      process.exit(1);
    }
  } catch (error) {
    // lsof not available or port is free, continue
  }
  
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    console.log(`[SERVER] ✅ Server started successfully on port ${port}`);
    console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[SERVER] Public endpoint: http://localhost:${port}/api/user-status`);
  });
  
  // Handle server errors
  server.on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`[SERVER] ❌ Port ${port} is already in use!`);
      console.error(`[SERVER] Please run: npm run kill-port`);
      console.error(`[SERVER] Or: npm run restart-safe`);
    } else {
      console.error(`[SERVER] ❌ Server error:`, error);
    }
    process.exit(1);
  });
})();
