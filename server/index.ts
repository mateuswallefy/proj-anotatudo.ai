import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { serveStatic, log } from "./vite.js"; // only for PROD
import { registerRoutes } from "./routes.js";
import { getSession } from "./session.js";
import { seedAdmin } from "./seedAdmin.js";
import { ensureAdminRootExists } from "./adminRootProtection.js";
import { ensureWebhookEventsTable } from "./ensureWebhookEventsTable.js";
import { initializeDatabaseAsync } from "./db.js";

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// Healthchecks INSTANTÂNEOS — precisam ser as primeiras rotas
// IMPORTANTE: Estas rotas devem estar ANTES de qualquer middleware
// para garantir resposta instantânea sem dependências
// Em produção, "/health" é usado pelo Replit para healthcheck
// A rota "/" será servida pelo serveStatic (index.html da aplicação)
app.get("/health", (req, res) => res.status(200).send("OK"));
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Get PORT from environment or default to 5000
const PORT = Number(process.env.PORT) || 5000;

// Create HTTP server
const httpServer = http.createServer(app);

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

// Main startup function
(async () => {
  try {
    // Initialize database connection FIRST (before routes that might use it)
    await initializeDatabaseAsync();

    // Setup static files in production ONLY
    // In development, Vite runs separately on port 5173
    if (isProd) {
      try {
        serveStatic(app);
        console.log("✅ Static files configured");
      } catch (error) {
        console.error("❌ Failed to setup static files:", error);
        // Don't crash - server can still serve API routes
      }
    } else {
      console.log("✅ DEV mode: Backend serves only /api routes - Vite runs separately on port 5173");
    }
    
    // Apply middleware
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

    // Session middleware - ONLY for /api and /admin routes
    app.use("/api", getSession());
    app.use("/admin", getSession());
    
    // Register routes AFTER database is initialized
    await registerRoutes(app);
    
    // Start HTTP server
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Servidor rodando na porta ${PORT}`);
      console.log(`ready`);
      
      // Run seeds and database setup AFTER server is listening (non-blocking)
      runDatabaseSetup().catch((error) => {
        console.error("Database setup error:", error);
      });
    });

    httpServer.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use.`);
        console.error(`💡 Soluções:`);
        console.error(`   1. Execute: pkill -f "tsx server/index.ts"`);
        console.error(`   2. Ou reinicie o Replit`);
        console.error(`   3. Ou aguarde alguns segundos e tente novamente`);
        process.exit(1);
      } else {
        console.error("❌ Server error:", error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
})();

export default httpServer;
