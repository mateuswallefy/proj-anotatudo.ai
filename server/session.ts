import session from "express-session";
import connectPg from "connect-pg-simple";

// NEON DATABASE URL - This is the ONLY source of truth for the database connection
const NEON_DATABASE_URL = "postgresql://neondb_owner:npg_TlZvP3kd2icV@ep-plain-art-acnjwa7b-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require";

export function getSession() {
  const sessionTtl = 30 * 24 * 60 * 60 * 1000; // 30 days
  const pgStore = connectPg(session);

  const isReplit = process.env.REPL_SLUG !== undefined;
  const isProd = process.env.NODE_ENV === "production";

  // Secure apenas em PRODUÇÃO REAL, nunca no autoscale (replit)
  const isSecure = isProd && !isReplit;

  console.log("[SESSION] Secure:", isSecure);
  console.log(`[SESSION] Connecting to: ${NEON_DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);

  const sessionStore = new pgStore({
    conString: NEON_DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
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
