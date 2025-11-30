import express from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { getSession } from "./session.js";
import { seedAdmin } from "./seedAdmin.js";
import { ensureAdminRootExists } from "./adminRootProtection.js";
import { ensureWebhookEventsTable } from "./ensureWebhookEventsTable.js";
import { initializeDatabaseAsync } from "./db.js";

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
// MIDDLEWARES - After healthcheck routes and server start
// NO SESSION HERE - Session only on /api and /admin routes
// ============================================================
app.set("trust proxy", 1);
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
// HEAVY LOGIC - Runs AFTER server is listening (background)
// ============================================================
(async () => {
  try {
    // Initialize database connection FIRST (before routes that might use it)
    await initializeDatabaseAsync();
    
    // Setup static files OR Vite in background
    if (isProd) {
      serveStatic(app);
    } else {
      setupVite(app, httpServer).catch(error => {
        console.error("Failed to setup Vite:", error);
      });
    }
    
    // Session middleware - ONLY for /api and /admin routes (after server is up)
    app.use("/api", getSession());
    app.use("/admin", getSession());
    
    // Register routes AFTER database is initialized
    await registerRoutes(app);
    
    // Run seeds and database setup AFTER routes are registered
    await runDatabaseSetup();
  } catch (error) {
    console.error("Erro pós-startup:", error);
  }
})();

// Database setup - seeds, tables, etc (runs after DB is initialized)
async function runDatabaseSetup() {
  try {
    await Promise.allSettled([
      seedAdmin(),
      ensureAdminRootExists(),
      ensureWebhookEventsTable(),
    ]);
    
    log("✅ Database setup complete", "SERVER");
  } catch (error) {
    console.error("Database setup error:", error);
  }
}

export default httpServer;
