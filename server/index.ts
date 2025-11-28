import express from "express";
import { createServer } from "http";
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

// Health endpoints - for Autoscale and uptime monitoring
// /_health must respond immediately without database/initialization checks
app.get("/_health", (req, res) => res.status(200).send("OK"));
app.get("/health", (req, res) => res.status(200).json({ ok: true }));

// Diagnostic endpoint to verify DATABASE_URL in production
// This helps confirm which database the container is actually using
app.get("/_db-check", (req, res) => {
  const dbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || "NOT_SET";
  const maskedUrl = dbUrl.replace(/:[^:@]+@/, ":****@");
  const isNeon = dbUrl.includes("neon");
  const isBrazil = dbUrl.includes("sa-east-1");
  
  res.json({
    status: "ok",
    database: isNeon ? "NEON" : "UNKNOWN",
    url: maskedUrl,
    region: isBrazil ? "sa-east-1 (Brazil)" : "other",
    source: process.env.NEON_DATABASE_URL ? "NEON_DATABASE_URL (secure)" : "DATABASE_URL",
    env: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    correct: isNeon ? "YES - Using Neon via secure env var" : "NO - Check configuration"
  });
});

// Server startup
// CRITICAL: Autoscale default detection - must listen on 0.0.0.0
// Autoscale binds first port to external 80. Port must be 5000 per .replit config
const httpServer = createServer(app);

// Default to 5000 (configured in .replit as localPort)
// Autoscale doesn't pass PORT env, so we hardcode the configured port
const port = 5000;

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`ready`);
  console.log(`✅ Server listening on http://0.0.0.0:${port}`);
  initializeAsync();
});

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
