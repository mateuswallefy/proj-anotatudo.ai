import session from "express-session";
import connectPg from "connect-pg-simple";

export function getSession() {
  const sessionTtl = 30 * 24 * 60 * 60 * 1000; // 30 days
  const pgStore = connectPg(session);

  const isReplit = process.env.REPL_SLUG !== undefined;
  const isProd = process.env.NODE_ENV === "production";

  // Secure apenas em PRODUÇÃO REAL, nunca no autoscale (replit)
  const isSecure = isProd && !isReplit;

  console.log("[SESSION] Secure:", isSecure);

  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
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
