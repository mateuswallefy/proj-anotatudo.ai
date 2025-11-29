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

// ============================================================
// HEALTH CHECK ENDPOINTS - MUST BE FIRST, BEFORE ANY MIDDLEWARE
// These respond instantly without database or session checks
// ============================================================
app.get("/", (req, res) => res.status(200).send("OK"));
app.get("/_health", (req, res) => res.status(200).send("OK"));
app.get("/health", (req, res) => res.status(200).send("OK"));

// Diagnostic endpoint (no DB connection required)
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

// ============================================================
// WEBHOOKS - Before session middleware (no auth required)
// ============================================================
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

// ============================================================
// MIDDLEWARES - Session, JSON parsing, etc.
// ============================================================
app.set("trust proxy", 1);
app.use(getSession());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Server startup
// CRITICAL: Autoscale default detection - must listen on 0.0.0.0
// Autoscale binds first port to external 80. Port must be 5000 per .replit config
const httpServer = createServer(app);

// Default to 5000 (configured in .replit as localPort)
// Autoscale doesn't pass PORT env, so we hardcode the configured port
const port = 5000;

// Register routes IMMEDIATELY (synchronous setup)
registerRoutes(app).catch(error => {
  console.error("Failed to register routes:", error);
});

// Setup static/vite in background
if (isProd) {
  serveStatic(app);
} else {
  setupVite(app, httpServer).catch(error => {
    console.error("Failed to setup Vite:", error);
  });
}

httpServer.listen(port, "0.0.0.0", () => {
  // Log "ready" FIRST - Autoscale detects port immediately
  console.log(`ready`);
  
  // Only run database tasks in background
  initializeDatabaseAsync().catch(error => {
    console.error("Database initialization error:", error);
  });
});

// Only database tasks in background - routes and static files already loaded
async function initializeDatabaseAsync() {
  try {
    await Promise.allSettled([
      seedAdmin(),
      ensureAdminRootExists(),
      ensureWebhookEventsTable(),
    ]);
    
    log("✅ Database initialization complete", "SERVER");
  } catch (error) {
    console.error("Database initialization error:", error);
  }
}

export default httpServer;
