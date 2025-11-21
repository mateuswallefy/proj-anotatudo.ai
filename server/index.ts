import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { getSession } from "./session.js";
import { seedAdmin } from "./seedAdmin.js";
import { ensureAdminRootExists } from "./adminRootProtection.js";
import { ensureWebhookEventsTable } from "./ensureWebhookEventsTable.js";
import { storage } from "./storage.js";

const app = express();

// ============================================
// WEBHOOK ENDPOINT - DEVE SER ANTES DE QUALQUER MIDDLEWARE DE AUTENTICAÇÃO
// ============================================
// Este endpoint NÃO requer autenticação e aceita requisições externas
app.post("/api/webhooks/subscriptions", express.json({ type: "*/*" }), async (req, res) => {
  try {
    console.log("WEBHOOK RECEIVED:", JSON.stringify(req.body, null, 2));
    
    const rawPayload = req.body;

    // Normalizar payload para formato interno
    const normalizePayload = (payload: any): {
      event: string;
      name: string;
      email: string;
      whatsapp: string;
      plan: string;
      status: string;
      externalId: string | null;
      rawPayload: any;
    } => {
      // Tentar diferentes formatos de payload
      let event = payload.event || payload.type || payload.action || "subscription_created";
      let email = payload.email || payload.customer?.email || payload.user?.email || payload.data?.email;
      let name = payload.name || payload.customer?.name || payload.user?.name || payload.data?.name || "";
      let whatsapp = payload.whatsapp || payload.phone || payload.customer?.phone || payload.data?.whatsapp || "";
      let plan = payload.plan || payload.product?.name || payload.subscription?.plan || payload.data?.plan || "premium";
      let status = payload.status || payload.subscription?.status || payload.data?.status || "active";
      let externalId = payload.id || payload.subscription_id || payload.external_id || payload.data?.id || null;

      // Mapear status comuns
      const statusMap: Record<string, string> = {
        'paid': 'active',
        'payment_succeeded': 'active',
        'subscription_created': 'trial',
        'subscription_activated': 'active',
        'subscription_canceled': 'canceled',
        'subscription_paused': 'paused',
        'payment_failed': 'overdue',
        'subscription_expired': 'canceled',
      };

      if (statusMap[status.toLowerCase()]) {
        status = statusMap[status.toLowerCase()];
      }

      // Normalizar plan
      const planMap: Record<string, string> = {
        'free': 'free',
        'premium': 'premium',
        'enterprise': 'enterprise',
        'pro': 'premium',
        'basic': 'free',
      };

      if (planMap[plan.toLowerCase()]) {
        plan = planMap[plan.toLowerCase()];
      }

      return {
        event,
        name: name || email?.split('@')[0] || "Cliente",
        email: email || "",
        whatsapp: whatsapp || "",
        plan,
        status: status.toLowerCase(),
        externalId: externalId?.toString() || null,
        rawPayload: payload,
      };
    };

    const normalized = normalizePayload(rawPayload);

    // Validar email obrigatório
    if (!normalized.email) {
      console.log("WEBHOOK ERROR: Email não fornecido no payload");
      // Registrar evento mesmo sem email válido
      try {
        await storage.createWebhookEvent({
          type: normalized.event,
          payload: rawPayload,
          processed: false,
        });
      } catch (logError) {
        console.error("WEBHOOK ERROR: Falha ao registrar evento sem email:", logError);
      }
      // Sempre retornar 200 OK mesmo com erro
      return res.status(200).json({ success: true });
    }

    // Criar ou atualizar usuário
    let user = await storage.getUserByEmail(normalized.email);
    
    if (!user) {
      // Criar novo usuário
      const nameParts = normalized.name.split(' ');
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(' ') || "";

      user = await storage.createUser({
        email: normalized.email,
        firstName,
        lastName,
        whatsappNumber: normalized.whatsapp || null,
        plano: normalized.plan,
        billingStatus: normalized.status as any,
        status: 'authenticated',
        role: 'user',
      });
      console.log(`WEBHOOK: Usuário criado - ${normalized.email}`);
    } else {
      // Atualizar usuário existente
      const nameParts = normalized.name.split(' ');
      const firstName = nameParts[0] || user.firstName || "";
      const lastName = nameParts.slice(1).join(' ') || user.lastName || "";

      await storage.updateUser(user.id, {
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        whatsappNumber: normalized.whatsapp || user.whatsappNumber,
        plano: normalized.plan,
        billingStatus: normalized.status as any,
      });
      console.log(`WEBHOOK: Usuário atualizado - ${normalized.email}`);
    }

    // Criar ou atualizar assinatura
    const providerSubscriptionId = normalized.externalId || `webhook_${Date.now()}`;
    let subscription = await storage.getSubscriptionByProviderId('manual', providerSubscriptionId);

    if (!subscription) {
      // Criar nova assinatura
      const priceCents = rawPayload.amount || rawPayload.price || rawPayload.value || 0;
      const billingInterval = rawPayload.interval === 'year' || rawPayload.interval === 'yearly' ? 'year' : 'month';
      const interval = billingInterval === 'year' ? 'yearly' : 'monthly';

      subscription = await storage.createSubscription({
        userId: user.id,
        provider: 'manual',
        providerSubscriptionId,
        planName: normalized.plan === 'premium' ? 'Premium' : normalized.plan === 'enterprise' ? 'Enterprise' : 'Free',
        priceCents: typeof priceCents === 'number' ? priceCents : 0,
        currency: 'BRL',
        billingInterval: billingInterval as any,
        interval: interval as any,
        status: normalized.status as any,
        meta: {
          source: 'webhook',
          originalPayload: rawPayload,
        },
      });
      console.log(`WEBHOOK: Assinatura criada - ${subscription.id}`);
    } else {
      // Atualizar assinatura existente
      await storage.updateSubscription(subscription.id, {
        status: normalized.status as any,
        meta: {
          ...(subscription.meta as any || {}),
          lastWebhookPayload: rawPayload,
          lastWebhookAt: new Date().toISOString(),
        },
      });
      console.log(`WEBHOOK: Assinatura atualizada - ${subscription.id}`);
    }

    // Registrar evento de webhook
    await storage.createWebhookEvent({
      type: normalized.event,
      payload: rawPayload,
      processed: true,
    });

    // Registrar evento de assinatura
    await storage.createSubscriptionEvent({
      subscriptionId: subscription.id,
      type: normalized.event,
      rawPayload: rawPayload,
    });

    console.log(`WEBHOOK: Processado com sucesso - Evento: ${normalized.event}, Email: ${normalized.email}`);
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
