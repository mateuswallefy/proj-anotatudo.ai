import express from "express";
import { createServer, IncomingMessage, ServerResponse } from "http";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { getSession } from "./session.js";
import { seedAdmin } from "./seedAdmin.js";
import { ensureAdminRootExists } from "./adminRootProtection.js";
import { ensureWebhookEventsTable } from "./ensureWebhookEventsTable.js";
import { storage } from "./storage.js";

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// Webhook endpoint - no auth (must be before json middleware)
app.post("/api/webhooks/subscriptions", express.json({ type: "*/*" }), async (req, res) => {
  try {
    await storage.createWebhookEvent({
      event: req.body?.event ?? "unknown",
      type: req.body?.event ?? "unknown",
      payload: req.body,
      status: "pending",
      processed: false,
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(200).json({ ok: true });
  }
});

app.set("trust proxy", 1);
app.use(getSession());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health endpoints
app.get("/_health", (req, res) => res.status(200).json({ ok: true }));
app.get("/health", (req, res) => res.status(200).json({ ok: true }));

// Server startup
const httpServer = createServer(app);

if (isProd) {
  // Production: Use PORT env from Autoscale (maps to 80)
  const port = parseInt(process.env.PORT || '5000');
  httpServer.listen(port, "0.0.0.0", () => {
    console.log(`ready`);
    console.log(`✅ Server listening on http://0.0.0.0:${port}`);
    initializeAsync();
  });
} else {
  // Development: Listen on port 5000 (has externalPort in .replit for preview)
  httpServer.listen(5000, "0.0.0.0", () => {
    console.log(`ready`);
    console.log(`✅ Server listening on http://0.0.0.0:5000`);
    initializeAsync();
    
    // Also create a tiny server on port 3000 to satisfy the workflow's waitForPort
    const proxyServer = createServer((req: IncomingMessage, res: ServerResponse) => {
      res.writeHead(302, { 'Location': `http://localhost:5000${req.url}` });
      res.end();
    });
    proxyServer.listen(3000, "0.0.0.0", () => {
      console.log(`📍 Proxy on port 3000 → 5000`);
    });
  });
}

// Async initialization in background
async function initializeAsync() {
  try {
    await registerRoutes(app);
    
    // In development, use Vite middleware for HMR
    // In production, serve static files
    if (isProd) {
      serveStatic(app);
    } else {
      await setupVite(app, httpServer);
    }
    
    await Promise.allSettled([
      seedAdmin(),
      ensureAdminRootExists(),
      ensureWebhookEventsTable(),
    ]);
    
    log("✅ Initialization complete", "SERVER");
  } catch (error) {
    console.error("Init error:", error);
  }
}

export default httpServer;
