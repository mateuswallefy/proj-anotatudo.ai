import session from "express-session";
import connectPg from "connect-pg-simple";

// Use NEON_DATABASE_URL (custom name that Replit won't override)
// Throws error if neither is set - fail fast instead of silently using wrong DB
const getDatabaseUrl = () => {
  const url = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error("[SESSION] NEON_DATABASE_URL must be set. Add it in Replit Secrets.");
  }
  return url;
};

export function getSession() {
  const sessionTtl = 30 * 24 * 60 * 60 * 1000; // 30 days
  const pgStore = connectPg(session);

  const isReplit = process.env.REPL_SLUG !== undefined;
  const isProd = process.env.NODE_ENV === "production";

  // Secure apenas em PRODUÇÃO REAL, nunca no autoscale (replit)
  const isSecure = isProd && !isReplit;

  const dbUrl = getDatabaseUrl();
  console.log("[SESSION] Secure:", isSecure);
  console.log(`[SESSION] Connecting to: ${dbUrl.replace(/:[^:@]+@/, ':****@')}`);

  const sessionStore = new pgStore({
    conString: dbUrl,
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
