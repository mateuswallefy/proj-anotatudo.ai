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
  const isReplit = process.env.REPL_SLUG !== undefined;
  const isProd = process.env.NODE_ENV === "production";

  // Validate SESSION_SECRET
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error("SESSION_SECRET is required. Set it in your environment variables.");
  }

  // Secure apenas em PRODUÇÃO REAL, nunca no autoscale (replit)
  const isSecure = isProd && !isReplit;

  console.log("[SESSION] Secure:", isSecure);
  console.log("[SESSION] Environment:", isProd ? "PRODUCTION" : "DEVELOPMENT");

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

  return session({
    secret: sessionSecret,
    store,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}
