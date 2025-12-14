// ============================================
// CARREGAR VARIÁVEIS DE AMBIENTE PRIMEIRO
// ============================================
// IMPORTANTE: Isso DEVE ser o primeiro import/execução
// para garantir que .env.local seja carregado antes de
// qualquer módulo que use process.env
import dotenv from "dotenv";

// Carrega variáveis locais SOMENTE em desenvolvimento
// Em produção, as variáveis vêm do ambiente (Fly.io, etc)
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: ".env.local" });
  console.log("✅ [ENV] Carregado .env.local para desenvolvimento");
}

// ============================================
// IMPORTS APÓS CARREGAR ENV
// ============================================
import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import { registerRoutes } from "./routes.js";
import { getSession } from "./session.js";
import { seedAdmin } from "./seedAdmin.js";
import { ensureAdminRootExists } from "./adminRootProtection.js";
import { ensureWebhookEventsTable } from "./ensureWebhookEventsTable.js";
import { ensureEventosTable } from "./ensureEventosTable.js";
import { initializeDatabaseAsync } from "./db.js";
import { processarLembretes } from "./lembretes.js";
// Import static file serving (NO Vite dependency - safe for production)
import { serveStatic, log } from "./static.js";

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// Healthchecks INSTANTÂNEOS — precisam ser as primeiras rotas
// IMPORTANTE: Estas rotas devem estar ANTES de qualquer middleware
// para garantir resposta instantânea sem dependências
// Em produção, "/health" é usado pelo Replit para healthcheck
// A rota "/" será servida pelo serveStatic (index.html da aplicação)
app.get("/health", (req, res) => res.status(200).send("OK"));
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Get PORT from environment or default to 3000
// Fly.io sets process.env.PORT automatically
const PORT = Number(process.env.PORT) || 3000;

// Create HTTP server
const httpServer = http.createServer(app);

// Database setup - seeds, tables, etc (runs after DB is initialized)
async function runDatabaseSetup(logFn?: (message: string, source?: string) => void) {
  try {
    await Promise.allSettled([
      seedAdmin(),
      ensureAdminRootExists(),
      ensureWebhookEventsTable(),
      ensureEventosTable(),
    ]);
    
    if (logFn) {
      logFn("✅ Database setup complete", "SERVER");
    } else {
      console.log("✅ Database setup complete");
    }
  } catch (error) {
    console.error("Database setup error:", error);
  }
}

// Main startup function
(async () => {
  try {
    // Validate required environment variables
    if (isProd && !process.env.SESSION_SECRET) {
      throw new Error("SESSION_SECRET is required in production. Set it in your environment variables.");
    }
    
    // Initialize database connection FIRST (before routes that might use it)
    await initializeDatabaseAsync();

    // Setup static files in production ONLY
    // In development, Vite runs separately on port 5173
    // Note: serveStatic is imported from static.js which has NO Vite dependency
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
    
    // ============================================
    // MIDDLEWARES - ORDEM CRÍTICA
    // ============================================
    // 1. CORS PRIMEIRO - permite requisições do frontend
    const corsOptions = {
      origin: isProd 
        ? ["https://anotatudo.com", "https://www.anotatudo.com"]
        : ["http://localhost:5173", "http://localhost:3000"],
      credentials: true, // CRÍTICO: permite cookies
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    };
    app.use(cors(corsOptions));
    console.log("✅ CORS configured:", {
      origin: corsOptions.origin,
      credentials: corsOptions.credentials,
      environment: isProd ? "PRODUCTION" : "DEVELOPMENT"
    });
    
    // 2. Trust proxy APENAS em produção
    if (isProd) {
      app.set("trust proxy", 1);
      console.log("✅ Trust proxy enabled (production)");
    } else {
      console.log("✅ Trust proxy disabled (development)");
    }
    
    // 3. Body parsers
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    
    // 4. Session middleware - DEVE vir ANTES das rotas
    app.use("/api", getSession());
    app.use("/admin", getSession());
    
    // Debug middleware para logar todas as requisições /api em DEV
    if (!isProd) {
      app.use("/api", (req, res, next) => {
        console.log("[API REQUEST]", {
          method: req.method,
          path: req.path,
          url: req.url,
          origin: req.headers.origin,
          cookies: req.headers.cookie || 'none',
          hasSession: !!req.session,
          sessionId: req.sessionID || 'undefined',
        });
        next();
      });
    }
    
    // 5. Register routes AFTER middlewares (CORS, body parsers, session)
    await registerRoutes(app);
    
    // Start HTTP server
    // Fly.io requires binding to 0.0.0.0 (all interfaces) and using process.env.PORT
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Servidor rodando na porta ${PORT} (bind: 0.0.0.0)`);
      console.log(`✅ Ambiente: ${isProd ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}`);
      console.log(`ready`);
      
      // Run seeds and database setup AFTER server is listening (non-blocking)
      runDatabaseSetup(isProd ? log : undefined).catch((error) => {
        console.error("Database setup error:", error);
      });
      
      // Iniciar job de lembretes (executa a cada minuto)
      console.log("✅ Job de lembretes iniciado (executa a cada 1 minuto)");
      setInterval(() => {
        processarLembretes().catch((error) => {
          console.error("[Lembretes] Erro no job de lembretes:", error);
        });
      }, 60000); // 1 minuto
      
      // Executar imediatamente também
      processarLembretes().catch((error) => {
        console.error("[Lembretes] Erro na execução inicial de lembretes:", error);
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
