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
  const isReplit = process.env.REPL_SLUG !== undefined;
  const isProd = process.env.NODE_ENV === "production";
  const isDev = !isProd;
  
  // In production (Fly.io), we use HTTPS, so secure cookies are required
  // In development (localhost), we use HTTP, so secure must be false
  const isSecure = isProd && !isReplit;
  
  // sameSite configuration:
  // - "lax" for development (localhost HTTP)
  // - "none" for production with HTTPS and proxy (Fly.io)
  // - "lax" for Replit (if needed)
  const sameSite: "lax" | "strict" | "none" = isProd && !isReplit ? "none" : "lax";

  // Validate SESSION_SECRET
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error("SESSION_SECRET is required. Set it in your environment variables.");
  }

  // Log configuration for debugging
  console.log("[SESSION] ===== Session Configuration =====");
  console.log("[SESSION] Environment:", isProd ? "PRODUCTION" : "DEVELOPMENT");
  console.log("[SESSION] NODE_ENV:", process.env.NODE_ENV || "undefined");
  console.log("[SESSION] Is Replit:", isReplit);
  console.log("[SESSION] Cookie secure:", isSecure);
  console.log("[SESSION] Cookie sameSite:", sameSite);
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
    name: 'connect.sid', // Nome explícito do cookie
    store,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isSecure,
      sameSite: sameSite,
      maxAge: sessionTtl,
      // Em dev, não definir domain (permite localhost)
      // Em prod, deixar undefined para usar o domínio da requisição
    },
  };

  console.log("[SESSION] Cookie configuration:", {
    name: sessionConfig.name,
    secure: sessionConfig.cookie?.secure,
    sameSite: sessionConfig.cookie?.sameSite,
    httpOnly: sessionConfig.cookie?.httpOnly,
    maxAge: sessionConfig.cookie?.maxAge,
  });

  return session(sessionConfig);
}
