import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { getSession } from "./session.js";
import { seedAdmin } from "./seedAdmin.js";
import { ensureAdminRootExists } from "./adminRootProtection.js";
import { ensureWebhookEventsTable } from "./ensureWebhookEventsTable.js";
import { storage } from "./storage.js";
import { handleWebhookEvent } from "./webhooks/processSubscriptionEvent.js";

const app = express();

// ============================================
// WEBHOOK ENDPOINT - DEVE SER ANTES DE QUALQUER MIDDLEWARE DE AUTENTICAÇÃO
// ============================================
// Este endpoint NÃO requer autenticação e aceita requisições externas
app.post("/api/webhooks/subscriptions", express.json({ type: "*/*" }), async (req, res) => {
  try {
    console.log("WEBHOOK RECEIVED:", JSON.stringify(req.body, null, 2));
    
    const rawPayload = req.body;

    // Validar formato do payload da Cakto
    if (!rawPayload.event || !rawPayload.data) {
      console.log("WEBHOOK ERROR: Payload inválido - falta 'event' ou 'data'");
      // Registrar evento mesmo com payload inválido
      try {
        await storage.createWebhookEvent({
          type: rawPayload.event || rawPayload.type || "webhook_invalid",
          payload: rawPayload,
          processed: false,
        });
      } catch (logError) {
        console.error("WEBHOOK ERROR: Falha ao registrar evento inválido:", logError);
      }
      // Sempre retornar 200 OK mesmo com erro
      return res.status(200).json({ success: true });
    }

    // Processar evento usando o processador completo
    await handleWebhookEvent({
      event: rawPayload.event,
      data: rawPayload.data,
    });

    console.log(`WEBHOOK: Processado com sucesso - Evento: ${rawPayload.event}`);
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("WEBHOOK ERROR:", err);
    console.error("WEBHOOK ERROR - Stack:", err.stack);
    console.error("WEBHOOK ERROR - Body recebido:", JSON.stringify(req.body, null, 2));
    
    // Registrar evento com erro
    try {
      await storage.createWebhookEvent({
        type: req.body?.event || req.body?.type || "webhook_error",
        payload: req.body,
        processed: false,
      });
    } catch (logError) {
      console.error("WEBHOOK ERROR: Falha ao registrar evento de erro:", logError);
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
