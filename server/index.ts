// ============================================
// CARREGAR VARIÁVEIS DE AMBIENTE PRIMEIRO
// ============================================
// IMPORTANTE: Isso DEVE ser o primeiro import/execução
// para garantir que .env.local seja carregado antes de
// qualquer módulo que use process.env
import dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

const isDev = process.env.NODE_ENV !== "production";

// Carrega variáveis locais SOMENTE em desenvolvimento
// Em produção, as variáveis vêm do ambiente (Fly.io, etc)
if (isDev) {
  const envPath = path.resolve(process.cwd(), ".env.local");
  const envExists = fs.existsSync(envPath);
  
  if (envExists) {
    const result = dotenv.config({ path: envPath });
    if (result.error) {
      console.error("❌ [ENV] Erro ao carregar .env.local:", result.error.message);
    } else {
      console.log("✅ [ENV] .env.local carregado com sucesso");
      
      // Validar variáveis críticas
      const hasNeonUrl = !!(process.env.NEON_DATABASE_URL || process.env.DATABASE_URL);
      const hasSessionSecret = !!process.env.SESSION_SECRET;
      
      console.log("✅ [ENV] Variáveis carregadas:");
      console.log(`   - NEON_DATABASE_URL: ${hasNeonUrl ? '✅ definida' : '❌ NÃO definida'}`);
      console.log(`   - SESSION_SECRET: ${hasSessionSecret ? '✅ definida' : '❌ NÃO definida'}`);
      console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
      
      if (!hasNeonUrl) {
        console.warn("⚠️  [ENV] AVISO: NEON_DATABASE_URL ou DATABASE_URL não encontrada!");
        console.warn("⚠️  [ENV] Certifique-se de que .env.local contém NEON_DATABASE_URL");
      }
      
      if (!hasSessionSecret) {
        console.warn("⚠️  [ENV] AVISO: SESSION_SECRET não encontrada!");
        console.warn("⚠️  [ENV] Certifique-se de que .env.local contém SESSION_SECRET");
      }
    }
  } else {
    console.warn("⚠️  [ENV] Arquivo .env.local não encontrado em:", envPath);
    console.warn("⚠️  [ENV] O servidor pode falhar se as variáveis não estiverem definidas");
  }
  
  // Log adicional para debug (sem vazar secrets)
  const envCount = Object.keys(process.env).filter(k => 
    k.includes('DATABASE') || k.includes('SESSION') || k.includes('NODE_ENV')
  ).length;
  console.log(`✅ [ENV] Total de variáveis de ambiente relacionadas: ${envCount}`);
} else {
  console.log("✅ [ENV] Ambiente de produção - variáveis vêm do ambiente do sistema");
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
// /api/health detalhado será registrado em routes.ts após middlewares

// Get PORT from environment
// - Em produção: Fly.io define process.env.PORT automaticamente
// - Em desenvolvimento: SEMPRE usa porta 5050 fixa (ignora PORT do .env.local)
//   Isso evita conflito com ControlCe do macOS na porta 5000
const PORT = isProd 
  ? Number(process.env.PORT) || 3000
  : 5050; // Porta fixa em DEV - NUNCA usar 5000 (ocupada pelo ControlCe do macOS)

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
    // 1. Trust proxy - CRÍTICO para cookies funcionarem corretamente
    // Necessário em PROD (Fly.io) e pode ajudar em DEV com proxy do Vite
    app.set("trust proxy", 1);
    console.log("✅ Trust proxy enabled (required for cookies)");
    
    // 2. CORS PRIMEIRO - permite requisições do frontend
    // CRÍTICO: Origin explícito em DEV para garantir cookies funcionem
    const corsOptions = {
      origin: isProd
        ? ["https://anotatudo.com", "https://www.anotatudo.com"]
        : ["http://localhost:5173", "http://127.0.0.1:5173"], // Origin explícito em DEV
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
    // CRÍTICO: Bind para 0.0.0.0 em DEV e PROD
    // - DEV: 0.0.0.0 permite que o Vite proxy (que roda em processo separado) se conecte
    // - PROD: 0.0.0.0 necessário para Fly.io aceitar conexões externas
    // O CORS ainda protege permitindo apenas origens específicas
    const bindAddress = "0.0.0.0";
    
    httpServer.listen(PORT, bindAddress, () => {
      if (isProd) {
        console.log(`✅ Servidor rodando na porta ${PORT} (bind: 0.0.0.0)`);
        console.log(`✅ Ambiente: PRODUÇÃO`);
      } else {
        // Validação: garantir que está usando porta 5050 em DEV
        if (PORT !== 5050) {
          console.error(`❌ ERRO: Backend DEV deve usar porta 5050, mas está tentando usar ${PORT}`);
          console.error(`❌ Isso causará conflito com ControlCe do macOS na porta 5000`);
          process.exit(1);
        }
        console.log(`🚀 Backend DEV rodando em http://0.0.0.0:5050 (bind: 0.0.0.0)`);
        console.log(`✅ Acessível via: http://127.0.0.1:5050 ou http://localhost:5050`);
        console.log(`✅ Ambiente: DESENVOLVIMENTO`);
        console.log(`✅ Frontend: http://127.0.0.1:5173`);
        console.log(`✅ Proxy configurado: /api → http://127.0.0.1:5050`);
        console.log(`✅ CORS permite: http://localhost:5173 e http://127.0.0.1:5173`);
        console.log(`✅ Porta 5050 evita conflito com ControlCe do macOS na porta 5000`);
      }
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
        console.error(`❌ Porta ${PORT} já está em uso.`);
        if (!isProd) {
          console.error(`💡 Soluções para DEV:`);
          console.error(`   1. Execute: lsof -ti:${PORT} | xargs kill -9`);
          console.error(`   2. Ou execute: pkill -f "tsx server/index.ts"`);
          console.error(`   3. Ou altere a porta no .env.local: PORT=5051`);
        } else {
          console.error(`💡 Soluções para PROD:`);
          console.error(`   1. Verifique se há outro processo usando a porta`);
          console.error(`   2. Aguarde alguns segundos e tente novamente`);
        }
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
