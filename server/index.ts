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

// Healthchecks INSTANTÂNEOS — precisam ser as primeiras rotas
app.get("/", (req, res) => res.status(200).send("OK"));
app.get("/health", (req, res) => res.status(200).send("OK"));

// Default to 5000 (configured in .replit as localPort)
const PORT = 5000;

// Create HTTP server
const httpServer = createServer(app);

// START SERVER IMMEDIATELY - Before any heavy logic
const server = httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`ready`);
});

// ============================================================
// ALL MIDDLEWARES - After healthcheck routes and server start
// ============================================================
app.set("trust proxy", 1);
app.use(getSession());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

app.get("/_health", (req, res) => res.status(200).send("OK"));

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
// HEAVY LOGIC - Runs AFTER server is listening (background)
// ============================================================
(async () => {
  try {
    // Setup static files OR Vite in background
    if (isProd) {
      serveStatic(app);
    } else {
      setupVite(app, httpServer).catch(error => {
        console.error("Failed to setup Vite:", error);
      });
    }
    
    // Register routes AFTER server is listening
    await registerRoutes(app);
    
    // Initialize database AFTER routes are registered (completely non-blocking)
    await initializeDatabaseAsync();
  } catch (error) {
    console.error("Erro pós-startup:", error);
  }
})();

// Database initialization - completely background
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
