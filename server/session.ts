import session from "express-session";
import connectPg from "connect-pg-simple";
import MemoryStore from "memorystore";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Configure Neon for Node.js environment
neonConfig.webSocketConstructor = ws;

// Use NEON_DATABASE_URL (custom name that Replit won't override)
const getDatabaseUrl = () => {
  const url = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error("[SESSION] NEON_DATABASE_URL must be set. Add it in Replit Secrets.");
  }
  return url;
};

// Create a shared pool for sessions using Neon's serverless driver
let sessionPool: Pool | null = null;

function getSessionPool() {
  if (!sessionPool) {
    const dbUrl = getDatabaseUrl();
    sessionPool = new Pool({
      connectionString: dbUrl,
    });
    console.log("[SESSION] Created Neon pool for sessions");
  }
  return sessionPool;
}

export function getSession() {
  const sessionTtl = 30 * 24 * 60 * 60 * 1000; // 30 days
  
  // Detect environment
  const isProd = process.env.NODE_ENV === "production";
  const isDev = !isProd;
  
  // CRÍTICO: Configuração de cookie por ambiente
  // DEV (localhost):
  //   - secure: false (HTTP localhost)
  //   - sameSite: 'lax' (permite cookies em requisições cross-site do mesmo site)
  // PROD (Fly.io):
  //   - secure: true (HTTPS obrigatório)
  //   - sameSite: 'none' (necessário para cross-site com HTTPS)
  const isSecure = isProd;
  const sameSite: "lax" | "strict" | "none" = isProd ? "none" : "lax";

  // Validate SESSION_SECRET
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error("SESSION_SECRET is required. Set it in your environment variables.");
  }

  // Log configuration for debugging
  console.log("[SESSION] ===== Session Configuration =====");
  console.log("[SESSION] Environment:", isProd ? "PRODUCTION" : "DEVELOPMENT");
  console.log("[SESSION] NODE_ENV:", process.env.NODE_ENV || "undefined");
  console.log("[SESSION] Cookie secure:", isSecure, isProd ? "(HTTPS required)" : "(HTTP localhost)");
  console.log("[SESSION] Cookie sameSite:", sameSite, isProd ? "(cross-site with HTTPS)" : "(same-site HTTP)");
  console.log("[SESSION] ==================================");

  let store: session.Store;

  if (isProd) {
    // Production: Use PostgreSQL store
    const pgStore = connectPg(session);
    const dbUrl = getDatabaseUrl();
    console.log(`[SESSION] Connecting to PostgreSQL: ${dbUrl.replace(/:[^:@]+@/, ':****@')}`);
    
    store = new pgStore({
      pool: getSessionPool(),
      createTableIfMissing: false,
      ttl: sessionTtl,
      tableName: "sessions",
    });
    console.log("[SESSION] Using PostgreSQL session store");
  } else {
    // Development: Use in-memory store (faster, no DB connection issues)
    const MemStore = MemoryStore(session);
    store = new MemStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    console.log("[SESSION] Using in-memory session store (development)");
  }

  const sessionConfig: session.SessionOptions = {
    secret: sessionSecret,
    name: 'anotatudo.sid', // Nome do cookie (mudado de connect.sid)
    store,
    resave: false,
    saveUninitialized: false,
    // CRÍTICO: proxy deve ser true quando há proxy reverso (Fly.io) ou Vite proxy
    // Em DEV, pode ser true se o Vite proxy estiver configurado corretamente
    // Em PROD, deve ser true porque Fly.io usa proxy reverso
    proxy: true, // true para funcionar com proxy reverso (Vite em DEV, Fly.io em PROD)
    cookie: {
      httpOnly: true,
      secure: isSecure, // false em DEV, true em PROD
      sameSite: sameSite, // 'lax' em DEV, 'none' em PROD
      maxAge: sessionTtl,
      path: '/', // CRÍTICO: path explícito para garantir que cookie seja enviado
      // Em dev, não definir domain (permite localhost)
      // Em prod, deixar undefined para usar o domínio da requisição
    },
  };

  console.log("[SESSION] Cookie configuration:", {
    name: sessionConfig.name,
    secure: sessionConfig.cookie?.secure,
    sameSite: sessionConfig.cookie?.sameSite,
    httpOnly: sessionConfig.cookie?.httpOnly,
    path: sessionConfig.cookie?.path,
    maxAge: sessionConfig.cookie?.maxAge,
    proxy: sessionConfig.proxy,
  });

  return session(sessionConfig);
}
