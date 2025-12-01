import express from "express";
import { createServer } from "http";
import { createServer as createTestServer } from "http";
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
// IMPORTANTE: Estas rotas devem estar ANTES de qualquer middleware
// para garantir resposta instantânea sem dependências
// Em produção, "/health" é usado pelo Replit para healthcheck
// A rota "/" será servida pelo serveStatic (index.html da aplicação)
app.get("/health", (req, res) => res.status(200).send("OK"));
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Get PORT from environment or default to 5000
const PORT = Number(process.env.PORT) || 5000;

// Create HTTP server
const httpServer = createServer(app);

// Function to check if port is available
async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const testServer = createTestServer();
    testServer.listen(port, "0.0.0.0", () => {
      testServer.close(() => resolve(true));
    });
    testServer.on("error", () => resolve(false));
  });
}

// Function to start server on a specific port
async function startServer(port: number) {
  // Check if port is available first
  const available = await isPortAvailable(port);
  if (!available) {
    console.warn(`⚠️  Port ${port} is in use. Attempting to free it...`);
    // Try to kill processes on this port (non-blocking)
    try {
      const { exec } = await import("child_process");
      exec(`fuser -k ${port}/tcp 2>/dev/null || true`, () => {});
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (e) {
      // Ignore errors
    }
  }

  return new Promise<void>((resolve, reject) => {
    const server = httpServer.listen(port, "0.0.0.0", () => {
      console.log(`✅ Servidor rodando na porta ${port}`);
      console.log(`ready`);
      resolve();
    });

    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        console.error(`❌ Port ${port} is still in use after cleanup attempt.`);
        console.error(`💡 Soluções:`);
        console.error(`   1. Execute: pkill -f "tsx server/index.ts"`);
        console.error(`   2. Ou reinicie o Replit`);
        console.error(`   3. Ou aguarde alguns segundos e tente novamente`);
        reject(error);
      } else {
        console.error("❌ Server error:", error);
        reject(error);
      }
    });
  });
}

// START SERVER IMMEDIATELY - Before any heavy logic
startServer(PORT).catch((error) => {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
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
      try {
        serveStatic(app);
        console.log("✅ Static files configured");
      } catch (error) {
        console.error("❌ Failed to setup static files:", error);
        // Don't crash - server can still serve API routes
      }
    } else {
      // Em desenvolvimento, setup Vite middleware para servir o frontend
      try {
        await setupVite(app, httpServer);
        console.log("✅ Vite middleware configured for frontend");
      } catch (error) {
        console.error("❌ Failed to setup Vite:", error);
        throw error;
      }
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
